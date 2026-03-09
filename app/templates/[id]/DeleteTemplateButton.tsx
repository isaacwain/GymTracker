"use client";

import { deleteTemplate } from "@/app/actions";

export default function DeleteTemplateButton({ templateId }: { templateId: number }) {
  return (
    <button
      onClick={async () => {
        if (confirm("Delete this template?")) {
          await deleteTemplate(templateId);
        }
      }}
      className="text-sm text-red-400 hover:text-red-600"
    >
      Delete template
    </button>
  );
}
