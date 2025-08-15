import type { Result } from "@rustify/result";

export type Serde<T, S> = {
  serialize(value: T): Result<S, string>;
  deserialize(serialized: unknown): Result<T, string>;
};

export type SerdeFunction<T, S> = (value: T) => Result<S, string>;
export type DeserdeFunction<T, S> = (serialized: S) => Result<T, string>;
