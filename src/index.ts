export type { Serializer } from "@/types/api.js";
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
import type { Serializer } from "@/types/api.js";
import { wrapThrowingFunction } from "@/utils/result.js";

// Throwing mode exports - simple names for ergonomic usage
export const string: Serializer<string, string> =
  createStringSerializer().throwing;
export const number: Serializer<number, number> =
  createNumberSerializer().throwing;
export const boolean: Serializer<boolean, boolean> =
  createBooleanSerializer().throwing;
export const date: Serializer<Date, string> = createDateSerializer().throwing;

export const literal = <T extends string | number | boolean>(
  literal: T,
): Serializer<T, T> => createLiteralSerializer(literal).throwing;

export const enumSerializer = <T extends Record<string, string | number>>(
  enumObject: T,
): Serializer<T[keyof T], T[keyof T]> =>
  createEnumSerializer(enumObject).throwing;

// Helper to create dual-mode serializers that we can use internally
type DualSerializer<T, S> = {
  throwing: Serializer<T, S>;
  safe: {
    serialize: (v: T) => S;
    deserialize: (s: unknown) => import("@/utils/result.js").Result<T, string>;
  };
};

// Helper function to convert throwing serializer to dual serializer
const makeDual = <T, S>(serde: Serializer<T, S>): DualSerializer<T, S> => ({
  throwing: serde,
  safe: {
    serialize: serde.serialize,
    deserialize: (s: unknown) =>
      wrapThrowingFunction(() => serde.deserialize(s)),
  },
});

export const object = <T extends Record<string, unknown>>(
  fields: { [K in keyof T]: Serializer<T[K], unknown> },
): Serializer<T, Record<string, unknown>> => {
  const fieldSerdes: { [K in keyof T]: DualSerializer<T[K], unknown> } =
    {} as never;
  for (const key in fields) {
    fieldSerdes[key] = makeDual(fields[key]) as never;
  }
  return createObjectSerializer(fieldSerdes).throwing as Serializer<
    T,
    Record<string, unknown>
  >;
};

export const array = <T>(
  itemSerde: Serializer<T, unknown>,
): Serializer<T[], unknown[]> =>
  createArraySerializer(makeDual(itemSerde)).throwing as Serializer<
    T[],
    unknown[]
  >;

export const tuple = <T extends readonly unknown[]>(
  ...serdes: { [K in keyof T]: Serializer<T[K], unknown> }
): Serializer<T, unknown[]> => {
  const dualSerdes = serdes.map((serde) => makeDual(serde)) as {
    [K in keyof T]: DualSerializer<T[K], unknown>;
  };
  return createTupleSerializer(...(dualSerdes as never)).throwing as Serializer<
    T,
    unknown[]
  >;
};

export const union = <T extends Record<string, unknown>>(
  variants: { [K in keyof T]: Serializer<T[K], unknown> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): Serializer<T[keyof T], unknown> => {
  const dualVariants: { [K in keyof T]: DualSerializer<T[K], unknown> } =
    {} as never;
  for (const key in variants) {
    dualVariants[key] = makeDual(variants[key]) as never;
  }
  return createUnionSerializer(dualVariants as never, tagExtractor, tagField)
    .throwing as Serializer<T[keyof T], unknown>;
};

export const record = <T>(
  valueSerde: Serializer<T, unknown>,
): Serializer<Record<string, T>, Record<string, unknown>> =>
  createRecordSerializer(makeDual(valueSerde)).throwing as Serializer<
    Record<string, T>,
    Record<string, unknown>
  >;

export const optional = <T>(
  serde: Serializer<T, unknown>,
): Serializer<T | undefined, unknown> =>
  createOptionalSerializer(makeDual(serde)).throwing as Serializer<
    T | undefined,
    unknown
  >;

export const nullable = <T>(
  serde: Serializer<T, unknown>,
): Serializer<T | null, unknown> =>
  createNullableSerializer(makeDual(serde)).throwing as Serializer<
    T | null,
    unknown
  >;

export const withDefault = <T>(
  serde: Serializer<T, unknown>,
  defaultValue: T,
): Serializer<T, unknown> =>
  createDefaultSerializer(makeDual(serde), defaultValue).throwing as Serializer<
    T,
    unknown
  >;

export const mapped = <T, K extends keyof T>(
  serde: Serializer<T, unknown>,
  mapping: Record<string, K>,
): Serializer<T, Record<string, unknown>> =>
  createMappedSerializer(makeDual(serde), mapping).throwing as Serializer<
    T,
    Record<string, unknown>
  >;

export const lazy = <T>(
  getSerdeFactory: () => Serializer<T, unknown>,
): Serializer<T, unknown> => {
  const getDualSerdeFactory = () => makeDual(getSerdeFactory());
  return createLazySerializer(getDualSerdeFactory).throwing as Serializer<
    T,
    unknown
  >;
};

export const rename = <T, K extends keyof T>(
  serde: Serializer<T, unknown>,
  fieldMapping: Partial<Record<K, string>>,
): Serializer<T, unknown> =>
  createRenameSerializer(makeDual(serde), fieldMapping).throwing as Serializer<
    T,
    unknown
  >;
