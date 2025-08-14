export type { SafeSerde } from "@/types/index.js";
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
import type { SafeSerde } from "@/types/index.js";

// Safe mode exports - same names but returning Result<T, string> for deserialize
export const string: SafeSerde<string, string> = createStringSerde().safe;
export const number: SafeSerde<number, number> = createNumberSerde().safe;
export const boolean: SafeSerde<boolean, boolean> = createBooleanSerde().safe;
export const date: SafeSerde<Date, string> = createDateSerde().safe;

export const literal = <T extends string | number | boolean>(
  literal: T,
): SafeSerde<T, T> => createLiteralSerde(literal).safe;

export const enumSerde = <T extends Record<string, string | number>>(
  enumObject: T,
): SafeSerde<T[keyof T], T[keyof T]> => createEnumSerde(enumObject).safe;

// Helper to create dual-mode serializers that we can use internally
type DualSerde<T, S> = ReturnType<typeof createSerde<T, S>>;

export const object = <T extends Record<string, unknown>>(
  fields: { [K in keyof T]: SafeSerde<T[K], unknown> },
): SafeSerde<T, Record<string, unknown>> => {
  const fieldSerdes: { [K in keyof T]: DualSerde<T[K], unknown> } = {} as never;
  for (const key in fields) {
    fieldSerdes[key] = createSerde(fields[key]) as never;
  }
  return createObjectSerde(fieldSerdes).safe as SafeSerde<
    T,
    Record<string, unknown>
  >;
};

export const array = <T>(
  itemSerde: SafeSerde<T, unknown>,
): SafeSerde<T[], unknown[]> =>
  createArraySerde(createSerde(itemSerde)).safe as SafeSerde<T[], unknown[]>;

export const tuple = <T extends readonly unknown[]>(
  ...serdes: { [K in keyof T]: SafeSerde<T[K], unknown> }
): SafeSerde<T, unknown[]> => {
  const dualSerdes = serdes.map((serde) => createSerde(serde)) as any;
  return createTupleSerde(...dualSerdes).safe as SafeSerde<T, unknown[]>;
};

export const union = <T extends Record<string, unknown>>(
  variants: { [K in keyof T]: SafeSerde<T[K], unknown> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): SafeSerde<T[keyof T], unknown> => {
  const dualVariants: { [K in keyof T]: DualSerde<T[K], unknown> } =
    {} as never;
  for (const key in variants) {
    dualVariants[key] = createSerde(variants[key]) as never;
  }
  return createUnionSerde(dualVariants as never, tagExtractor, tagField)
    .safe as SafeSerde<T[keyof T], unknown>;
};

export const record = <T>(
  valueSerde: SafeSerde<T, unknown>,
): SafeSerde<Record<string, T>, Record<string, unknown>> =>
  createRecordSerde(createSerde(valueSerde)).safe as SafeSerde<
    Record<string, T>,
    Record<string, unknown>
  >;

export const optional = <T>(
  serde: SafeSerde<T, unknown>,
): SafeSerde<T | undefined, unknown> =>
  createOptionalSerde(createSerde(serde)).safe as SafeSerde<
    T | undefined,
    unknown
  >;

export const nullable = <T>(
  serde: SafeSerde<T, unknown>,
): SafeSerde<T | null, unknown> =>
  createNullableSerde(createSerde(serde)).safe as SafeSerde<T | null, unknown>;

export const withDefault = <T>(
  serde: SafeSerde<T, unknown>,
  defaultValue: T,
): SafeSerde<T, unknown> =>
  createDefaultSerde(createSerde(serde), defaultValue).safe as SafeSerde<
    T,
    unknown
  >;

export const mapped = <T, K extends keyof T>(
  serde: SafeSerde<T, unknown>,
  mapping: Record<string, K>,
): SafeSerde<T, Record<string, unknown>> =>
  createMappedSerde(createSerde(serde), mapping).safe as SafeSerde<
    T,
    Record<string, unknown>
  >;

export const lazy = <T>(
  getSerdeFactory: () => SafeSerde<T, unknown>,
): SafeSerde<T, unknown> => {
  const getDualSerdeFactory = () => createSerde(getSerdeFactory());
  return createLazySerde(getDualSerdeFactory).safe as SafeSerde<T, unknown>;
};

export const rename = <T, K extends keyof T>(
  serde: SafeSerde<T, unknown>,
  fieldMapping: Partial<Record<K, string>>,
): SafeSerde<T, unknown> =>
  createRenameSerde(createSerde(serde), fieldMapping).safe as SafeSerde<
    T,
    unknown
  >;
