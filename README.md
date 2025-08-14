# @rustify/serde

[![CI](https://github.com/rustify-ts/serde/workflows/CI/badge.svg)](https://github.com/rustify-ts/serde/actions)
[![npm version](https://badge.fury.io/js/@rustify/serde.svg)](https://badge.fury.io/js/@rustify/serde)

A production-ready TypeScript serialization/deserialization library inspired by Rust's serde. Provides pure structural transformation between types and their serialized forms without validation.

## Features

- 🦀 **Rust-inspired**: API design inspired by Rust's powerful serde library
- 🔧 **Pure transformation**: Focus on serialization/deserialization without validation
- 🌳 **Tree-shakeable**: ESM-only with minimal bundle size
- 🎯 **Type-safe**: Full TypeScript support with excellent type inference
- 🚫 **Zero dependencies**: Lightweight with no runtime dependencies
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

// Deserialize data
const deserialized = PersonSerde.deserialize(serialized)
console.log(deserialized) // { name: "Alice", age: 30, active: true }
```

## Core Concepts

### Serde Interface

All serializers implement the `Serde<T, S>` interface:

```typescript
interface Serde<T, S> {
  serialize(value: T): S
  deserialize(serialized: S): T
}
```

### Safe Serializers

For runtime safety, use `SafeSerde<T, S>` which returns `Result<T, string>`:

```typescript
import * as safe from '@rustify/serde/safe'

const result = safe.string.deserialize(123) // not a string
if (result.ok) {
  console.log(result.value) // string
} else {
  console.log(result.error) // "Expected string, got number"
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
t.date.deserialize("2023-01-01T00:00:00.000Z") // Date object
```

### Literal Values

```typescript
import * as t from '@rustify/serde'

const ConstantSerde = t.literal("CONSTANT")
ConstantSerde.serialize("CONSTANT") // "CONSTANT"
ConstantSerde.deserialize("anything") // "CONSTANT"
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
import * as safe from '@rustify/serde/safe'

// Boolean to "True"/"False" string transformation
const BooleanString = createTransformSerde(
  { throwing: t.string, safe: safe.string },
  (value: boolean) => value ? "True" : "False",
  (serialized: string) => serialized === "True",
  (serialized: string) => ({ ok: true, value: serialized === "True" })
).throwing

BooleanString.serialize(true) // "True"
BooleanString.serialize(false) // "False"
BooleanString.deserialize("True") // true
BooleanString.deserialize("False") // false
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
const deserialized = TreeNodeSerde.deserialize(serialized)
```

## Error Handling

Use safe serializers for runtime validation:

```typescript
import * as safe from '@rustify/serde/safe'

const SafePersonSerde = safe.object({
  name: safe.string,
  age: safe.number
})

const result = SafePersonSerde.deserialize({
  name: "Alice",
  age: "not a number" // Invalid!
})

if (result.ok) {
  console.log(result.value) // Person
} else {
  console.log(result.error) // "Field 'age': Expected number, got string"
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

### Enum Serialization

```typescript
import * as safe from '@rustify/serde/safe'

enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue"
}

const ColorSerde = safe.enumSerde(Color)
const result = ColorSerde.deserialize("red")
if (result.ok) {
  console.log(result.value) // "red" (properly typed as Color)
}
```

### Field Renaming

```typescript
import * as t from '@rustify/serde'

const RenamedPersonSerde = t.rename(
  t.object({ name: t.string }),
  { name: "full_name" }
)

// Serializes { name: "Alice" } to { full_name: "Alice" }
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