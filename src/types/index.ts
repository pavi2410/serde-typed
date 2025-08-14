import type { Result } from "@/utils/result.js";

export type Serde<T, S> = {
  serialize(value: T): S;
  deserialize(serialized: unknown): T;
};

export type SafeSerde<T, S> = {
  serialize(value: T): S;
  deserialize(serialized: unknown): Result<T, string>;
};

export type SerdeFunction<T, S> = (value: T) => S;
export type DeserdeFunction<T, S> = (serialized: S) => T;
export type SafeDeserdeFunction<T, S> = (serialized: S) => Result<T, string>;
