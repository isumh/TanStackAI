export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
  };
  execute?: (args: any) => Promise<string> | string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
  tools?: Tool[];
  toolChoice?:
  | "auto"
  | "none"
  | { type: "function"; function: { name: string } };
  maxIterations?: number; // For automatic tool execution (default: 5)
  metadata?: Record<string, any>;
}

export type StreamChunkType = "content" | "tool_call" | "done" | "error";

export interface BaseStreamChunk {
  type: StreamChunkType;
  id: string;
  model: string;
  timestamp: number;
}

export interface ContentStreamChunk extends BaseStreamChunk {
  type: "content";
  delta: string; // The incremental content token
  content: string; // Full accumulated content so far
  role?: "assistant";
}

export interface ToolCallStreamChunk extends BaseStreamChunk {
  type: "tool_call";
  toolCall: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string; // Incremental JSON arguments
    };
  };
  index: number;
}

export interface DoneStreamChunk extends BaseStreamChunk {
  type: "done";
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ErrorStreamChunk extends BaseStreamChunk {
  type: "error";
  error: {
    message: string;
    code?: string;
  };
}

export type StreamChunk =
  | ContentStreamChunk
  | ToolCallStreamChunk
  | DoneStreamChunk
  | ErrorStreamChunk;

// Legacy support - keep for backwards compatibility
export interface ChatCompletionChunk {
  id: string;
  model: string;
  content: string;
  role?: "assistant";
  finishReason?: "stop" | "length" | "content_filter" | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatCompletionResult {
  id: string;
  model: string;
  content: string | null;
  role: "assistant";
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
  toolCalls?: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface TextGenerationOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface TextGenerationResult {
  id: string;
  model: string;
  text: string;
  finishReason: "stop" | "length" | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface SummarizationOptions {
  model: string;
  text: string;
  maxLength?: number;
  style?: "bullet-points" | "paragraph" | "concise";
  focus?: string[];
}

export interface SummarizationResult {
  id: string;
  model: string;
  summary: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingOptions {
  model: string;
  input: string | string[];
  dimensions?: number;
}

export interface EmbeddingResult {
  id: string;
  model: string;
  embeddings: number[][];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface AIAdapter<TModels extends readonly string[] = readonly string[]> {
  name: string;
  models: TModels;

  // Chat methods
  chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResult>;

  // Legacy streaming (kept for backwards compatibility)
  chatCompletionStream(
    options: ChatCompletionOptions
  ): AsyncIterable<ChatCompletionChunk>;

  // New structured streaming with JSON chunks
  chatStream(options: ChatCompletionOptions): AsyncIterable<StreamChunk>;

  // Text generation methods
  generateText(options: TextGenerationOptions): Promise<TextGenerationResult>;
  generateTextStream(options: TextGenerationOptions): AsyncIterable<string>;

  // Summarization
  summarize(options: SummarizationOptions): Promise<SummarizationResult>;

  // Embeddings
  createEmbeddings(options: EmbeddingOptions): Promise<EmbeddingResult>;
}

export interface AIAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}
