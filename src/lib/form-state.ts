export type ActionState = {
  error?: string;
  message?: string;
  link?: string;
};

export const emptyActionState: ActionState = {};

export function wrapAction<T extends ActionState | void>(fn: (formData: FormData) => Promise<T>) {
  return async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
    const result = await fn(formData);
    return result ?? {};
  };
}
