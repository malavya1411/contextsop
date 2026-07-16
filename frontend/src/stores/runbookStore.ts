import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type StepStatus = "pending" | "active" | "completed" | "skipped";

export interface VerificationLog {
  status: "success" | "failure" | "running";
  message: string;
  timestamp: string;
}

export interface RunbookState {
  sopId: string | null;
  stepsProgress: Record<string, StepStatus>;
  variablesState: Record<string, string>;
  activeStepIndex: number;
  verificationLogs: Record<string, VerificationLog>;

  initializeRun: (sopId: string, stepIds: string[], initialVariables: Record<string, string>) => void;
  updateVariable: (name: string, value: string) => void;
  setStepStatus: (stepId: string, status: StepStatus) => void;
  setActiveStepIndex: (index: number) => void;
  setVerificationLog: (stepId: string, log: VerificationLog) => void;
  resetRun: () => void;
}

export const useRunbookStore = create<RunbookState>()(
  persist(
    (set) => ({
      sopId: null,
      stepsProgress: {},
      variablesState: {},
      activeStepIndex: 0,
      verificationLogs: {},

      initializeRun: (sopId, stepIds, initialVariables) =>
        set((state) => {
          if (state.sopId === sopId) {
            return {};
          }
          const progress: Record<string, StepStatus> = {};
          stepIds.forEach((id, idx) => {
            progress[id] = idx === 0 ? "active" : "pending";
          });
          return {
            sopId,
            stepsProgress: progress,
            variablesState: initialVariables,
            activeStepIndex: 0,
            verificationLogs: {},
          };
        }),

      updateVariable: (name, value) =>
        set((state) => ({
          variablesState: { ...state.variablesState, [name]: value },
        })),

      setStepStatus: (stepId, status) =>
        set((state) => ({
          stepsProgress: { ...state.stepsProgress, [stepId]: status },
        })),

      setActiveStepIndex: (index) =>
        set(() => ({
          activeStepIndex: index,
        })),

      setVerificationLog: (stepId, log) =>
        set((state) => ({
          verificationLogs: { ...state.verificationLogs, [stepId]: log },
        })),

      resetRun: () =>
        set(() => ({
          sopId: null,
          stepsProgress: {},
          variablesState: {},
          activeStepIndex: 0,
          verificationLogs: {},
        })),
    }),
    {
      name: "active-runbook-execution",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
