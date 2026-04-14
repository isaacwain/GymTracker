import { prisma } from "./prisma";
import { MuscleGroup, MovementPattern } from "@prisma/client";

export type MuscleClassification = "underworked" | "balanced" | "high" | "overworked";

export type MuscleScore = {
  muscle: MuscleGroup;
  score: number;
  classification: MuscleClassification;
};

export type MovementPatternCount = {
  pattern: MovementPattern;
  count: number;
};

export type RedundancyWarning = {
  family: string;
  count: number;
  exerciseNames: string[];
};

export type RoutineAnalysis = {
  routineId: number;
  routineName: string;
  templateCount: number;
  totalExercises: number;
  muscleScores: MuscleScore[];
  movementPatternCounts: MovementPatternCount[];
  missingPatterns: MovementPattern[];
  pushPullImbalance: string | null;
  noCoreWork: boolean;
  compoundCount: number;
  isolationCount: number;
  isolationDominanceWarning: boolean;
  redundancyWarnings: RedundancyWarning[];
  secondaryOverlapWarnings: { muscle: MuscleGroup; totalStimulus: number }[];
  suggestions: string[];
};

function classifyScore(score: number): MuscleClassification {
  if (score < 2) return "underworked";
  if (score <= 5) return "balanced";
  if (score <= 8) return "high";
  return "overworked";
}

