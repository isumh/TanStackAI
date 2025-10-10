import type {
  AIAdapter,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatCompletionChunk,
  StreamChunk,
  TextGenerationOptions,
  TextGenerationResult,
  SummarizationOptions,
  SummarizationResult,
  EmbeddingOptions,
  EmbeddingResult,
} from "./types";

type AdapterMap = Record<string, AIAdapter<readonly string[]>>;

interface AIConfig<T extends AdapterMap> {
  adapters: T;
}

// Extract model type from an adapter
type ExtractModels<T> = T extends AIAdapter<infer M> ? M[number] : string;

// Create options type with adapter-specific model constraint
type ChatOptionsWithAdapter<
  TAdapters extends AdapterMap,
  K extends keyof TAdapters & string
> = Omit<ChatCompletionOptions, "model"> & {
  adapter: K;
  model: ExtractModels<TAdapters[K]>;
};

type TextGenerationOptionsWithAdapter<
  TAdapters extends AdapterMap,
  K extends keyof TAdapters & string
> = Omit<TextGenerationOptions, "model"> & {
  adapter: K;
  model: ExtractModels<TAdapters[K]>;
};

type SummarizationOptionsWithAdapter<
  TAdapters extends AdapterMap,
  K extends keyof TAdapters & string
> = Omit<SummarizationOptions, "model"> & {
  adapter: K;
  model: ExtractModels<TAdapters[K]>;
};

type EmbeddingOptionsWithAdapter<
  TAdapters extends AdapterMap,
  K extends keyof TAdapters & string
> = Omit<EmbeddingOptions, "model"> & {
  adapter: K;
  model: ExtractModels<TAdapters[K]>;
};

export class AI<T extends AdapterMap = AdapterMap> {
  private adapters: T;

  constructor(config: AIConfig<T>) {
    this.adapters = config.adapters;
  }

  /**
   * Get an adapter by name
   */
  getAdapter<K extends keyof T & string>(name: K): T[K] {
    const adapter = this.adapters[name];
    if (!adapter) {
      throw new Error(
        `Adapter "${name}" not found. Available adapters: ${Object.keys(this.adapters).join(", ")}`
      );
    }
    return adapter;
  }

  /**
   * Get all adapter names
   */
  get adapterNames(): Array<keyof T & string> {
    return Object.keys(this.adapters) as Array<keyof T & string>;
  }

  /**
   * Complete a chat conversation
   */
  async chat<K extends keyof T & string>(
    options: ChatOptionsWithAdapter<T, K>
  ): Promise<ChatCompletionResult> {
    const { adapter, ...restOptions } = options;
    return this.getAdapter(adapter).chatCompletion(restOptions as ChatCompletionOptions);
  }

  /**
   * Complete a chat conversation with streaming (legacy)
   * @deprecated Use streamChat() for structured streaming with JSON chunks
   */
  async *chatStream<K extends keyof T & string>(
    options: ChatOptionsWithAdapter<T, K>
  ): AsyncIterable<ChatCompletionChunk> {
    const { adapter, ...restOptions } = options;
    yield* this.getAdapter(adapter).chatCompletionStream({
      ...restOptions,
      stream: true,
    } as ChatCompletionOptions);
  }

