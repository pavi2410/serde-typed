# @rustify/serde

[![CI](https://github.com/rustify-ts/serde/workflows/CI/badge.svg)](https://github.com/rustify-ts/serde/actions)
[![npm version](https://badge.fury.io/js/@rustify/serde.svg)](https://badge.fury.io/js/@rustify/serde)

A production-ready TypeScript serialization/deserialization library inspired by Rust's serde. Provides pure structural transformation between types and their serialized forms with Result-based error handling.

## Features

- 🦀 **Rust-inspired**: API design inspired by Rust's powerful serde library with Result types
- 🔧 **Pure transformation**: Focus on serialization/deserialization with type-safe error handling
- 🌳 **Tree-shakeable**: ESM-only with minimal bundle size
- 🎯 **Type-safe**: Full TypeScript support with excellent type inference
- 🚫 **Zero dependencies**: Lightweight with only @rustify/result as dependency
- 🔄 **Composable**: Build complex serializers from simple building blocks
- 📦 **Browser-first**: Designed for modern browsers and bundlers
- ⚡ **Fast**: Optimized for performance

## Installation

```bash
# npm
npm install @rustify/serde

# pnpm
pnpm add @rustify/serde

# yarn
yarn add @rustify/serde
```

## Quick Start

```typescript
import * as t from '@rustify/serde'

// Define a person serializer
const PersonSerde = t.object({
  name: t.string,
  age: t.number,
  active: t.boolean
})

// Serialize data
const person = { name: "Alice", age: 30, active: true }
const serialized = PersonSerde.serialize(person)
console.log(serialized) // { name: "Alice", age: 30, active: true }

// Deserialize data (returns Result<T, string>)
const result = PersonSerde.deserialize(serialized)
if (result.isOk()) {
  console.log(result.value) // { name: "Alice", age: 30, active: true }
} else {
  console.error(result.error) // Error message
}

// Use .unwrap() when you're confident the operation will succeed
const deserialized = PersonSerde.deserialize(serialized).unwrap()
```

## Core Concepts

### Serde Interface

All serializers implement the `Serde<T, S>` interface:

```typescript
interface Serde<T, S> {
  serialize(value: T): S
  deserialize(serialized: unknown): Result<T, string>
}
```

### Result-Based Error Handling

All deserialization operations return `Result<T, string>` for type-safe error handling:

```typescript
import * as t from '@rustify/serde'

const result = t.string.deserialize(123) // not a string
if (result.isOk()) {
  console.log(result.value) // string
} else {
  console.log(result.error) // "Expected string, got number"
}

// Use .unwrap() when you want throwing behavior
try {
  const value = t.string.deserialize(123).unwrap()
} catch (error) {
  console.error(error.message) // "Expected string, got number"
}
```

## API Reference

### Primitive Serializers

```typescript
import * as t from '@rustify/serde'

// Basic types
t.string.serialize("hello") // "hello"
t.number.serialize(42) // 42
t.boolean.serialize(true) // true

// Date serialization (to/from ISO string)
const date = new Date("2023-01-01T00:00:00.000Z")
t.date.serialize(date) // "2023-01-01T00:00:00.000Z"

const dateResult = t.date.deserialize("2023-01-01T00:00:00.000Z")
if (dateResult.isOk()) {
  console.log(dateResult.value) // Date object
}
```

### Literal Values

```typescript
import * as t from '@rustify/serde'

const ConstantSerde = t.literal("CONSTANT")
ConstantSerde.serialize("CONSTANT") // "CONSTANT"

const result = ConstantSerde.deserialize("CONSTANT")
if (result.isOk()) {
  console.log(result.value) // "CONSTANT"
}
```

### Complex Types

#### Objects

```typescript
import * as t from '@rustify/serde'

const PersonSerde = t.object({
  name: t.string,
  age: t.number
})
```

#### Arrays

```typescript
import * as t from '@rustify/serde'

const NumberArraySerde = t.array(t.number)
NumberArraySerde.serialize([1, 2, 3]) // [1, 2, 3]
```

#### Tuples

```typescript
import * as t from '@rustify/serde'

const CoordinateSerde = t.tuple(t.number, t.number, t.string)
CoordinateSerde.serialize([10, 20, "point"]) // [10, 20, "point"]
```

#### Records

```typescript
import * as t from '@rustify/serde'

const StringRecordSerde = t.record(t.string)
StringRecordSerde.serialize({ key: "value" }) // { key: "value" }
```

### Modifiers

#### Optional Fields

```typescript
import * as t from '@rustify/serde'

const OptionalString = t.optional(t.string)
OptionalString.serialize(undefined) // undefined
OptionalString.serialize("hello") // "hello"
```

#### Nullable Fields

```typescript
import * as t from '@rustify/serde'

const NullableString = t.nullable(t.string)
NullableString.serialize(null) // null
NullableString.serialize("hello") // "hello"
```

#### Default Values

```typescript
import * as t from '@rustify/serde'

const NumberWithDefault = t.withDefault(t.number, 0)
NumberWithDefault.deserialize(undefined) // 0
NumberWithDefault.deserialize(42) // 42
```

## Custom Transformations

Transform data during serialization/deserialization:

```typescript
import { createTransformSerde } from '@rustify/serde/serializers/primitives'
import * as t from '@rustify/serde'
import { Ok, Err } from '@rustify/result'

// Boolean to "True"/"False" string transformation
const BooleanString = createTransformSerde(
  t.string,
  (value: boolean) => value ? "True" : "False",
  (serialized: string) => serialized === "True",
  (serialized: string) => {
    if (serialized === "True") return Ok(true)
    if (serialized === "False") return Ok(false)
    return Err(`Invalid boolean string: ${serialized}`)
  }
)

BooleanString.serialize(true) // "True"
BooleanString.serialize(false) // "False"

const result1 = BooleanString.deserialize("True")
if (result1.isOk()) {
  console.log(result1.value) // true
}

const result2 = BooleanString.deserialize("Invalid")
if (result2.isErr()) {
  console.log(result2.error) // "Invalid boolean string: Invalid"
}
```

## Recursive Types

Handle recursive data structures using `Lazy`:

```typescript
import * as t from '@rustify/serde'

interface TreeNode {
  value: number
  name: string
  children?: TreeNode[]
}

const TreeNodeSerde = t.lazy(() => t.object({
  value: t.number,
  name: t.string,
  children: t.optional(t.array(TreeNodeSerde))
}))

// Now you can serialize/deserialize tree structures
const tree: TreeNode = {
  value: 1,
  name: "root",
  children: [
    { value: 2, name: "child1" },
    { value: 3, name: "child2", children: [
      { value: 4, name: "grandchild" }
    ]}
  ]
}

const serialized = TreeNodeSerde.serialize(tree)
const result = TreeNodeSerde.deserialize(serialized)
if (result.isOk()) {
  const deserialized = result.value
  console.log(deserialized)
}
```

## Error Handling

All deserialization operations return `Result<T, string>` for comprehensive error handling:

```typescript
import * as t from '@rustify/serde'

const PersonSerde = t.object({
  name: t.string,
  age: t.number
})

const result = PersonSerde.deserialize({
  name: "Alice",
  age: "not a number" // Invalid!
})

if (result.isOk()) {
  console.log(result.value) // Person
} else {
  console.log(result.error) // "Field 'age': Expected number, got string"
}

// Chain operations with Result methods
const chainedResult = t.number.deserialize(42)
  .map(n => n * 2)
  .map(n => `The result is ${n}`)

if (chainedResult.isOk()) {
  console.log(chainedResult.value) // "The result is 84"
}
```

## Default Export

For convenience, all serializers are available on the default export:

```typescript
import * as t from '@rustify/serde'

const PersonSerde = t.object({
  name: t.string,
  age: t.number,
  active: t.boolean
})
```

## Advanced Usage

### Union Types and Error Handling

```typescript
import * as t from '@rustify/serde'

// Create a union of different types
const StringOrNumberSerde = t.union([t.string, t.number])

const result1 = StringOrNumberSerde.deserialize("hello")
if (result1.isOk()) {
  console.log(result1.value) // "hello"
}

const result2 = StringOrNumberSerde.deserialize(42)
if (result2.isOk()) {
  console.log(result2.value) // 42
}

const result3 = StringOrNumberSerde.deserialize(true)
if (result3.isErr()) {
  console.log(result3.error) // Union deserialization error
}
```

### Working with Complex Nested Data

```typescript
import * as t from '@rustify/serde'

const UserSerde = t.object({
  id: t.number,
  profile: t.object({
    name: t.string,
    email: t.optional(t.string),
    preferences: t.record(t.boolean)
  }),
  posts: t.array(t.object({
    title: t.string,
    content: t.string,
    tags: t.array(t.string)
  }))
})

// Handle complex nested deserialization
const userData = {
  id: 1,
  profile: {
    name: "Alice",
    email: "alice@example.com",
    preferences: { darkMode: true, notifications: false }
  },
  posts: [
    { title: "Hello", content: "World", tags: ["intro", "greeting"] }
  ]
}

const result = UserSerde.deserialize(userData)
if (result.isOk()) {
  console.log("Valid user data:", result.value)
} else {
  console.log("Validation error:", result.error)
}
```

## Browser Support

@rustify/serde targets modern browsers that support:
- ES2022 features
- ESM modules
- Node.js 22+ LTS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality  
5. Run `pnpm test` and `pnpm build`
6. Submit a pull request

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Build the package
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

## License

MIT © [pavi2410](https://github.com/pavi2410)

## Inspiration

This library is inspired by Rust's [serde](https://serde.rs/) library, adapted for TypeScript's type system and JavaScript ecosystem.