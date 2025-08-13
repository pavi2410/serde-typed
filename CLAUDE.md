# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `t-serde` - a production-ready TypeScript serialization/deserialization library inspired by Rust's serde. The library provides pure structural transformation between types and their serialized forms without validation.

## Package Manager & Environment

- Uses **pnpm** as the package manager (defined in `packageManager` field)
- Uses **mise** for runtime management (Node.js and pnpm versions)
- ESM-only project (`"type": "module"` in package.json)

## Build System

- **Vite** is used for building the library (see `vite.config.ts`)
- Builds ESM format only with TypeScript declarations
- Library entry point: `src/index.ts`
- Output: `dist/` directory
- Uses `@/` alias for `src/` directory imports

## Code Quality Tools

- **Biome** for linting and formatting (configured in `biome.json`)
  - Single quotes, no semicolons where possible
  - 2-space indentation, 100 character line width
  - Strict rules: no explicit `any`, unused variables as errors
- **TypeScript** with strict configuration
- **Vitest** for testing with coverage support

## Planned Architecture

The library will be organized into modular components:

- `src/types/` - Core interfaces (Result, Serde, SafeSerde)  
- `src/serializers/primitives.ts` - String, Number, Boolean, Date, Literal, Enum serializers
- `src/serializers/complex.ts` - Object, Array, Tuple, Union, Record serializers
- `src/serializers/modifiers.ts` - Optional, Nullable, Default, Mapped, Lazy serializers
- `src/index.ts` - Main exports and factory object

## Development Commands

Once fully implemented, these commands will be available:

```bash
# Development build (watch mode)  
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch  

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code  
pnpm format

# Pre-publish validation
pnpm prepublishOnly
```

## Key Design Principles

- Pure serialization/deserialization without validation
- Functional, composable API design
- Zero runtime dependencies
- Browser-first approach (no Node-specific APIs)
- Full TypeScript type inference support
- ESM-only for modern environments