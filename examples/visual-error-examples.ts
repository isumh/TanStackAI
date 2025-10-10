/**
 * VISUAL DEMONSTRATION OF TYPE SAFETY ERRORS
 * 
 * This file shows exactly what TypeScript errors you'll see
 * when trying to use incompatible adapters and models.
 * 
 * Uncomment the examples to see the errors in your IDE!
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
// EXAMPLE 1: Using GPT model with Anthropic
// ============================================

/*
ai.chat({
  adapter: "anthropic",
  model: "gpt-4",
  //     ^^^^^^
  //     TypeScript Error:
  //     Type '"gpt-4"' is not assignable to type 
  //     '"claude-3-5-sonnet-20241022" | "claude-3-5-sonnet-20240620" | 
  //      "claude-3-opus-20240229" | "claude-3-sonnet-20240229" | 
  //      "claude-3-haiku-20240307" | "claude-2.1" | "claude-2.0" | 
  //      "claude-instant-1.2"'
  messages: [],
});
*/

// ============================================
// EXAMPLE 2: Using Claude model with OpenAI
// ============================================

/*
ai.chat({
  adapter: "openai",
  model: "claude-3-5-sonnet-20241022",
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     TypeScript Error:
  //     Type '"claude-3-5-sonnet-20241022"' is not assignable to type
  //     '"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-4o" | 
  //      "gpt-4o-mini" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | 
  //      "gpt-3.5-turbo-instruct" | "text-embedding-ada-002" | 
  //      "text-embedding-3-small" | "text-embedding-3-large"'
  messages: [],
});
*/

// ============================================
// EXAMPLE 3: Typo in model name
// ============================================

/*
ai.chat({
  adapter: "openai",
  model: "gpt-5", // Typo! Should be gpt-4 or gpt-4o
  //     ^^^^^^
  //     TypeScript Error:
  //     Type '"gpt-5"' is not assignable to type
  //     '"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-4o" | ...'
  messages: [],
});
*/

// ============================================
// EXAMPLE 4: Wrong adapter name
// ============================================

/*
ai.chat({
  adapter: "openai-gpt4", // Typo! Should be "openai"
  //       ^^^^^^^^^^^^^
  //       TypeScript Error:
  //       Argument of type '"openai-gpt4"' is not assignable to parameter
  //       Expected: "openai" | "anthropic"
  model: "gpt-4",
  messages: [],
});
*/

// ============================================
// EXAMPLE 5: Embedding model with chat
// ============================================

/*
// This is technically valid TypeScript (embedding models are in the list)
// but semantically wrong. You could add additional validation if needed.
ai.chat({
  adapter: "openai",
  model: "text-embedding-ada-002", // This is an embedding model, not chat!
  messages: [],
});
*/

// ============================================
// ✅ VALID EXAMPLES - These work fine
// ============================================

// OpenAI with GPT models
ai.chat({
  adapter: "openai",
  model: "gpt-4", // ✅
  messages: [],
});

ai.chat({
  adapter: "openai",
  model: "gpt-4o", // ✅
  messages: [],
});

ai.chat({
  adapter: "openai",
  model: "gpt-3.5-turbo", // ✅
  messages: [],
});

// Anthropic with Claude models
ai.chat({
  adapter: "anthropic",
  model: "claude-3-5-sonnet-20241022", // ✅
  messages: [],
});

ai.chat({
  adapter: "anthropic",
  model: "claude-3-opus-20240229", // ✅
  messages: [],
});

ai.chat({
  adapter: "anthropic",
  model: "claude-3-haiku-20240307", // ✅
  messages: [],
});

// ============================================
// 🎯 IDE AUTOCOMPLETE VISUAL
// ============================================

/*
When you type this in your IDE:

  ai.chat({
    adapter: "openai",
    model: "gpt-█
           ^^^^
           Your IDE shows a dropdown with:
           ✓ gpt-4
           ✓ gpt-4-turbo
           ✓ gpt-4-turbo-preview
           ✓ gpt-4o
           ✓ gpt-4o-mini
           ✓ gpt-3.5-turbo
           ✓ gpt-3.5-turbo-16k
           ✓ gpt-3.5-turbo-instruct
           ✓ text-embedding-ada-002
           ✓ text-embedding-3-small
           ✓ text-embedding-3-large
  })

When you change to Anthropic:

  ai.chat({
    adapter: "anthropic",
    model: "claude-█
           ^^^^^^^
           Your IDE shows a dropdown with:
           ✓ claude-3-5-sonnet-20241022
           ✓ claude-3-5-sonnet-20240620
           ✓ claude-3-opus-20240229
           ✓ claude-3-sonnet-20240229
           ✓ claude-3-haiku-20240307
           ✓ claude-2.1
           ✓ claude-2.0
           ✓ claude-instant-1.2
  })
*/

// ============================================
// 📝 COMPARISON: Before vs After
// ============================================

/*
BEFORE (Runtime Error):
  await ai.chat({
    provider: "anthropic",
    model: "gpt-4"
  });
  // ❌ Runtime Error (in production!):
  // Error: Model 'gpt-4' not found for provider 'anthropic'

AFTER (Compile Error):
  await ai.chat({
    adapter: "anthropic",
    model: "gpt-4"
  });
  // ❌ Compile Error (in your editor!):
  // Type '"gpt-4"' is not assignable to type 'claude-...'
  //
  // You see the error IMMEDIATELY while coding
  // Your build fails if you try to deploy
  // Your CI/CD catches it before production
*/

// ============================================
// 🚀 REAL WORLD SCENARIO
// ============================================

/*
Imagine you're refactoring and switching from OpenAI to Anthropic:

STEP 1: Change the adapter
  ai.chat({
    adapter: "anthropic", // Changed from "openai"
    model: "gpt-4", // ← TypeScript IMMEDIATELY flags this!
    messages: []
  });

STEP 2: TypeScript tells you to fix it
  Error: Type '"gpt-4"' is not assignable to type '"claude-3-5-sonnet-20241022" | ...'

STEP 3: You fix it
  ai.chat({
    adapter: "anthropic",
    model: "claude-3-5-sonnet-20241022", // ✅ Fixed!
    messages: []
  });

Without type safety:
  - You might miss updating the model
  - It compiles successfully
  - It deploys to production
  - It crashes when a user makes a request
  - You get paged at 3 AM 😴

With type safety:
  - TypeScript catches it immediately
  - You fix it before committing
  - It never reaches production
  - You sleep peacefully 😊
*/

export { };
