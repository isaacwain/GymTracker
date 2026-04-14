"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DataPoint = {
  timestamp: number;
  date: string;
  maxWeight: number;
  totalVolume: number;
  estimated1RM: number;
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateFull(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function yDomain(values: number[]): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || max * 0.1;
  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
}

export default function ProgressChart({ data }: { data: DataPoint[] }) {
  const timestamps = data.map((d) => d.timestamp);
  const domain: [number, number] = [Math.min(...timestamps), Math.max(...timestamps)];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Max Weight &amp; Estimated 1RM (kg)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={domain}
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} unit="kg" domain={yDomain([...data.map(d => d.maxWeight), ...data.map(d => d.estimated1RM)])} />
            <Tooltip
              labelFormatter={(v) => formatDateFull(v as number)}
              formatter={(v, name) => [
                `${v}kg`,
                name === "maxWeight" ? "Max weight" : "Est. 1RM",
              ]}
            />
            <Legend
              formatter={(value) => value === "maxWeight" ? "Max weight" : "Est. 1RM"}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="maxWeight"
              name="maxWeight"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="estimated1RM"
              name="estimated1RM"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-3">Total Volume (kg)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="kg" domain={yDomain(data.map(d => d.totalVolume))} />
            <Tooltip formatter={(v) => [`${v}kg`, "Total volume"]} />
            <Bar dataKey="totalVolume" fill="#93c5fd" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
