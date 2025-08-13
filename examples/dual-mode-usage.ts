// Example demonstrating the dual-mode API

// Throwing mode - import from main entry point
import * as t from "../src/index.js";

// Safe mode - import from safe entry point  
import * as safe from "../src/safe.js";

interface User {
  name: string;
  age: number;
  email?: string;
  active: boolean;
}

// Define schema once, use in both modes
const userFields = {
  name: t.string,  // or safe.string - both have same API
  age: t.number,
  email: t.optional(t.string),
  active: t.boolean,
};

// Throwing mode
const ThrowingUserSerde = t.object(userFields);

// Safe mode 
const SafeUserSerde = safe.object({
  name: safe.string,
  age: safe.number, 
  email: safe.optional(safe.string),
  active: safe.boolean,
});

const userData = { name: "Alice", age: 30, active: true };

// Throwing mode - exceptions on error
console.log("=== Throwing Mode ===");
try {
  const serialized = ThrowingUserSerde.serialize(userData);
  console.log("Serialized:", serialized);
  
  const deserialized = ThrowingUserSerde.deserialize(serialized);
  console.log("Deserialized:", deserialized);
  
  // This will throw
  ThrowingUserSerde.deserialize({ name: "Bob", age: "not a number", active: true });
} catch (error) {
  console.log("Error caught:", error.message);
}

// Safe mode - Result<T, E> on error
console.log("\n=== Safe Mode ===");
const serialized = SafeUserSerde.serialize(userData);
console.log("Serialized:", serialized);

const result1 = SafeUserSerde.deserialize(serialized);
if (result1.ok) {
  console.log("Deserialized:", result1.value);
} else {
  console.log("Error:", result1.error);
}

// This will return an error result
const result2 = SafeUserSerde.deserialize({ name: "Bob", age: "not a number", active: true });
if (result2.ok) {
  console.log("Deserialized:", result2.value);
} else {
  console.log("Error:", result2.error);
}

// Complex example with nested objects
interface Company {
  name: string;
  employees: User[];
  founded: Date;
}

// Throwing mode complex example
const ThrowingCompanySerde = t.object({
  name: t.string,
  employees: t.array(ThrowingUserSerde),
  founded: t.date,
});

// Safe mode complex example
const SafeCompanySerde = safe.object({
  name: safe.string,
  employees: safe.array(SafeUserSerde),
  founded: safe.date,
});

const companyData = {
  name: "TechCorp",
  employees: [
    { name: "Alice", age: 30, active: true },
    { name: "Bob", age: 25, active: false, email: "bob@example.com" }
  ],
  founded: new Date("2020-01-01")
};

console.log("\n=== Complex Nested Example ===");

// Throwing mode
try {
  const serialized = ThrowingCompanySerde.serialize(companyData);
  console.log("Throwing mode serialized company:", JSON.stringify(serialized, null, 2));
  
  const deserialized = ThrowingCompanySerde.deserialize(serialized);
  console.log("Throwing mode deserialized company:", deserialized);
} catch (error) {
  console.log("Throwing mode error:", error.message);
}

// Safe mode
const safeResult = SafeCompanySerde.deserialize(
  SafeCompanySerde.serialize(companyData)
);

if (safeResult.ok) {
  console.log("Safe mode deserialized company:", safeResult.value);
} else {
  console.log("Safe mode error:", safeResult.error);
}