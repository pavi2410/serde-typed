export type { Result } from "@rustify/result";
export type { Serde } from "@/types.js";

import {
  createArraySerde,
  createObjectSerde,
  createRecordSerde,
  createTupleSerde,
  createUnionSerde,
} from "@/serializers/complex.js";
import {
  createDefaultSerde,
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
import type { Serde } from "@/types.js";

// Result-based serialization exports
export const string: Serde<string, string> = createStringSerde();
export const number: Serde<number, number> = createNumberSerde();
export const boolean: Serde<boolean, boolean> = createBooleanSerde();
export const date: Serde<Date, string> = createDateSerde();

export const literal = <T extends string | number | boolean>(
  literal: T,
): Serde<T, T> => createLiteralSerde(literal);

export const enumSerde = <T extends Record<string, string | number>>(
  enumObject: T,
): Serde<T[keyof T], T[keyof T]> => createEnumSerde(enumObject);

export const object = <T extends Record<string, unknown>>(
  fields: { [K in keyof T]: Serde<T[K], unknown> },
): Serde<T, Record<string, unknown>> =>
  createObjectSerde(fields) as Serde<T, Record<string, unknown>>;

export const array = <T>(itemSerde: Serde<T, unknown>): Serde<T[], unknown[]> =>
  createArraySerde(itemSerde) as Serde<T[], unknown[]>;

export const tuple = <T extends readonly unknown[]>(
  ...serdes: { [K in keyof T]: Serde<T[K], unknown> }
): Serde<T, unknown[]> =>
  createTupleSerde(...(serdes as any)) as Serde<T, unknown[]>;

export const union = <T extends Record<string, unknown>>(
  variants: { [K in keyof T]: Serde<T[K], unknown> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): Serde<T[keyof T], unknown> =>
  createUnionSerde(variants, tagExtractor, tagField) as Serde<
    T[keyof T],
    unknown
  >;

export const record = <T>(
  valueSerde: Serde<T, unknown>,
): Serde<Record<string, T>, Record<string, unknown>> =>
  createRecordSerde(valueSerde) as Serde<
    Record<string, T>,
    Record<string, unknown>
  >;

export const optional = <T>(
  serde: Serde<T, unknown>,
): Serde<T | undefined, unknown> =>
  createOptionalSerde(serde) as Serde<T | undefined, unknown>;

export const nullable = <T>(
  serde: Serde<T, unknown>,
): Serde<T | null, unknown> =>
  createNullableSerde(serde) as Serde<T | null, unknown>;

export const withDefault = <T>(
  serde: Serde<T, unknown>,
  defaultValue: T,
): Serde<T, unknown> =>
  createDefaultSerde(serde, defaultValue) as Serde<T, unknown>;

export const mapped = <T, K extends keyof T>(
  serde: Serde<T, unknown>,
  mapping: Record<string, K>,
): Serde<T, Record<string, unknown>> =>
  createMappedSerde(serde, mapping) as Serde<T, Record<string, unknown>>;

export const rename = <T, K extends keyof T>(
  serde: Serde<T, unknown>,
  fieldMapping: Partial<Record<K, string>>,
): Serde<T, unknown> =>
  createRenameSerde(serde, fieldMapping) as Serde<T, unknown>;
