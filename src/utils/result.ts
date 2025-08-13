export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, string> => ({ ok: true, value });
export const Err = (error: string): Result<never, string> => ({
  ok: false,
  error,
});

export const wrapThrowingFunction = <T>(fn: () => T): Result<T, string> => {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error instanceof Error ? error.message : String(error));
  }
};
