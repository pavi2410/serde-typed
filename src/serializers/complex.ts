import type { Result } from "@/utils/result.js";
import { Err, Ok } from "@/utils/result.js";

interface ThrowingSerde<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => T;
}

interface SafeSerde<T, S> {
  serialize: (value: T) => S;
  deserialize: (serialized: unknown) => Result<T, string>;
}

export function createObjectSerializer<T extends Record<string, any>>(
  fields: {
    [K in keyof T]: {
      throwing: ThrowingSerde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  },
) {
  const throwing: ThrowingSerde<T, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in fields) {
        result[key] = fields[key]!.throwing.serialize(value[key]);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        throw new Error("Expected object");
      }

      const result = {} as T;
      const obj = serialized as Record<string, unknown>;

      for (const key in fields) {
        try {
          result[key] = fields[key]!.throwing.deserialize(obj[key]);
        } catch (error) {
          throw new Error(
            `Field '${key}': ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return result;
    },
  };

  const safe: SafeSerde<T, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in fields) {
        result[key] = fields[key]!.safe.serialize(value[key]);
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
        const fieldResult = fields[key]!.safe.deserialize(obj[key]);
        if (!fieldResult.ok) {
          return Err(`Field '${key}': ${fieldResult.error}`);
        }
        result[key] = fieldResult.value;
      }
      return Ok(result);
    },
  };

  return { throwing, safe };
}

export function createArraySerializer<T>(itemSerde: {
  throwing: ThrowingSerde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const throwing: ThrowingSerde<T[], any[]> = {
    serialize: (value) =>
      value.map((item) => itemSerde.throwing.serialize(item)),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        throw new Error("Expected array");
      }

      const result: T[] = [];
      for (let i = 0; i < serialized.length; i++) {
        try {
          result.push(itemSerde.throwing.deserialize(serialized[i]));
        } catch (error) {
          throw new Error(
            `Array item at index ${i}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return result;
    },
  };

  const safe: SafeSerde<T[], any[]> = {
    serialize: (value) => value.map((item) => itemSerde.safe.serialize(item)),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        return Err("Expected array");
      }

      const result: T[] = [];
      for (let i = 0; i < serialized.length; i++) {
        const itemResult = itemSerde.safe.deserialize(serialized[i]);
        if (!itemResult.ok) {
          return Err(`Array item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result);
    },
  };

  return { throwing, safe };
}

export function createTupleSerializer<T extends readonly any[]>(
  ...serdes: {
    [K in keyof T]: {
      throwing: ThrowingSerde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  }
) {
  const throwing: ThrowingSerde<T, any[]> = {
    serialize: (value) =>
      serdes.map((serde, i) => serde.throwing.serialize(value[i])),
    deserialize: (serialized) => {
      if (!Array.isArray(serialized)) {
        throw new Error("Expected array for tuple");
      }

      if (serialized.length !== serdes.length) {
        throw new Error(
          `Expected tuple of length ${serdes.length}, got ${serialized.length}`,
        );
      }

      const result: any[] = [];
      for (let i = 0; i < serdes.length; i++) {
        try {
          result.push(serdes[i]!.throwing.deserialize(serialized[i]));
        } catch (error) {
          throw new Error(
            `Tuple item at index ${i}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return result as T;
    },
  };

  const safe: SafeSerde<T, any[]> = {
    serialize: (value) =>
      serdes.map((serde, i) => serde.safe.serialize(value[i])),
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
        const itemResult = serdes[i]!.safe.deserialize(serialized[i]);
        if (!itemResult.ok) {
          return Err(`Tuple item at index ${i}: ${itemResult.error}`);
        }
        result.push(itemResult.value);
      }
      return Ok(result as T);
    },
  };

  return { throwing, safe };
}

export function createUnionSerializer<T extends Record<string, any>>(
  variants: {
    [K in keyof T]: {
      throwing: ThrowingSerde<T[K], any>;
      safe: SafeSerde<T[K], any>;
    };
  },
  tagExtractor: (value: T[keyof T]) => keyof T,
  tagField: string = "type",
) {
  const throwing: ThrowingSerde<T[keyof T], any> = {
    serialize: (value) => {
      const tag = tagExtractor(value);
      const serialized = variants[tag]!.throwing.serialize(value);
      return { [tagField]: tag, ...serialized };
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        throw new Error("Expected object for union");
      }

      const obj = serialized as Record<string, unknown>;
      const tag = obj[tagField] as keyof T;

      if (!variants[tag]) {
        throw new Error(`Unknown union variant: ${String(tag)}`);
      }

      return variants[tag]!.throwing.deserialize(serialized);
    },
  };

  const safe: SafeSerde<T[keyof T], any> = {
    serialize: (value) => {
      const tag = tagExtractor(value);
      const serialized = variants[tag]!.safe.serialize(value);
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

      return variants[tag]!.safe.deserialize(serialized);
    },
  };

  return { throwing, safe };
}

export function createRecordSerializer<T>(valueSerde: {
  throwing: ThrowingSerde<T, any>;
  safe: SafeSerde<T, any>;
}) {
  const throwing: ThrowingSerde<Record<string, T>, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in value) {
        result[key] = valueSerde.throwing.serialize(value[key]!);
      }
      return result;
    },
    deserialize: (serialized) => {
      if (
        typeof serialized !== "object" ||
        serialized === null ||
        Array.isArray(serialized)
      ) {
        throw new Error("Expected object for record");
      }

      const result: Record<string, T> = {};
      const obj = serialized as Record<string, unknown>;

      for (const key in obj) {
        try {
          result[key] = valueSerde.throwing.deserialize(obj[key]);
        } catch (error) {
          throw new Error(
            `Record key '${key}': ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return result;
    },
  };

  const safe: SafeSerde<Record<string, T>, Record<string, any>> = {
    serialize: (value) => {
      const result: Record<string, any> = {};
      for (const key in value) {
        result[key] = valueSerde.safe.serialize(value[key]!);
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
        const valueResult = valueSerde.safe.deserialize(obj[key]);
        if (!valueResult.ok) {
          return Err(`Record key '${key}': ${valueResult.error}`);
        }
        result[key] = valueResult.value;
      }
      return Ok(result);
    },
  };

  return { throwing, safe };
}