export async function analyzeRoutine(
  routineId: number,
  clerkUserId: string
): Promise<RoutineAnalysis | null> {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      templates: {
        orderBy: { orderIndex: "asc" },
        include: {
          template: {
            include: {
              exercises: {
                orderBy: { orderIndex: "asc" },
                include: {
                  exercise: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!routine || routine.clerkUserId !== clerkUserId) return null;

  // Collect all exercises across all templates (allow duplicates — they contribute stimulus)
  const allExercises = routine.templates.flatMap((rt) =>
    rt.template.exercises.map((te) => te.exercise)
  );

  const totalExercises = allExercises.length;

  // --- Muscle scores ---
  const muscleScoreMap = new Map<MuscleGroup, number>();

  for (const ex of allExercises) {
    if (ex.primaryMuscle) {
      muscleScoreMap.set(
        ex.primaryMuscle,
        (muscleScoreMap.get(ex.primaryMuscle) ?? 0) + 1.0
      );
    }
    for (const sm of ex.secondaryMuscles) {
      muscleScoreMap.set(sm, (muscleScoreMap.get(sm) ?? 0) + 0.5);
    }
  }

  const muscleScores: MuscleScore[] = Array.from(muscleScoreMap.entries())
    .map(([muscle, score]) => ({
      muscle,
      score,
      classification: classifyScore(score),
    }))
    .sort((a, b) => b.score - a.score);

  // --- Movement patterns ---
  const patternCountMap = new Map<MovementPattern, number>();
  for (const ex of allExercises) {
    if (ex.movementPattern) {
      patternCountMap.set(
        ex.movementPattern,
        (patternCountMap.get(ex.movementPattern) ?? 0) + 1
      );
    }
  }

  const movementPatternCounts: MovementPatternCount[] = Array.from(
    patternCountMap.entries()
  ).map(([pattern, count]) => ({ pattern, count }));

  const requiredPatterns: MovementPattern[] = [
    MovementPattern.SQUAT,
    MovementPattern.HINGE,
    MovementPattern.HORIZONTAL_PULL,
    MovementPattern.VERTICAL_PULL,
  ];

  const missingPatterns = requiredPatterns.filter(
    (p) => !patternCountMap.has(p) || patternCountMap.get(p)! === 0
  );

  const noCoreWork =
    !patternCountMap.has(MovementPattern.ROTATION) &&
    (muscleScoreMap.get(MuscleGroup.CORE) ?? 0) +
      (muscleScoreMap.get(MuscleGroup.ABS) ?? 0) <
      0.5;

  const pushCount =
    (patternCountMap.get(MovementPattern.HORIZONTAL_PUSH) ?? 0) +
    (patternCountMap.get(MovementPattern.VERTICAL_PUSH) ?? 0);
  const pullCount =
    (patternCountMap.get(MovementPattern.HORIZONTAL_PULL) ?? 0) +
    (patternCountMap.get(MovementPattern.VERTICAL_PULL) ?? 0);

  let pushPullImbalance: string | null = null;
  if (pushCount > 0 && pullCount > 0) {
    if (pushCount > pullCount * 1.5) {
      pushPullImbalance = `Push patterns (${pushCount}) exceed pull patterns (${pullCount}) by more than 50%.`;
    } else if (pullCount > pushCount * 1.5) {
      pushPullImbalance = `Pull patterns (${pullCount}) exceed push patterns (${pushCount}) by more than 50%.`;
    }
  } else if (pushCount > 0 && pullCount === 0) {
    pushPullImbalance = `Routine has push patterns (${pushCount}) but no pull patterns.`;
  } else if (pullCount > 0 && pushCount === 0) {
    pushPullImbalance = `Routine has pull patterns (${pullCount}) but no push patterns.`;
  }

  // --- Compound / isolation ---
  let compoundCount = 0;
  let isolationCount = 0;
  for (const ex of allExercises) {
    if (ex.isCompound === true) compoundCount++;
    else if (ex.isCompound === false) isolationCount++;
  }
  const isolationDominanceWarning = isolationCount > compoundCount * 2;

  // --- Redundancy (by exerciseFamily) ---
  const familyMap = new Map<string, string[]>();
  for (const ex of allExercises) {
    if (ex.exerciseFamily) {
      const names = familyMap.get(ex.exerciseFamily) ?? [];
      names.push(ex.name);
      familyMap.set(ex.exerciseFamily, names);
    }
  }

  const redundancyWarnings: RedundancyWarning[] = [];
  for (const [family, names] of familyMap.entries()) {
    if (names.length >= 3) {
      redundancyWarnings.push({ family, count: names.length, exerciseNames: names });
    }
  }

  // --- Secondary overlap ---
  const overlapMuscles: MuscleGroup[] = [
    MuscleGroup.TRICEPS,
    MuscleGroup.BICEPS,
    MuscleGroup.SHOULDERS,
  ];
  const secondaryOverlapWarnings: { muscle: MuscleGroup; totalStimulus: number }[] = [];
  for (const muscle of overlapMuscles) {
    const stimulus = muscleScoreMap.get(muscle) ?? 0;
    if (stimulus > 4.0) {
      secondaryOverlapWarnings.push({ muscle, totalStimulus: stimulus });
    }
  }

  // --- Suggestions (first-order only) ---
  const suggestions: string[] = [];

  if (missingPatterns.length > 0) {
    const labels: Record<MovementPattern, string> = {
      SQUAT: "squat",
      HINGE: "hinge",
      HORIZONTAL_PULL: "horizontal pull",
      VERTICAL_PULL: "vertical pull",
      HORIZONTAL_PUSH: "horizontal push",
      VERTICAL_PUSH: "vertical push",
      ISOLATION: "isolation",
      CARRY: "carry",
      ROTATION: "rotation",
    };
    const missing = missingPatterns.map((p) => labels[p]).join(", ");
    suggestions.push(
      `Add at least one exercise covering: ${missing}. These are foundational movement patterns for a balanced program.`
    );
  }

  if (noCoreWork) {
    suggestions.push(
      "No core or rotation work detected. Add a core exercise (e.g. plank, cable rotation, hanging leg raise) to each training day."
    );
  }

  if (pushPullImbalance) {
    suggestions.push(
      `Push/pull imbalance detected. ${pushPullImbalance} Balance push and pull volumes to reduce injury risk and promote symmetry.`
    );
  }

  if (isolationDominanceWarning) {
    suggestions.push(
      `Isolation exercises (${isolationCount}) outnumber compound exercises (${compoundCount}) by more than 2:1. Prioritise compound movements for greater hormonal response and efficiency.`
    );
  }

  for (const rw of redundancyWarnings) {
    suggestions.push(
      `"${rw.family}" family has ${rw.count} exercises (${rw.exerciseNames.join(", ")}). Consider replacing some with exercises from different families to broaden stimulus.`
    );
  }

  for (const ow of secondaryOverlapWarnings) {
    suggestions.push(
      `${ow.muscle} accumulates ${ow.totalStimulus.toFixed(1)} total stimulus across templates. High secondary overlap increases fatigue; consider reducing the number of exercises that stress this muscle.`
    );
  }

  const overworkedMuscles = muscleScores.filter(
    (ms) => ms.classification === "overworked"
  );
  for (const ms of overworkedMuscles) {
    if (!secondaryOverlapWarnings.find((ow) => ow.muscle === ms.muscle)) {
      suggestions.push(
        `${ms.muscle} has a very high stimulus score of ${ms.score.toFixed(1)}. Consider spreading volume across more muscle groups.`
      );
    }
  }

  return {
    routineId: routine.id,
    routineName: routine.name,
    templateCount: routine.templates.length,
    totalExercises,
    muscleScores,
    movementPatternCounts,
    missingPatterns,
    pushPullImbalance,
    noCoreWork,
    compoundCount,
    isolationCount,
    isolationDominanceWarning,
    redundancyWarnings,
    secondaryOverlapWarnings,
    suggestions,
  };
}
