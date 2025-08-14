import type { SafeSerde, Serde } from "@/types/index.js";

export * from "./complex.js";
export * from "./modifiers.js";
export * from "./primitives.js";

export const createSerde = <T, S>(
  safe: SafeSerde<T, S>,
): { safe: SafeSerde<T, S>; throwing: Serde<T, S> } => {
  const throwing: Serde<T, S> = {
    serialize: safe.serialize,
    deserialize: (serialized) => {
      const result = safe.deserialize(serialized);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.value;
    },
  };

  return { safe, throwing };
};
