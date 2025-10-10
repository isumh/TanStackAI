import OpenAI from "openai";
import {
  BaseAdapter,
  type AIAdapterConfig,
  type ChatCompletionOptions,
  type ChatCompletionResult,
  type ChatCompletionChunk,
  type TextGenerationOptions,
  type TextGenerationResult,
  type SummarizationOptions,
  type SummarizationResult,
  type EmbeddingOptions,
  type EmbeddingResult,
} from "@tanstack/ai";

export interface OpenAIAdapterConfig extends AIAdapterConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

const OPENAI_MODELS = [
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-turbo-preview",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-instruct",
  "text-embedding-ada-002",
  "text-embedding-3-small",
  "text-embedding-3-large",
] as const;

export type OpenAIModel = (typeof OPENAI_MODELS)[number];

export class OpenAIAdapter extends BaseAdapter<typeof OPENAI_MODELS> {
  name = "openai";
  models = OPENAI_MODELS;
  private client: OpenAI;

  constructor(config: OpenAIAdapterConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      timeout: config.timeout,
      maxRetries: config.maxRetries,
      defaultHeaders: config.headers,
    });
  }

  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    const requestParams: any = {
      model: options.model || "gpt-3.5-turbo",
      messages: options.messages.map((msg) => {
        if (msg.role === "tool" && msg.toolCallId) {
          return {
            role: "tool" as const,
            content: msg.content || "",
            tool_call_id: msg.toolCallId,
          };
        }
        if (msg.role === "assistant" && msg.toolCalls) {
          return {
            role: "assistant" as const,
            content: msg.content,
            tool_calls: msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: tc.type,
              function: tc.function,
            })),
          };
        }
        return {
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content || "",
          name: msg.name,
        };
      }),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: false,
    };

    // Only add tools if they exist
    if (options.tools && options.tools.length > 0) {
      requestParams.tools = options.tools.map((t) => ({
        type: t.type,
        function: t.function,
      }));
      requestParams.tool_choice = options.toolChoice || "auto";
    }

    const response = await this.client.chat.completions.create(requestParams);

    const choice = response.choices[0];

    return {
      id: response.id,
      model: response.model,
      content: choice.message.content,
      role: "assistant",
      finishReason: choice.finish_reason as any,
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: tc.type,
        function: tc.function,
      })),
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async *chatCompletionStream(
    options: ChatCompletionOptions
  ): AsyncIterable<ChatCompletionChunk> {
    const stream = await this.client.chat.completions.create({
      model: options.model || "gpt-3.5-turbo",
      messages: options.messages.map((msg) => {
        if (msg.role === "tool" && msg.toolCallId) {
          return {
            role: "tool" as const,
            content: msg.content || "",
            tool_call_id: msg.toolCallId,
          };
        }
        if (msg.role === "assistant" && msg.toolCalls) {
          return {
            role: "assistant" as const,
            content: msg.content,
            tool_calls: msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: tc.type,
              function: tc.function,
            })),
          };
        }
        return {
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content || "",
          name: msg.name,
        };
      }),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          id: chunk.id,
          model: chunk.model,
          content: delta.content,
          role: delta.role as "assistant" | undefined,
          finishReason: chunk.choices[0]?.finish_reason as any,
        };
      }
    }
  }

  async *chatStream(
    options: ChatCompletionOptions
  ): AsyncIterable<import("@tanstack/ai").StreamChunk> {
    // Debug: Log incoming options
    if (process.env.DEBUG_TOOLS) {
      console.error(
        "[DEBUG chatStream] Received options.tools:",
        options.tools ? `${options.tools.length} tools` : "undefined"
      );
      if (options.tools && options.tools.length > 0) {
        console.error(
          "[DEBUG chatStream] First tool:",
          JSON.stringify(options.tools[0], null, 2)
        );
      }
    }

    const requestParams: any = {
      model: options.model || "gpt-3.5-turbo",
      messages: options.messages.map((msg) => {
        if (msg.role === "tool" && msg.toolCallId) {
          return {
            role: "tool" as const,
            content: msg.content || "",
            tool_call_id: msg.toolCallId,
          };
        }
        if (msg.role === "assistant" && msg.toolCalls) {
          return {
            role: "assistant" as const,
            content: msg.content,
            tool_calls: msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: tc.type,
              function: tc.function,
            })),
          };
        }
        return {
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content || "",
          name: msg.name,
        };
      }),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: true,
    };

    // Only add tools if they exist
    if (options.tools && options.tools.length > 0) {
      requestParams.tools = options.tools.map((t) => ({
        type: t.type,
        function: t.function,
      }));
      if (options.toolChoice) {
        requestParams.tool_choice = options.toolChoice;
      }

      // Debug: Log what we're sending
      if (process.env.DEBUG_TOOLS) {
        console.error(
          "[DEBUG] Sending tools to OpenAI:",
          JSON.stringify(requestParams.tools, null, 2)
        );
        console.error("[DEBUG] Tool choice:", requestParams.tool_choice);
      }
    } else if (process.env.DEBUG_TOOLS) {
      console.error("[DEBUG] NO TOOLS - options.tools is empty or undefined");
      console.error("[DEBUG] options.tools:", options.tools);
    }

    // Final debug: Show the complete request
    if (process.env.DEBUG_TOOLS) {
      console.error(
        "[DEBUG] Final request params keys:",
        Object.keys(requestParams)
      );
      console.error("[DEBUG] Has tools property:", "tools" in requestParams);
    }

    const stream = (await this.client.chat.completions.create(
      requestParams
    )) as any;

    let accumulatedContent = "";
    const timestamp = Date.now();

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const choice = chunk.choices[0];

        // Handle content delta
        if (delta?.content) {
          accumulatedContent += delta.content;
          yield {
            type: "content",
            id: chunk.id,
            model: chunk.model,
            timestamp,
            delta: delta.content,
            content: accumulatedContent,
            role: "assistant",
          };
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            yield {
              type: "tool_call",
              id: chunk.id,
              model: chunk.model,
              timestamp,
              toolCall: {
                id: toolCall.id || `call_${Date.now()}`,
                type: "function",
                function: {
                  name: toolCall.function?.name || "",
                  arguments: toolCall.function?.arguments || "",
                },
              },
              index: toolCall.index || 0,
            };
          }
        }

        // Handle completion
        if (choice?.finish_reason) {
          yield {
            type: "done",
            id: chunk.id,
            model: chunk.model,
            timestamp,
            finishReason: choice.finish_reason as any,
            usage: chunk.usage
              ? {
                promptTokens: chunk.usage.prompt_tokens || 0,
                completionTokens: chunk.usage.completion_tokens || 0,
                totalTokens: chunk.usage.total_tokens || 0,
              }
              : undefined,
          };
        }
      }
    } catch (error: any) {
      yield {
        type: "error",
        id: this.generateId(),
        model: options.model || "gpt-3.5-turbo",
        timestamp,
        error: {
          message: error.message || "Unknown error occurred",
          code: error.code,
        },
      };
    }
  }

  async generateText(
    options: TextGenerationOptions
  ): Promise<TextGenerationResult> {
    const response = await this.client.completions.create({
      model: options.model || "gpt-3.5-turbo-instruct",
      prompt: options.prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: false,
    });

    const choice = response.choices[0];

    return {
      id: response.id,
      model: response.model,
      text: choice.text,
      finishReason: choice.finish_reason as any,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async *generateTextStream(
    options: TextGenerationOptions
  ): AsyncIterable<string> {
    const stream = await this.client.completions.create({
      model: options.model || "gpt-3.5-turbo-instruct",
      prompt: options.prompt,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      stop: options.stopSequences,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.text) {
        yield chunk.choices[0].text;
      }
    }
  }

  async summarize(options: SummarizationOptions): Promise<SummarizationResult> {
    const systemPrompt = this.buildSummarizationPrompt(options);

    const response = await this.client.chat.completions.create({
      model: options.model || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: options.text },
      ],
      max_tokens: options.maxLength,
      temperature: 0.3,
      stream: false,
    });

    return {
      id: response.id,
      model: response.model,
      summary: response.choices[0].message.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  }

  async createEmbeddings(options: EmbeddingOptions): Promise<EmbeddingResult> {
    const response = await this.client.embeddings.create({
      model: options.model || "text-embedding-ada-002",
      input: options.input,
      dimensions: options.dimensions,
    });

    return {
      id: this.generateId(),
      model: response.model,
      embeddings: response.data.map((d) => d.embedding),
      usage: {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }

  private buildSummarizationPrompt(options: SummarizationOptions): string {
    let prompt = "You are a professional summarizer. ";

    switch (options.style) {
      case "bullet-points":
        prompt += "Provide a summary in bullet point format. ";
        break;
      case "paragraph":
        prompt += "Provide a summary in paragraph format. ";
        break;
      case "concise":
        prompt += "Provide a very concise summary in 1-2 sentences. ";
        break;
      default:
        prompt += "Provide a clear and concise summary. ";
    }

    if (options.focus && options.focus.length > 0) {
      prompt += `Focus on the following aspects: ${options.focus.join(", ")}. `;
    }

    if (options.maxLength) {
      prompt += `Keep the summary under ${options.maxLength} tokens. `;
    }

    return prompt;
  }
}
