import { AI } from "../packages/ai/src";
import { OpenAIAdapter } from "../packages/ai-openai/src";
import { AnthropicAdapter } from "../packages/ai-anthropic/src";

// Create AI instance with multiple adapters
const ai = new AI({
  adapters: {
    "openai": new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || "",
    }),
    "anthropic": new AnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    }),
  },
});

// ✅ VALID: OpenAI with gpt-4 model
async function validOpenAI() {
  const response = await ai.chat({
    adapter: "openai",
    model: "gpt-4", // ✅ TypeScript knows this is valid for OpenAI
    messages: [
      {
        role: "user",
        content: "Hello!",
      },
    ],
  });
  console.log(response.content);
}

// ✅ VALID: Anthropic with claude model
async function validAnthropic() {
  const response = await ai.chat({
    adapter: "anthropic",
    model: "claude-3-5-sonnet-20241022", // ✅ TypeScript knows this is valid for Anthropic
    messages: [
      {
        role: "user",
        content: "Hello!",
      },
    ],
  });
  console.log(response.content);
}

// ❌ INVALID EXAMPLES - These will show TypeScript errors!
// Uncomment to see the type safety in action:

/*
// ❌ Anthropic doesn't have "gpt-4" in its models array
async function invalidMixedModels() {
  const response = await ai.chat({
    adapter: "anthropic",
    model: "gpt-4", // ❌ TypeScript error: "gpt-4" is not assignable to Anthropic models!
    messages: [{ role: "user", content: "Hello!" }],
  });
}

// ❌ OpenAI doesn't have Claude models
async function invalidMixedModels2() {
  const response = await ai.chat({
    adapter: "openai",
    model: "claude-3-5-sonnet-20241022", // ❌ TypeScript error: Claude model not in OpenAI!
    messages: [{ role: "user", content: "Hello!" }],
  });
}
*/

// ✅ AUTOCOMPLETE: When you type "openai" as adapter, TypeScript will show you:
// - gpt-4
// - gpt-4-turbo
// - gpt-4o
// - gpt-3.5-turbo
// - etc.

// ✅ AUTOCOMPLETE: When you type "anthropic" as adapter, TypeScript will show you:
// - claude-3-5-sonnet-20241022
// - claude-3-opus-20240229
// - claude-3-sonnet-20240229
// - etc.

// Demo: The power of type safety
async function demonstrateSafety() {
  console.log("=== Type-Safe Model Selection Demo ===\n");

  // When switching adapters, you MUST change the model too
  // TypeScript won't let you use incompatible models!

  console.log("✅ Using OpenAI with gpt-4:");
  await validOpenAI();

  console.log("\n✅ Using Anthropic with Claude:");
  await validAnthropic();

  console.log("\n❌ The invalid examples above won't compile!");
  console.log("Try uncommenting them to see TypeScript errors.");
}

// demonstrateSafety().catch(console.error);

// Additional type safety for other methods
export async function streamingSafety() {
  // ✅ VALID: Streaming with correct model
  for await (const chunk of ai.streamChat({
    adapter: "openai",
    model: "gpt-4", // ✅ Correct
    messages: [{ role: "user", content: "Count to 5" }],
  })) {
    if (chunk.type === "content") {
      process.stdout.write(chunk.delta);
    }
  }

  // ❌ INVALID: Would fail TypeScript check
  // for await (const chunk of ai.streamChat({
  //   adapter: "openai",
  //   model: "claude-3-5-sonnet-20241022", // ❌ Wrong model for OpenAI
  //   messages: [{ role: "user", content: "Count to 5" }],
  // })) {
  //   // ...
  // }
}

// Type safety extends to all methods!
export async function allMethodsSafe() {
  // generateText
  await ai.generateText({
    adapter: "openai",
    model: "gpt-3.5-turbo-instruct", // ✅ Valid
    prompt: "Hello",
  });

  // summarize
  await ai.summarize({
    adapter: "anthropic",
    model: "claude-3-haiku-20240307", // ✅ Valid
    text: "Long text here...",
  });

  // embed
  await ai.embed({
    adapter: "openai",
    model: "text-embedding-3-small", // ✅ Valid
    input: "Text to embed",
  });
}

export { validOpenAI, validAnthropic, demonstrateSafety };
