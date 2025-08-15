import { Err, Ok } from "@rustify/result";
import * as t from "../src/index.js";
import { createTransformSerde } from "../src/serializers/primitives.js";

// Basic primitive serialization (all return Result<S, string>)
console.log("=== Basic Primitives ===");
const stringSerializeResult = t.string.serialize("hello");
if (stringSerializeResult.isOk()) {
  console.log(stringSerializeResult.value);
}

const numberSerializeResult = t.number.serialize(42);
if (numberSerializeResult.isOk()) {
  console.log(numberSerializeResult.value);
}

const booleanResult = t.boolean.serialize(true);
if (booleanResult.isOk()) {
  console.log(booleanResult.value);
}

const date = new Date("2023-01-01T00:00:00.000Z");
const dateResult = t.date.serialize(date);
if (dateResult.isOk()) {
  console.log(dateResult.value);
}

// Object serialization
console.log("\n=== Object ===");
const PersonSerde = t.object({
  name: t.string,
  age: t.number,
  active: t.boolean,
});

const person = { name: "Alice", age: 30, active: true };
const serializedPersonResult = PersonSerde.serialize(person);
if (serializedPersonResult.isOk()) {
  console.log(serializedPersonResult.value);

  const deserializedPerson = PersonSerde.deserialize(
    serializedPersonResult.value,
  );
  if (deserializedPerson.isOk()) {
    console.log(deserializedPerson.value);
  } else {
    console.error("Deserialization failed:", deserializedPerson.error);
  }
} else {
  console.error("Serialization failed:", serializedPersonResult.error);
}

// Array serialization
console.log("\n=== Array ===");
const NumberArraySerde = t.array(t.number);
const numbers = [1, 2, 3, 4, 5];
const serializedNumbersResult = NumberArraySerde.serialize(numbers);
if (serializedNumbersResult.isOk()) {
  console.log(serializedNumbersResult.value);
} else {
  console.error("Array serialization failed:", serializedNumbersResult.error);
}

// Optional fields
console.log("\n=== Optional ===");
const UserSerde = t.object({
  name: t.string,
  email: t.optional(t.string),
  age: t.nullable(t.number),
});

const user1 = { name: "Bob", email: "bob@example.com", age: 25 };
const user2 = { name: "Charlie", email: undefined, age: null };

const user1Result = UserSerde.serialize(user1);
if (user1Result.isOk()) {
  console.log(user1Result.value);
}

const user2Result = UserSerde.serialize(user2);
if (user2Result.isOk()) {
  console.log(user2Result.value);
}

// Custom transformation: Boolean to "True"/"False" strings
console.log("\n=== Custom Boolean Transform ===");
const BooleanString = createTransformSerde(
  t.string,
  (value: boolean) => (value ? "True" : "False"),
  (serialized: string) => serialized === "True",
  (serialized: string) => Ok(serialized === "True"),
);

const boolTrueResult = BooleanString.serialize(true);
if (boolTrueResult.isOk()) {
  console.log(boolTrueResult.value); // "True"
}

const boolFalseResult = BooleanString.serialize(false);
if (boolFalseResult.isOk()) {
  console.log(boolFalseResult.value); // "False"
}
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
  // First try serialization with .unwrap()
  const serializedTrue = BooleanString2.serialize(true).unwrap();
  console.log("Serialized true:", serializedTrue);

  // Then deserialization that will fail
  const throwingResult = BooleanString2.deserialize("Invalid").unwrap();
  console.log(throwingResult);
} catch (error) {
  console.log("Caught error:", (error as Error).message);
}

// Working with Result values
console.log("\n=== Working with Results ===");
const stringDeserializeResult = t.string.deserialize("hello");
if (stringDeserializeResult.isOk()) {
  console.log("String value:", stringDeserializeResult.value);
}

const numberDeserializeResult = t.number.deserialize("not a number");
if (numberDeserializeResult.isErr()) {
  console.log("Number error:", numberDeserializeResult.error);
}

// Chain operations with Result
const chainedResult = t.number
  .deserialize(42)
  .map((n: number) => n * 2)
  .map((n: number) => `The result is ${n}`);

if (chainedResult.isOk()) {
  console.log(chainedResult.value); // "The result is 84"
}
