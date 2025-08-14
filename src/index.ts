export type { Serde } from "@/types/index.js";
export type { Result } from "@rustify/result";

import {
  createArraySerde,
  createObjectSerde,
  createRecordSerde,
  createTupleSerde,
  createUnionSerde,
} from "@/serializers/complex.js";
import { createSerde } from "@/serializers/index.js";
import {
  createDefaultSerde,
  createLazySerde,
  createMappedSerde,
  createNullableSerde,
  createOptionalSerde,
  createRenameSerde,
} from "@/serializers/modifiers.js";
import {
  createBooleanSerde,
  createDateSerde,
  createEnumSerde,
  createLiteralSerde,
  createNumberSerde,
  createStringSerde,
} from "@/serializers/primitives.js";
import type { Serde } from "@/types/index.js";
import { Err, Ok } from "@rustify/result";

// Throwing mode exports - simple names for ergonomic usage
export const string: Serde<string, string> = createStringSerde().throwing;
export const number: Serde<number, number> = createNumberSerde().throwing;
export const boolean: Serde<boolean, boolean> = createBooleanSerde().throwing;
export const date: Serde<Date, string> = createDateSerde().throwing;

export const literal = <T extends string | number | boolean>(
  literal: T,
): Serde<T, T> => createLiteralSerde(literal).throwing;

export const enumSerde = <T extends Record<string, string | number>>(
  enumObject: T,
): Serde<T[keyof T], T[keyof T]> => createEnumSerde(enumObject).throwing;

// Helper to create dual-mode serializers that we can use internally
type DualSerde<T, S> = ReturnType<typeof createSerde<T, S>>;

export const object = <T extends Record<string, unknown>>(
  fields: { [K in keyof T]: Serde<T[K], unknown> },
): Serde<T, Record<string, unknown>> => {
  const fieldSerdes: { [K in keyof T]: DualSerde<T[K], unknown> } = {} as never;
  for (const key in fields) {
    // Convert throwing serde to dual serde by wrapping in a safe interface
    const safeSerde = {
      serialize: fields[key].serialize,
      deserialize: (s: unknown) => {
        try {
          return Ok(fields[key].deserialize(s));
        } catch (error) {
          return Err(error instanceof Error ? error.message : String(error));
        }
      },
    };
    fieldSerdes[key] = createSerde(safeSerde) as never;
  }
  return createObjectSerde(fieldSerdes).throwing as Serde<
    T,
    Record<string, unknown>
  >;
};

export const array = <T>(
  itemSerde: Serde<T, unknown>,
): Serde<T[], unknown[]> => {
  const safeSerde = {
    serialize: itemSerde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(itemSerde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createArraySerde(createSerde(safeSerde)).throwing as Serde<
    T[],
    unknown[]
  >;
};

export const tuple = <T extends readonly unknown[]>(
  ...serdes: { [K in keyof T]: Serde<T[K], unknown> }
): Serde<T, unknown[]> => {
  const dualSerdes = serdes.map((serde) => {
    const safeSerde = {
      serialize: serde.serialize,
      deserialize: (s: unknown) => {
        try {
          return Ok(serde.deserialize(s));
        } catch (error) {
          return Err(error instanceof Error ? error.message : String(error));
        }
      },
    };
    return createSerde(safeSerde);
  }) as {
    [K in keyof T]: DualSerde<T[K], unknown>;
  };
  return createTupleSerde(...(dualSerdes as any)).throwing as Serde<
    T,
    unknown[]
  >;
};

export const union = <T extends Record<string, unknown>>(
  variants: { [K in keyof T]: Serde<T[K], unknown> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): Serde<T[keyof T], unknown> => {
  const dualVariants: { [K in keyof T]: DualSerde<T[K], unknown> } =
    {} as never;
  for (const key in variants) {
    const safeSerde = {
      serialize: variants[key].serialize,
      deserialize: (s: unknown) => {
        try {
          return Ok(variants[key].deserialize(s));
        } catch (error) {
          return Err(error instanceof Error ? error.message : String(error));
        }
      },
    };
    dualVariants[key] = createSerde(safeSerde) as never;
  }
  return createUnionSerde(dualVariants as never, tagExtractor, tagField)
    .throwing as Serde<T[keyof T], unknown>;
};

export const record = <T>(
  valueSerde: Serde<T, unknown>,
): Serde<Record<string, T>, Record<string, unknown>> => {
  const safeSerde = {
    serialize: valueSerde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(valueSerde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createRecordSerde(createSerde(safeSerde)).throwing as Serde<
    Record<string, T>,
    Record<string, unknown>
  >;
};

export const optional = <T>(
  serde: Serde<T, unknown>,
): Serde<T | undefined, unknown> => {
  const safeSerde = {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(serde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createOptionalSerde(createSerde(safeSerde)).throwing as Serde<
    T | undefined,
    unknown
  >;
};

export const nullable = <T>(
  serde: Serde<T, unknown>,
): Serde<T | null, unknown> => {
  const safeSerde = {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(serde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createNullableSerde(createSerde(safeSerde)).throwing as Serde<
    T | null,
    unknown
  >;
};

export const withDefault = <T>(
  serde: Serde<T, unknown>,
  defaultValue: T,
): Serde<T, unknown> => {
  const safeSerde = {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(serde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createDefaultSerde(createSerde(safeSerde), defaultValue)
    .throwing as Serde<T, unknown>;
};

export const mapped = <T, K extends keyof T>(
  serde: Serde<T, unknown>,
  mapping: Record<string, K>,
): Serde<T, Record<string, unknown>> => {
  const safeSerde = {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(serde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createMappedSerde(createSerde(safeSerde), mapping).throwing as Serde<
    T,
    Record<string, unknown>
  >;
};

export const lazy = <T>(
  getSerdeFactory: () => Serde<T, unknown>,
): Serde<T, unknown> => {
  const getDualSerdeFactory = () => {
    const serde = getSerdeFactory();
    const safeSerde = {
      serialize: serde.serialize,
      deserialize: (s: unknown) => {
        try {
          return Ok(serde.deserialize(s));
        } catch (error) {
          return Err(error instanceof Error ? error.message : String(error));
        }
      },
    };
    return createSerde(safeSerde);
  };
  return createLazySerde(getDualSerdeFactory).throwing as Serde<T, unknown>;
};

export const rename = <T, K extends keyof T>(
  serde: Serde<T, unknown>,
  fieldMapping: Partial<Record<K, string>>,
): Serde<T, unknown> => {
  const safeSerde = {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      try {
        return Ok(serde.deserialize(s));
      } catch (error) {
        return Err(error instanceof Error ? error.message : String(error));
      }
    },
  };
  return createRenameSerde(createSerde(safeSerde), fieldMapping)
    .throwing as Serde<T, unknown>;
};
