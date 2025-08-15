import { Err, Ok } from "@rustify/result";
import type { Serde } from "@/types.js";

export function createObjectSerde<T extends Record<string, any>>(
  fields: { [K in keyof T]: Serde<T[K], any> },
): Serde<T, Record<string, any>> {
  return {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in fields) {
        result[key] = fields[key]!.serialize(value[key]);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object");
      }

      const result = {} as T;
      const obj = serialized as Record<string, unknown>;

      for (const key in fields) {
        const fieldResult = fields[key]!.deserialize(obj[key]);
        if (fieldResult.isErr()) {
          return Err(`Field '${key}': ${fieldResult.error}`);
        }
        result[key] = fieldResult.value;
      }
      return Ok(result);
    },
  };
}

export function createArraySerde<T>(
  itemSerde: Serde<T, any>,
): Serde<T[], any[]> {
  return {
    serialize: (value) => value.map((item) => itemSerde.serialize(item)),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        return Err("Expected array");
      }

      const result: T[] = [];
      for (let i = 0; i < serialized.length; i++) {
        const itemResult = itemSerde.deserialize(serialized[i]);
        if (itemResult.isErr()) {
          return Err(`Array item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result);
    },
  };
}

export function createTupleSerde<T extends readonly any[]>(
  ...serdes: { [K in keyof T]: Serde<T[K], any> }
): Serde<T, any[]> {
  return {
    serialize: (value) => serdes.map((serde, i) => serde.serialize(value[i])),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        return Err("Expected array for tuple");
      }

      if (serialized.length !== serdes.length) {
        return Err(
          `Expected tuple of length ${serdes.length}, got ${serialized.length}`,
        );
      }

      const result: any[] = [];
      for (let i = 0; i < serdes.length; i++) {
        const itemResult = serdes[i]!.deserialize(serialized[i]);
        if (itemResult.isErr()) {
          return Err(`Tuple item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result as unknown as T);
    },
  };
}

export function createUnionSerde<T extends Record<string, any>>(
  variants: { [K in keyof T]: Serde<T[K], any> },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
): Serde<T[keyof T], any> {
  return {
    serialize: (value) => {
      const tag = tagExtractor(value);
      const serialized = variants[tag]!.serialize(value);
      return { [tagField]: tag, ...serialized };
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for union");
      }

      const obj = serialized as Record<string, unknown>;
      const tag = obj[tagField] as keyof T;

      if (!variants[tag]) {
        return Err(`Unknown union variant: ${String(tag)}`);
      }

      return variants[tag]!.deserialize(serialized);
    },
  };
}

export function createRecordSerde<T>(
  valueSerde: Serde<T, any>,
): Serde<Record<string, T>, Record<string, any>> {
  return {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in value) {
        result[key] = valueSerde.serialize(value[key]!);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        return Err("Expected object for record");
      }

      const result: Record<string, T> = {};
      const obj = serialized as Record<string, unknown>;

      for (const key in obj) {
        const valueResult = valueSerde.deserialize(obj[key]);
        if (valueResult.isErr()) {
          return Err(`Record key '${key}': ${valueResult.error}`);
        }
        result[key] = valueResult.value;
      }
      return Ok(result);
    },
  };
}
