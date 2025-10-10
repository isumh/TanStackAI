# Type Safety Examples

This directory contains comprehensive examples demonstrating the type-safe multi-adapter AI API.

## Files Overview

### 📚 Learning & Reference

- **`type-safety-demo.ts`** - Quick reference showing valid and invalid usage patterns
- **`visual-error-examples.ts`** - Shows exact TypeScript errors you'll encounter
- **`model-safety-demo.ts`** - Comprehensive working examples with all features
- **`all-adapters-type-safety.ts`** - Examples using all four adapters (OpenAI, Anthropic, Gemini, Ollama)

### 🎯 Practical Examples

- **`multi-adapter-example.ts`** - Real-world multi-adapter setup and usage
- Other example files in this directory

## Quick Start

### 1. Type Safety Basics

```typescript
import { AI } from "@tanstack/ai";
import { OpenAIAdapter } from "@tanstack/ai-openai";
import { AnthropicAdapter } from "@tanstack/ai-anthropic";

const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({ apiKey: "..." }),
    anthropic: new AnthropicAdapter({ apiKey: "..." }),
  },
});

// ✅ Valid
await ai.chat({
  adapter: "openai",
  model: "gpt-4", // TypeScript knows this is valid
  messages: [{ role: "user", content: "Hello!" }],
});

// ❌ TypeScript Error
await ai.chat({
  adapter: "anthropic",
  model: "gpt-4", // Error: gpt-4 not valid for Anthropic
  messages: [{ role: "user", content: "Hello!" }],
});
```

### 2. What You Get

- ✅ **Compile-time safety** - Errors caught during development
- ✅ **IDE autocomplete** - See valid models as you type
- ✅ **Refactoring confidence** - TypeScript flags incompatibilities
- ✅ **Self-documenting** - Types show available models

### 3. Adapter-Specific Models

| Adapter | Example Models |
|---------|---------------|
| OpenAI | `gpt-4`, `gpt-4o`, `gpt-3.5-turbo` |
| Anthropic | `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229` |
| Gemini | `gemini-pro`, `gemini-1.5-pro`, `gemini-1.5-flash` |
| Ollama | `llama3`, `mistral`, `mixtral` |

## Example Files Explained

### `type-safety-demo.ts`

**Best for**: Quick reference

Contains commented examples showing:
- Valid usage for each adapter
- Invalid usage (commented out)
- What autocomplete shows
- Key benefits

```typescript
// See valid examples
ai.chat({ adapter: "openai", model: "gpt-4", messages: [] }); // ✅

// See invalid examples (commented)
// ai.chat({ adapter: "anthropic", model: "gpt-4", messages: [] }); // ❌
```

### `visual-error-examples.ts`

**Best for**: Understanding errors

Shows exactly what TypeScript errors you'll see:
- Full error messages
- Where errors appear
- How to fix them

```typescript
/*
ai.chat({
  adapter: "anthropic",
  model: "gpt-4",
  //     ^^^^^^
  //     TypeScript Error:
  //     Type '"gpt-4"' is not assignable to type 
  //     '"claude-3-5-sonnet-20241022" | "claude-3-5-sonnet-20240620" | ...'
  messages: [],
});
*/
```

### `model-safety-demo.ts`

**Best for**: Complete feature overview

Working examples of:
- Valid usage patterns
- Invalid usage (commented)
- All API methods (chat, stream, embed, etc.)
- Real-world scenarios

### `all-adapters-type-safety.ts`

**Best for**: Multi-provider applications

Shows:
- Using all four adapters together
- Switching between adapters
- Provider-specific models
- Intelligent routing based on task

## Running Examples

### Prerequisites

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Run Examples

```bash
# Run any example
pnpm tsx examples/type-safety-demo.ts

# Or with Node
node --loader ts-node/esm examples/type-safety-demo.ts
```

## Key Concepts

### 1. Adapter Selection

When you specify an adapter, TypeScript knows which models are available:

```typescript
ai.chat({
  adapter: "openai", // TypeScript: "This is OpenAI"
  model: "..." // TypeScript: "Show only OpenAI models"
})
```

### 2. Type Extraction

The system extracts model types from each adapter:

```typescript
type OpenAIModels = ExtractModels<OpenAIAdapter>
// Result: "gpt-4" | "gpt-4o" | "gpt-3.5-turbo" | ...

type AnthropicModels = ExtractModels<AnthropicAdapter>
// Result: "claude-3-5-sonnet-20241022" | "claude-3-opus-20240229" | ...
```

### 3. Conditional Types

The `model` field type changes based on the `adapter` field:

```typescript
// When adapter is "openai"
model: "gpt-4" | "gpt-4o" | "gpt-3.5-turbo" | ...

// When adapter is "anthropic"
model: "claude-3-5-sonnet-20241022" | "claude-3-opus-20240229" | ...
```

## Common Patterns

### Pattern 1: Switch Providers Easily

```typescript
// Development: use local Ollama
const devAI = new AI({
  adapters: { ollama: new OllamaAdapter() }
});

// Production: use OpenAI
const prodAI = new AI({
  adapters: { openai: new OpenAIAdapter({ apiKey: "..." }) }
});

// Both are type-safe!
```

### Pattern 2: Multi-Provider Fallback

```typescript
const ai = new AI({
  adapters: {
    primary: new OpenAIAdapter({ apiKey: "..." }),
    fallback: new AnthropicAdapter({ apiKey: "..." }),
  },
});

try {
  return await ai.chat({
    adapter: "primary",
    model: "gpt-4", // ✅ Type-safe
    messages,
  });
} catch {
  return await ai.chat({
    adapter: "fallback",
    model: "claude-3-5-sonnet-20241022", // ✅ Type-safe
    messages,
  });
}
```

### Pattern 3: Task-Based Routing

```typescript
function getAdapter(task: string): "openai" | "anthropic" {
  return task === "code" ? "openai" : "anthropic";
}

const adapter = getAdapter(userTask);
await ai.chat({
  adapter,
  model: adapter === "openai" ? "gpt-4" : "claude-3-5-sonnet-20241022",
  messages,
});
```

## Troubleshooting

### Error: Model not assignable to type

**Cause**: Using a model that's not supported by the selected adapter

**Solution**: Check which models are available for your adapter:
- OpenAI: `gpt-4`, `gpt-4o`, `gpt-3.5-turbo`, etc.
- Anthropic: `claude-3-5-sonnet-20241022`, etc.
- Gemini: `gemini-pro`, `gemini-1.5-pro`, etc.
- Ollama: `llama3`, `mistral`, etc.

### Error: Adapter not found

**Cause**: Using an adapter name that doesn't exist in your configuration

**Solution**: Check `ai.adapterNames` or your initial configuration

### No Autocomplete

**Cause**: TypeScript might not be inferring types correctly

**Solution**: 
1. Ensure you're using TypeScript 4.5+
2. Restart your IDE/TypeScript server
3. Check that adapters are created with `as const` arrays

## Best Practices

1. **Use const assertions** for model arrays: `as const`
2. **Define adapters once** at app initialization
3. **Use autocomplete** to discover available models
4. **Let TypeScript guide you** when switching adapters
5. **Add custom adapters** following the same pattern

## Further Reading

- `../docs/TYPE_SAFETY.md` - Complete type safety guide
- `../IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- Adapter READMEs in `../packages/ai-*/README.md`

## Contributing

When adding examples:
1. Show both valid and invalid usage
2. Include TypeScript error messages
3. Explain the "why" not just the "how"
4. Test that examples actually work
5. Keep examples focused and concise