  /**
   * Stream chat with structured JSON chunks (supports tools and detailed token info)
   * Automatically executes tools if they have execute functions
   */
  async *streamChat<K extends keyof T & string>(
    options: ChatOptionsWithAdapter<T, K>
  ): AsyncIterable<StreamChunk> {
    const { adapter, ...restOptions } = options;
    const hasToolExecutors = restOptions.tools?.some((t) => t.execute);

    const adapterInstance = this.getAdapter(adapter);

    // If no tool executors, just stream normally
    if (!hasToolExecutors) {
      yield* adapterInstance.chatStream({ ...restOptions, stream: true } as ChatCompletionOptions);
      return;
    }

    // Auto-execute tools
    const maxIterations = restOptions.maxIterations ?? 5;
    const messages = [...restOptions.messages];
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      const toolCalls: import("./types").ToolCall[] = [];
      const toolCallsMap = new Map<
        number,
        { id: string; name: string; args: string }
      >();
      let hasToolCalls = false;

      // Stream the current iteration
      for await (const chunk of adapterInstance.chatStream({
        ...restOptions,
        messages,
        stream: true,
      } as ChatCompletionOptions)) {
        yield chunk;

        // Accumulate tool calls
        if (chunk.type === "tool_call") {
          const existing = toolCallsMap.get(chunk.index) || {
            id: chunk.toolCall.id,
            name: "",
            args: "",
          };

          if (chunk.toolCall.function.name) {
            existing.name = chunk.toolCall.function.name;
          }
          existing.args += chunk.toolCall.function.arguments;
          toolCallsMap.set(chunk.index, existing);
        }

        // Check if we need to execute tools
        if (chunk.type === "done" && chunk.finishReason === "tool_calls") {
          hasToolCalls = true;
          toolCallsMap.forEach((call) => {
            toolCalls.push({
              id: call.id,
              type: "function",
              function: {
                name: call.name,
                arguments: call.args,
              },
            });
          });
        }
      }

      // If no tool calls, we're done
      if (!hasToolCalls || toolCalls.length === 0) {
        break;
      }

      // Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: null,
        toolCalls,
      });

      // Execute tools
      for (const toolCall of toolCalls) {
        const tool = restOptions.tools?.find(
          (t) => t.function.name === toolCall.function.name
        );

        if (tool?.execute) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await tool.execute(args);

            messages.push({
              role: "tool",
              content: result,
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });

            // Yield a custom chunk for tool execution
            yield {
              type: "content",
              id: this.generateId(),
              model: restOptions.model,
              timestamp: Date.now(),
              delta: "",
              content: `[Tool ${toolCall.function.name} executed]`,
              role: "assistant",
            } as StreamChunk;
          } catch (error: any) {
            messages.push({
              role: "tool",
              content: JSON.stringify({ error: error.message }),
              toolCallId: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }
      }

      // Continue loop to get final response
    }
  }

  private generateId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate text from a prompt
   */
  async generateText<K extends keyof T & string>(
    options: TextGenerationOptionsWithAdapter<T, K>
  ): Promise<TextGenerationResult> {
    const { adapter, ...restOptions } = options;
    return this.getAdapter(adapter).generateText(restOptions as TextGenerationOptions);
  }

  /**
   * Generate text from a prompt with streaming
   */
  async *generateTextStream<K extends keyof T & string>(
    options: TextGenerationOptionsWithAdapter<T, K>
  ): AsyncIterable<string> {
    const { adapter, ...restOptions } = options;
    yield* this.getAdapter(adapter).generateTextStream({
      ...restOptions,
      stream: true,
    } as TextGenerationOptions);
  }

  /**
   * Summarize text
   */
  async summarize<K extends keyof T & string>(
    options: SummarizationOptionsWithAdapter<T, K>
  ): Promise<SummarizationResult> {
    const { adapter, ...restOptions } = options;
    return this.getAdapter(adapter).summarize(restOptions as SummarizationOptions);
  }

  /**
   * Create embeddings for text
   */
  async embed<K extends keyof T & string>(
    options: EmbeddingOptionsWithAdapter<T, K>
  ): Promise<EmbeddingResult> {
    const { adapter, ...restOptions } = options;
    return this.getAdapter(adapter).createEmbeddings(restOptions as EmbeddingOptions);
  }

  /**
   * Add a new adapter
   */
  addAdapter<K extends string>(
    name: K,
    adapter: AIAdapter<readonly string[]>
  ): AI<T & Record<K, AIAdapter<readonly string[]>>> {
    const newAdapters = { ...this.adapters, [name]: adapter } as T &
      Record<K, AIAdapter<readonly string[]>>;
    return new AI({ adapters: newAdapters });
  }
}
