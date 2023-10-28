import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import type { IStoreFormLinear } from "../../../types";

const initial: Omit<IStoreFormLinear, "api"> = {
  error: undefined,
  logs: [],

  streamId: undefined,
  amount: undefined,
  cancelability: true,
  cliff: undefined,
  duration: undefined,
  recipient: undefined,
  token: undefined,
};

const useStoreForm = createWithEqualityFn<IStoreFormLinear>(
  (set) => ({
    ...initial,
    api: {
      log: (value: string) =>
        set((prev) => {
          return {
            logs: [...prev.logs, value],
          };
        }),
      update: (updates: Partial<IStoreFormLinear>) =>
        set((_prev) => {
          return {
            ...updates,
          };
        }),
      reset: () =>
        set((_prev) => {
          return initial;
        }),
    },
  }),
  shallow
);

export { initial };
export default useStoreForm;
