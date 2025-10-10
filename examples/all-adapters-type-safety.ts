/**
 * COMPREHENSIVE TYPE SAFETY EXAMPLE
 * 
 * This demonstrates type safety across all four AI adapters:
 * - OpenAI
 * - Anthropic
 * - Gemini
 * - Ollama
 */

import { AI } from "../packages/ai/src";
import { OpenAIAdapter } from "../packages/ai-openai/src";
import { AnthropicAdapter } from "../packages/ai-anthropic/src";
import { GeminiAdapter } from "../packages/ai-gemini/src";
import { OllamaAdapter } from "../packages/ai-ollama/src";

// Create AI instance with all four adapters
const ai = new AI({
  adapters: {
    openai: new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY || "",
    }),
    anthropic: new AnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    }),
    gemini: new GeminiAdapter({
      apiKey: process.env.GEMINI_API_KEY || "",
    }),
    ollama: new OllamaAdapter({
      host: "http://localhost:11434",
    }),
  },
});

// ============================================
// ✅ VALID - Each adapter with its own models
// ============================================

async function openaiExample() {
  return ai.chat({
    adapter: "openai",
    model: "gpt-4o", // ✅ Valid OpenAI model
    messages: [{ role: "user", content: "Hello from OpenAI!" }],
  });
}

async function anthropicExample() {
  return ai.chat({
    adapter: "anthropic",
    model: "claude-3-5-sonnet-20241022", // ✅ Valid Anthropic model
    messages: [{ role: "user", content: "Hello from Anthropic!" }],
  });
}

async function geminiExample() {
  return ai.chat({
    adapter: "gemini",
    model: "gemini-1.5-pro", // ✅ Valid Gemini model
    messages: [{ role: "user", content: "Hello from Gemini!" }],
  });
}

async function ollamaExample() {
  return ai.chat({
    adapter: "ollama",
    model: "llama3", // ✅ Valid Ollama model
    messages: [{ role: "user", content: "Hello from Ollama!" }],
  });
}

// ============================================
// ❌ INVALID - Cross-adapter model usage
// ============================================

// Uncomment any of these to see TypeScript errors:

/*
// ❌ Can't use GPT models with Anthropic
ai.chat({
  adapter: "anthropic",
  model: "gpt-4o", // Error!
  messages: [],
});

// ❌ Can't use Claude models with OpenAI
ai.chat({
  adapter: "openai",
  model: "claude-3-5-sonnet-20241022", // Error!
  messages: [],
});

// ❌ Can't use Gemini models with Ollama
ai.chat({
  adapter: "ollama",
  model: "gemini-pro", // Error!
  messages: [],
});

// ❌ Can't use Ollama models with Gemini
ai.chat({
  adapter: "gemini",
  model: "llama3", // Error!
  messages: [],
});
*/

// ============================================
// 🎯 IDE AUTOCOMPLETE DEMONSTRATION
// ============================================

/*
When you type:
  
  ai.chat({
    adapter: "openai",
    model: "gpt-" // IDE shows: gpt-4, gpt-4o, gpt-3.5-turbo, etc.
  })

  ai.chat({
    adapter: "anthropic",
    model: "claude-" // IDE shows: claude-3-5-sonnet-20241022, etc.
  })

  ai.chat({
    adapter: "gemini",
    model: "gemini-" // IDE shows: gemini-pro, gemini-1.5-pro, etc.
  })

  ai.chat({
    adapter: "ollama",
    model: "llama" // IDE shows: llama2, llama3, etc.
  })
*/

// ============================================
// 📊 MODEL COMPARISON
// ============================================

/**
 * OpenAI Models:
 * - gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini
 * - gpt-3.5-turbo, gpt-3.5-turbo-16k
 * - text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
 * 
 * Anthropic Models:
 * - claude-3-5-sonnet-20241022, claude-3-5-sonnet-20240620
 * - claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307
 * - claude-2.1, claude-2.0, claude-instant-1.2
 * 
 * Gemini Models:
 * - gemini-pro, gemini-pro-vision, gemini-ultra
 * - gemini-1.5-pro, gemini-1.5-flash
 * - embedding-001
 * 
 * Ollama Models (common):
 * - llama2, llama3
 * - codellama, mistral, mixtral
 * - phi, neural-chat, starling-lm
 * - orca-mini, vicuna, nous-hermes
 * - nomic-embed-text
 */

