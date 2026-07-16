export type WorkflowStepType =
  | "command"
  | "warning"
  | "checkbox"
  | "input"
  | "verification";
export type WorkflowDsl = {
  version: string;
  metadata: {
    title: string;
    description: string;
    targetEnvironment?: string;
    estimatedDuration?: number;
  };
  variables: Array<{
    name: string;
    label: string;
    type: "string" | "number" | "boolean";
    defaultValue: string;
    validationRegex?: string;
  }>;
  steps: Array<{
    id: string;
    type: WorkflowStepType;
    title: string;
    content: string;
    payload?: {
      commandString?: string;
      warningLevel?: "info" | "warning" | "critical";
      verificationUrl?: string;
      verificationExpectedResponse?: string;
    };
  }>;
};

export function isWorkflowDsl(value: unknown): value is WorkflowDsl {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.version === "string" &&
    Array.isArray(candidate.variables) &&
    Array.isArray(candidate.steps) &&
    typeof candidate.metadata === "object" &&
    candidate.metadata !== null
  );
}
