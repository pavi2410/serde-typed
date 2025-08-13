# t-serde

[![CI](https://github.com/pavi2410/t-serde/workflows/CI/badge.svg)](https://github.com/pavi2410/t-serde/actions)
[![npm version](https://badge.fury.io/js/t-serde.svg)](https://badge.fury.io/js/t-serde)

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
npm install t-serde

# pnpm
pnpm add t-serde

# yarn
yarn add t-serde
```

## Quick Start

```typescript
import { ObjectSerde, StringSerde, NumberSerde, BooleanSerde, ArraySerde } from 't-serde'

// Define a person serializer
const PersonSerde = ObjectSerde({
  name: StringSerde,
  age: NumberSerde,
  active: BooleanSerde
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
import { SafeStringSerde } from 't-serde'

const result = SafeStringSerde.deserialize(123) // not a string
if (result.ok) {
  console.log(result.value) // string
} else {
  console.log(result.error) // "Expected string, got number"
}
```

## API Reference

### Primitive Serializers

```typescript
import { StringSerde, NumberSerde, BooleanSerde, DateSerde } from 't-serde'

// Basic types
StringSerde.serialize("hello") // "hello"
NumberSerde.serialize(42) // 42
BooleanSerde.serialize(true) // true

// Date serialization (to/from ISO string)
const date = new Date("2023-01-01T00:00:00.000Z")
DateSerde.serialize(date) // "2023-01-01T00:00:00.000Z"
DateSerde.deserialize("2023-01-01T00:00:00.000Z") // Date object
```

### Literal Values

```typescript
import { Literal } from 't-serde'

const ConstantSerde = Literal("CONSTANT")
ConstantSerde.serialize("CONSTANT") // "CONSTANT"
ConstantSerde.deserialize("anything") // "CONSTANT"
```

### Complex Types

#### Objects

```typescript
import { ObjectSerde, StringSerde, NumberSerde } from 't-serde'

const PersonSerde = ObjectSerde({
  name: StringSerde,
  age: NumberSerde
})
```

#### Arrays

```typescript
import { ArraySerde, NumberSerde } from 't-serde'

const NumberArraySerde = ArraySerde(NumberSerde)
NumberArraySerde.serialize([1, 2, 3]) // [1, 2, 3]
```

#### Tuples

```typescript
import { Tuple, StringSerde, NumberSerde } from 't-serde'

const CoordinateSerde = Tuple(NumberSerde, NumberSerde, StringSerde)
CoordinateSerde.serialize([10, 20, "point"]) // [10, 20, "point"]
```

#### Records

```typescript
import { Record, StringSerde } from 't-serde'

const StringRecordSerde = Record(StringSerde)
StringRecordSerde.serialize({ key: "value" }) // { key: "value" }
```

### Modifiers

#### Optional Fields

```typescript
import { Optional, StringSerde } from 't-serde'

const OptionalString = Optional(StringSerde)
OptionalString.serialize(undefined) // undefined
OptionalString.serialize("hello") // "hello"
```

#### Nullable Fields

```typescript
import { Nullable, StringSerde } from 't-serde'

const NullableString = Nullable(StringSerde)
NullableString.serialize(null) // null
NullableString.serialize("hello") // "hello"
```

#### Default Values

```typescript
import { Default, NumberSerde } from 't-serde'

const NumberWithDefault = Default(NumberSerde, 0)
NumberWithDefault.deserialize(undefined) // 0
NumberWithDefault.deserialize(42) // 42
```

## Custom Transformations

Transform data during serialization/deserialization:

```typescript
import { Transform, StringSerde } from 't-serde'

// Boolean to "True"/"False" string transformation
const BooleanString = Transform(
  StringSerde,
  (value: boolean) => value ? "True" : "False",
  (serialized: string) => serialized === "True"
)

BooleanString.serialize(true) // "True"
BooleanString.serialize(false) // "False"
BooleanString.deserialize("True") // true
BooleanString.deserialize("False") // false
```

## Recursive Types

Handle recursive data structures using `Lazy`:

```typescript
import { Lazy, ObjectSerde, StringSerde, NumberSerde, ArraySerde, Optional } from 't-serde'

interface TreeNode {
  value: number
  name: string
  children?: TreeNode[]
}

const TreeNodeSerde = Lazy(() => ObjectSerde({
  value: NumberSerde,
  name: StringSerde,
  children: Optional(ArraySerde(TreeNodeSerde))
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
import { SafeObjectSerde, SafeStringSerde, SafeNumberSerde } from 't-serde'

const SafePersonSerde = SafeObjectSerde({
  name: SafeStringSerde,
  age: SafeNumberSerde
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
import serde from 't-serde'

const PersonSerde = serde.ObjectSerde({
  name: serde.StringSerde,
  age: serde.NumberSerde,
  active: serde.BooleanSerde
})
```

## Advanced Usage

### Enum Serialization

```typescript
import { Enum, SafeEnum } from 't-serde'

enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue"
}

const ColorSerde = SafeEnum(Color)
const result = ColorSerde.deserialize("red")
if (result.ok) {
  console.log(result.value) // "red" (properly typed as Color)
}
```

### Field Renaming

```typescript
import { Rename, ObjectSerde, StringSerde } from 't-serde'

const RenamedPersonSerde = Rename(
  ObjectSerde({ name: StringSerde }),
  { name: "full_name" }
)

// Serializes { name: "Alice" } to { full_name: "Alice" }
```

## Browser Support

t-serde targets modern browsers that support:
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