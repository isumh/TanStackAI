/**
 * TYPE SAFETY DEMONSTRATION
 * 
 * This file shows how the AI class provides complete TypeScript safety
 * when switching between adapters with different model sets.
 */

import { AI } from "../packages/ai/src";
import { OpenAIAdapter } from "../packages/ai-openai/src";
import { AnthropicAdapter } from "../packages/ai-anthropic/src";

const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({ apiKey: "test" }),
    anthropic: new AnthropicAdapter({ apiKey: "test" }),
  },
});

// ============================================
// ✅ VALID EXAMPLES - These compile without errors
// ============================================

// OpenAI with GPT models
ai.chat({
  adapter: "openai",
  model: "gpt-4", // ✅ Valid
  messages: [],
});

ai.chat({
  adapter: "openai",
  model: "gpt-4o", // ✅ Valid
  messages: [],
});

ai.chat({
  adapter: "openai",
  model: "gpt-3.5-turbo", // ✅ Valid
  messages: [],
});

// Anthropic with Claude models
ai.chat({
  adapter: "anthropic",
  model: "claude-3-5-sonnet-20241022", // ✅ Valid
  messages: [],
});

ai.chat({
  adapter: "anthropic",
  model: "claude-3-opus-20240229", // ✅ Valid
  messages: [],
});

// ============================================
// ❌ INVALID EXAMPLES - Uncomment to see TypeScript errors
// ============================================

// Example 1: Using GPT model with Anthropic adapter
// ai.chat({
//   adapter: "anthropic",
//   model: "gpt-4", // ❌ Error: Type '"gpt-4"' is not assignable to type 'claude-3-5-sonnet-20241022" | "claude-3-opus-20240229" | ...'
//   messages: [],
// });

// Example 2: Using Claude model with OpenAI adapter  
// ai.chat({
//   adapter: "openai",
//   model: "claude-3-5-sonnet-20241022", // ❌ Error: Type '"claude-3-5-sonnet-20241022"' is not assignable to type '"gpt-4" | "gpt-4o" | ...'
//   messages: [],
// });

// Example 3: Typo in model name
// ai.chat({
//   adapter: "openai",
//   model: "gpt-5", // ❌ Error: Type '"gpt-5"' is not assignable to type '"gpt-4" | "gpt-4o" | ...'
//   messages: [],
// });

// ============================================
// 🎯 AUTOCOMPLETE DEMONSTRATION
// ============================================

// When you type the following, your IDE will show you:
//
// ai.chat({
//   adapter: "openai",
//   model: "gpt-" // <-- IDE shows: gpt-4, gpt-4-turbo, gpt-4o, gpt-3.5-turbo, etc.
//   messages: [],
// });
//
// ai.chat({
//   adapter: "anthropic",
//   model: "claude-" // <-- IDE shows: claude-3-5-sonnet-20241022, claude-3-opus-20240229, etc.
//   messages: [],
// });

// ============================================
// 📝 KEY BENEFITS
// ============================================

/*
1. **Catch errors at compile time**: No more runtime errors from invalid model names
2. **Autocomplete support**: Your IDE will suggest valid models based on the adapter
3. **Refactoring safety**: If you change the adapter, TypeScript will flag incompatible models
4. **Self-documenting**: You can see all available models for each adapter in your IDE
5. **No manual validation**: TypeScript enforces the constraints automatically

BEFORE (without type safety):
  - Runtime error: "Model 'gpt-4' not found for provider 'anthropic'"
  - Have to check docs for valid model names
  - Easy to make typos

AFTER (with type safety):
  - Compile-time error: "Type 'gpt-4' is not assignable..."
  - IDE autocomplete shows all valid models
  - Impossible to use wrong model by accident
*/

export { };
