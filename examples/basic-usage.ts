import { Err, Ok } from "@rustify/result";
import * as t from "../src/index.js";
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
if (deserializedPerson.isOk()) {
  console.log(deserializedPerson.value);
} else {
  console.error("Deserialization failed:", deserializedPerson.error);
}

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
  t.string,
  (value: boolean) => (value ? "True" : "False"),
  (serialized: string) => serialized === "True",
  (serialized: string) => Ok(serialized === "True"),
);

console.log(BooleanString.serialize(true)); // "True"
console.log(BooleanString.serialize(false)); // "False"
const result1 = BooleanString.deserialize("True");
const result2 = BooleanString.deserialize("False");
console.log(result1.isOk() ? result1.value : result1.error); // true
console.log(result2.isOk() ? result2.value : result2.error); // false

// Error handling with Result types
console.log("\n=== Error Handling ===");
const BooleanString2 = createTransformSerde(
  t.string,
  (value: boolean) => (value ? "True" : "False"),
  (serialized: string) => serialized === "True",
  (serialized: string) => {
    if (serialized === "True") return Ok(true);
    if (serialized === "False") return Ok(false);
    return Err(`Invalid boolean string: ${serialized}`);
  },
);

const validResult = BooleanString2.deserialize("True");
const invalidResult = BooleanString2.deserialize("Invalid");

console.log(validResult); // Ok with value: true
console.log(invalidResult); // Err with error message

// Using .unwrap() for throwing behavior when needed
try {
  const throwingResult = BooleanString2.deserialize("Invalid").unwrap();
  console.log(throwingResult);
} catch (error) {
  console.log("Caught error:", error.message);
}

// Working with Result values
console.log("\n=== Working with Results ===");
const stringResult = t.string.deserialize("hello");
if (stringResult.isOk()) {
  console.log("String value:", stringResult.value);
}

const numberResult = t.number.deserialize("not a number");
if (numberResult.isErr()) {
  console.log("Number error:", numberResult.error);
}

// Chain operations with Result
const chainedResult = t.number
  .deserialize(42)
  .map((n) => n * 2)
  .map((n) => `The result is ${n}`);

if (chainedResult.isOk()) {
  console.log(chainedResult.value); // "The result is 84"
}
