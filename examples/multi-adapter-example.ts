import { AI } from "../packages/ai/src";
import { OpenAIAdapter } from "../packages/ai-openai/src";
import { AnthropicAdapter } from "../packages/ai-anthropic/src";

// Create AI instance with multiple adapters
const ai = new AI({
  adapters: {
    "open-ai": new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || "",
    }),
    anthropic: new AnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    }),
  },
});

// Example 1: Chat with OpenAI (typesafe - autocomplete works!)
async function chatWithOpenAI() {
  const response = await ai.chat({
    adapter: "open-ai", // TypeScript knows these are the available adapters
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "What is the capital of France?",
      },
    ],
  });

  console.log("OpenAI Response:", response.content);
}

// Example 2: Chat with Anthropic (typesafe - autocomplete works!)
async function chatWithAnthropic() {
  const response = await ai.chat({
    adapter: "anthropic", // TypeScript knows these are the available adapters
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user",
        content: "What is the capital of Germany?",
      },
    ],
  });

  console.log("Anthropic Response:", response.content);
}

// Example 3: Stream chat
async function streamChatExample() {
  console.log("\nStreaming from OpenAI:");
  for await (const chunk of ai.streamChat({
    adapter: "open-ai",
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "Count from 1 to 5",
      },
    ],
  })) {
    if (chunk.type === "content") {
      process.stdout.write(chunk.delta);
    }
  }
  console.log("\n");
}

// Example 4: Get adapter names
function showAdapters() {
  console.log("Available adapters:", ai.adapterNames);
}

// Example 5: Add a new adapter dynamically (returns a new AI instance with updated types)
function addNewAdapter() {
  const aiWithGemini = ai.addAdapter(
    "gemini",
    new OpenAIAdapter({ apiKey: "fake-key" }) // Using OpenAI as placeholder
  );

  // Now "gemini" is available in the types!
  // aiWithGemini.chat({ adapter: "gemini", ... })
}

// Run examples
async function main() {
  showAdapters();
  await chatWithOpenAI();
  await chatWithAnthropic();
  await streamChatExample();
}

main().catch(console.error);
