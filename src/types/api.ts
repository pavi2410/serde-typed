import type { Result } from "@/utils/result.js";

export interface Serializer<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => T;
}

export interface SafeSerializer<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => Result<T, string>;
}
