import * as t from "../src/index.js";
import * as safe from "../src/safe.js";
import { createTransformSerde } from "../src/serializers/primitives.js";

// Basic primitive serialization
console.log("=== Basic Primitives ===");
console.log(t.string.serialize("hello"));
console.log(t.number.serialize(42));
console.log(t.boolean.serialize(true));

const date = new Date("2023-01-01T00:00:00.000Z");
console.log(t.date.serialize(date));

// Object serialization
console.log("\n=== Object ===");
const PersonSerde = t.object({
  name: t.string,
  age: t.number,
  active: t.boolean,
});

const person = { name: "Alice", age: 30, active: true };
const serializedPerson = PersonSerde.serialize(person);
console.log(serializedPerson);

const deserializedPerson = PersonSerde.deserialize(serializedPerson);
console.log(deserializedPerson);

// Array serialization
console.log("\n=== Array ===");
const NumberArraySerde = t.array(t.number);
const numbers = [1, 2, 3, 4, 5];
const serializedNumbers = NumberArraySerde.serialize(numbers);
console.log(serializedNumbers);

// Optional fields
console.log("\n=== Optional ===");
const UserSerde = t.object({
  name: t.string,
  email: t.optional(t.string),
  age: t.nullable(t.number),
});

const user1 = { name: "Bob", email: "bob@example.com", age: 25 };
const user2 = { name: "Charlie", email: undefined, age: null };

console.log(UserSerde.serialize(user1));
console.log(UserSerde.serialize(user2));

// Custom transformation: Boolean to "True"/"False" strings
console.log("\n=== Custom Boolean Transform ===");
const BooleanString = createTransformSerde(
  { throwing: t.string, safe: safe.string },
  (value: boolean) => (value ? "True" : "False"),
  (serialized: string) => serialized === "True",
  (serialized: string) => ({ ok: true, value: serialized === "True" }),
).throwing;

console.log(BooleanString.serialize(true)); // "True"
console.log(BooleanString.serialize(false)); // "False"
console.log(BooleanString.deserialize("True")); // true
console.log(BooleanString.deserialize("False")); // false

// Safe transformation with error handling
console.log("\n=== Safe Transform ===");
const SafeBooleanString = createTransformSerde(
  { throwing: t.string, safe: safe.string },
  (value: boolean) => (value ? "True" : "False"),
  (serialized: string) => serialized === "True",
  (serialized: string) => {
    if (serialized === "True") return { ok: true, value: true };
    if (serialized === "False") return { ok: true, value: false };
    return { ok: false, error: `Invalid boolean string: ${serialized}` };
  },
).safe;

const result1 = SafeBooleanString.deserialize("True");
const result2 = SafeBooleanString.deserialize("Invalid");

console.log(result1); // { ok: true, value: true }
console.log(result2); // { ok: false, error: "Invalid boolean string: Invalid" }

// Using the serde functions
console.log("\n=== Using serde functions ===");
console.log(t.string.serialize("world"));
console.log(t.number.serialize(100));
