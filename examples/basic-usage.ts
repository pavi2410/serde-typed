import serde, {
  StringSerde,
  NumberSerde,
  BooleanSerde,
  DateSerde,
  ObjectSerde,
  ArraySerde,
  Optional,
  Nullable,
  Transform,
  SafeTransform,
  SafeStringSerde
} from "../src/index.js"

// Basic primitive serialization
console.log("=== Basic Primitives ===")
console.log(StringSerde.serialize("hello"))
console.log(NumberSerde.serialize(42))
console.log(BooleanSerde.serialize(true))

const date = new Date("2023-01-01T00:00:00.000Z")
console.log(DateSerde.serialize(date))

// Object serialization
console.log("\n=== Object ===")
const PersonSerde = ObjectSerde({
  name: StringSerde,
  age: NumberSerde,
  active: BooleanSerde
})

const person = { name: "Alice", age: 30, active: true }
const serializedPerson = PersonSerde.serialize(person)
console.log(serializedPerson)

const deserializedPerson = PersonSerde.deserialize(serializedPerson)
console.log(deserializedPerson)

// Array serialization
console.log("\n=== Array ===")
const NumberArraySerde = ArraySerde(NumberSerde)
const numbers = [1, 2, 3, 4, 5]
const serializedNumbers = NumberArraySerde.serialize(numbers)
console.log(serializedNumbers)

// Optional fields
console.log("\n=== Optional ===")
const UserSerde = ObjectSerde({
  name: StringSerde,
  email: Optional(StringSerde),
  age: Nullable(NumberSerde)
})

const user1 = { name: "Bob", email: "bob@example.com", age: 25 }
const user2 = { name: "Charlie", email: undefined, age: null }

console.log(UserSerde.serialize(user1))
console.log(UserSerde.serialize(user2))

// Custom transformation: Boolean to "True"/"False" strings
console.log("\n=== Custom Boolean Transform ===")
const BooleanString = Transform(
  StringSerde,
  (value: boolean) => value ? "True" : "False",
  (serialized: string) => serialized === "True"
)

console.log(BooleanString.serialize(true))   // "True"
console.log(BooleanString.serialize(false))  // "False"
console.log(BooleanString.deserialize("True"))  // true
console.log(BooleanString.deserialize("False")) // false

// Safe transformation with error handling
console.log("\n=== Safe Transform ===")
const SafeBooleanString = SafeTransform(
  SafeStringSerde,
  (value: boolean) => value ? "True" : "False",
  (serialized: string) => {
    if (serialized === "True") return { ok: true, value: true }
    if (serialized === "False") return { ok: true, value: false }
    return { ok: false, error: `Invalid boolean string: ${serialized}` }
  }
)

const result1 = SafeBooleanString.deserialize("True")
const result2 = SafeBooleanString.deserialize("Invalid")

console.log(result1) // { ok: true, value: true }
console.log(result2) // { ok: false, error: "Invalid boolean string: Invalid" }

// Using the default serde object
console.log("\n=== Using serde object ===")
console.log(serde.StringSerde.serialize("world"))
console.log(serde.NumberSerde.serialize(100))