// ============================================
// 🔄 ADAPTER SWITCHING WITH TYPE SAFETY
// ============================================

async function switchAdapters() {
  const userMessage = { role: "user" as const, content: "What is 2+2?" };

  // Try the same question across different providers
  // TypeScript ensures we use valid models for each

  const openaiResult = await ai.chat({
    adapter: "openai",
    model: "gpt-4", // Must be OpenAI model
    messages: [userMessage],
  });

  const anthropicResult = await ai.chat({
    adapter: "anthropic",
    model: "claude-3-haiku-20240307", // Must be Anthropic model
    messages: [userMessage],
  });

  const geminiResult = await ai.chat({
    adapter: "gemini",
    model: "gemini-pro", // Must be Gemini model
    messages: [userMessage],
  });

  const ollamaResult = await ai.chat({
    adapter: "ollama",
    model: "mistral", // Must be Ollama model
    messages: [userMessage],
  });

  return {
    openai: openaiResult.content,
    anthropic: anthropicResult.content,
    gemini: geminiResult.content,
    ollama: ollamaResult.content,
  };
}

// ============================================
// 🎨 SPECIALIZED MODELS FOR SPECIFIC TASKS
// ============================================

async function embeddingExamples() {
  // OpenAI has dedicated embedding models
  const openaiEmbedding = await ai.embed({
    adapter: "openai",
    model: "text-embedding-3-small", // ✅ OpenAI embedding model
    input: "Text to embed",
  });

  // Gemini has its embedding model
  const geminiEmbedding = await ai.embed({
    adapter: "gemini",
    model: "embedding-001", // ✅ Gemini embedding model
    input: "Text to embed",
  });

  // Ollama has Nomic embedding
  const ollamaEmbedding = await ai.embed({
    adapter: "ollama",
    model: "nomic-embed-text", // ✅ Ollama embedding model
    input: "Text to embed",
  });

  // ❌ This would be a TypeScript error:
  // ai.embed({
  //   adapter: "openai",
  //   model: "embedding-001", // Error: Gemini model in OpenAI!
  //   input: "Text",
  // });

  return { openaiEmbedding, geminiEmbedding, ollamaEmbedding };
}

// ============================================
// 🚀 REAL-WORLD USAGE PATTERN
// ============================================

async function intelligentRouting(query: string) {
  // Route to different models based on the task
  // TypeScript ensures we use valid models for each adapter

  if (query.includes("code")) {
    // Use OpenAI's GPT-4 for coding tasks
    return ai.chat({
      adapter: "openai",
      model: "gpt-4o", // TypeScript: ✅
      messages: [{ role: "user", content: query }],
    });
  } else if (query.includes("creative")) {
    // Use Claude for creative writing
    return ai.chat({
      adapter: "anthropic",
      model: "claude-3-5-sonnet-20241022", // TypeScript: ✅
      messages: [{ role: "user", content: query }],
    });
  } else if (query.includes("quick")) {
    // Use Gemini Flash for quick responses
    return ai.chat({
      adapter: "gemini",
      model: "gemini-1.5-flash", // TypeScript: ✅
      messages: [{ role: "user", content: query }],
    });
  } else {
    // Use local Ollama for privacy
    return ai.chat({
      adapter: "ollama",
      model: "llama3", // TypeScript: ✅
      messages: [{ role: "user", content: query }],
    });
  }
}

// ============================================
// ✨ EXPORT FOR TESTING
// ============================================

export {
  ai,
  openaiExample,
  anthropicExample,
  geminiExample,
  ollamaExample,
  switchAdapters,
  embeddingExamples,
  intelligentRouting,
};
