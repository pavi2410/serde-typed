export type { SafeSerializer } from "@/types/api.js";
export type { Result } from "@/utils/result.js";

import {
  createArraySerializer,
  createObjectSerializer,
  createRecordSerializer,
  createTupleSerializer,
  createUnionSerializer,
} from "@/serializers/complex.js";
import {
  createDefaultSerializer,
  createLazySerializer,
  createMappedSerializer,
  createNullableSerializer,
  createOptionalSerializer,
  createRenameSerializer,
} from "@/serializers/modifiers.js";
import {
  createBooleanSerializer,
  createDateSerializer,
  createEnumSerializer,
  createLiteralSerializer,
  createNumberSerializer,
  createStringSerializer,
} from "@/serializers/primitives.js";
import type { SafeSerializer } from "@/types/api.js";
import { wrapThrowingFunction } from "@/utils/result.js";

// Safe mode exports - same names but returning Result<T, string> for deserialize
export const string: SafeSerializer<string, string> =
  createStringSerializer().safe;
export const number: SafeSerializer<number, number> =
  createNumberSerializer().safe;
export const boolean: SafeSerializer<boolean, boolean> =
  createBooleanSerializer().safe;
export const date: SafeSerializer<Date, string> = createDateSerializer().safe;

export const literal = <T extends string | number | boolean>(
  literal: T,
): SafeSerializer<T, T> => createLiteralSerializer(literal).safe;

export const enumSerializer = <T extends Record<string, string | number>>(
  enumObject: T,
): SafeSerializer<T[keyof T], T[keyof T]> =>
  createEnumSerializer(enumObject).safe;

// Helper to create dual-mode serializers that we can use internally
type DualSerializer<T, S> = {
  throwing: { serialize: (v: T) => S; deserialize: (s: unknown) => T };
  safe: SafeSerializer<T, S>;
};

// Helper function to convert safe serializer to dual serializer
const makeDual = <T, S>(serde: SafeSerializer<T, S>): DualSerializer<T, S> => ({
  throwing: {
    serialize: serde.serialize,
    deserialize: (s: unknown) => {
      const result = serde.deserialize(s);
      if (result.ok) return result.value;
      throw new Error(result.error);
    },
  },
  safe: serde,
});

export const object = <T extends Record<string, unknown>>(
  fields: { [K in keyof T]: SafeSerializer<T[K], unknown> },
): SafeSerializer<T, Record<string, unknown>> => {
  const fieldSerdes: { [K in keyof T]: DualSerializer<T[K], unknown> } =
    {} as never;
  for (const key in fields) {
    fieldSerdes[key] = makeDual(fields[key]) as never;
  }
  return createObjectSerializer(fieldSerdes).safe as SafeSerializer<
    T,
    Record<string, unknown>
  >;
};

export const array = <T>(
  itemSerde: SafeSerializer<T, unknown>,
): SafeSerializer<T[], unknown[]> =>
  createArraySerializer(makeDual(itemSerde)).safe as SafeSerializer<
    T[],
    unknown[]
  >;

export const tuple = <T extends readonly unknown[]>(
  ...serdes: { [K in keyof T]: SafeSerializer<T[K], unknown> }
): SafeSerializer<T, unknown[]> => {
  const dualSerdes = serdes.map((serde) => makeDual(serde)) as never;
  return createTupleSerializer(...dualSerdes).safe as SafeSerializer<
    T,
    unknown[]
  >;
};

export const union = <T extends Record<string, unknown>>(
  variants: { [K in keyof T]: SafeSerializer<T[K], unknown> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): SafeSerializer<T[keyof T], unknown> => {
  const dualVariants: { [K in keyof T]: DualSerializer<T[K], unknown> } =
    {} as never;
  for (const key in variants) {
    dualVariants[key] = makeDual(variants[key]) as never;
  }
  return createUnionSerializer(dualVariants as never, tagExtractor, tagField)
    .safe as SafeSerializer<T[keyof T], unknown>;
};

export const record = <T>(
  valueSerde: SafeSerializer<T, unknown>,
): SafeSerializer<Record<string, T>, Record<string, unknown>> =>
  createRecordSerializer(makeDual(valueSerde)).safe as SafeSerializer<
    Record<string, T>,
    Record<string, unknown>
  >;

export const optional = <T>(
  serde: SafeSerializer<T, unknown>,
): SafeSerializer<T | undefined, unknown> =>
  createOptionalSerializer(makeDual(serde)).safe as SafeSerializer<
    T | undefined,
    unknown
  >;

export const nullable = <T>(
  serde: SafeSerializer<T, unknown>,
): SafeSerializer<T | null, unknown> =>
  createNullableSerializer(makeDual(serde)).safe as SafeSerializer<
    T | null,
    unknown
  >;

export const withDefault = <T>(
  serde: SafeSerializer<T, unknown>,
  defaultValue: T,
): SafeSerializer<T, unknown> =>
  createDefaultSerializer(makeDual(serde), defaultValue).safe as SafeSerializer<
    T,
    unknown
  >;

export const mapped = <T, K extends keyof T>(
  serde: SafeSerializer<T, unknown>,
  mapping: Record<string, K>,
): SafeSerializer<T, Record<string, unknown>> =>
  createMappedSerializer(makeDual(serde), mapping).safe as SafeSerializer<
    T,
    Record<string, unknown>
  >;

export const lazy = <T>(
  getSerdeFactory: () => SafeSerializer<T, unknown>,
): SafeSerializer<T, unknown> => {
  const getDualSerdeFactory = () => makeDual(getSerdeFactory());
  return createLazySerializer(getDualSerdeFactory).safe as SafeSerializer<
    T,
    unknown
  >;
};

export const rename = <T, K extends keyof T>(
  serde: SafeSerializer<T, unknown>,
  fieldMapping: Partial<Record<K, string>>,
): SafeSerializer<T, unknown> =>
  createRenameSerializer(makeDual(serde), fieldMapping).safe as SafeSerializer<
    T,
    unknown
  >;
