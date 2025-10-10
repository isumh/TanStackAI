import { Ollama } from "ollama";
import {
  BaseAdapter,
  convertLegacyStream,
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
  type StreamChunk,
} from "@tanstack/ai";

export interface OllamaAdapterConfig extends AIAdapterConfig {
  host?: string;
}

const OLLAMA_MODELS = [
  "llama2",
  "llama3",
  "codellama",
  "mistral",
  "mixtral",
  "phi",
  "neural-chat",
  "starling-lm",
  "orca-mini",
  "vicuna",
  "nous-hermes",
  "nomic-embed-text",
  "gpt-oss:20b"
] as const;

export type OllamaModel = (typeof OLLAMA_MODELS)[number];

export class OllamaAdapter extends BaseAdapter<typeof OLLAMA_MODELS> {
  name = "ollama";
  models = OLLAMA_MODELS;
  private client: Ollama;

  constructor(config: OllamaAdapterConfig = {}) {
    super(config);
    this.client = new Ollama({
      host: config.host || "http://localhost:11434",
    });
  }

  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResult> {
    const response = await this.client.chat({
      model: options.model || "llama2",
      messages: options.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content || "",
      })),
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        num_predict: options.maxTokens,
        stop: options.stopSequences,
      },
      stream: false,
    });

    // Estimate token usage since Ollama doesn't provide exact counts
    const promptTokens = this.estimateTokens(
      options.messages.map((m) => m.content).join(" ")
    );
    const completionTokens = this.estimateTokens(response.message.content);

    return {
      id: this.generateId(),
      model: response.model,
      content: response.message.content,
      role: "assistant",
      finishReason: response.done ? "stop" : "length",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  async *chatCompletionStream(
    options: ChatCompletionOptions
  ): AsyncIterable<ChatCompletionChunk> {
    const response = await this.client.chat({
      model: options.model || "llama2",
      messages: options.messages.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content || "",
      })),
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        num_predict: options.maxTokens,
        stop: options.stopSequences,
      },
      stream: true,
    });

    for await (const chunk of response) {
      yield {
        id: this.generateId(),
        model: chunk.model || options.model || "llama2",
        content: chunk.message.content,
        role: "assistant",
        finishReason: chunk.done ? "stop" : null,
      };
    }
  }

  async *chatStream(
    options: ChatCompletionOptions
  ): AsyncIterable<StreamChunk> {
    // Use legacy stream converter for now
    // TODO: Implement native structured streaming for Ollama
    yield* convertLegacyStream(
      this.chatCompletionStream(options),
      options.model || "llama2"
    );
  }

  async generateText(
    options: TextGenerationOptions
  ): Promise<TextGenerationResult> {
    const response = await this.client.generate({
      model: options.model || "llama2",
      prompt: options.prompt,
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        num_predict: options.maxTokens,
        stop: options.stopSequences,
      },
      stream: false,
    });

    const promptTokens = this.estimateTokens(options.prompt);
    const completionTokens = this.estimateTokens(response.response);

    return {
      id: this.generateId(),
      model: response.model,
      text: response.response,
      finishReason: response.done ? "stop" : "length",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  async *generateTextStream(
    options: TextGenerationOptions
  ): AsyncIterable<string> {
    const response = await this.client.generate({
      model: options.model || "llama2",
      prompt: options.prompt,
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        num_predict: options.maxTokens,
        stop: options.stopSequences,
      },
      stream: true,
    });

    for await (const chunk of response) {
      yield chunk.response;
    }
  }

  async summarize(options: SummarizationOptions): Promise<SummarizationResult> {
    const prompt = this.buildSummarizationPrompt(options, options.text);

    const response = await this.client.generate({
      model: options.model || "llama2",
      prompt,
      options: {
        temperature: 0.3,
        num_predict: options.maxLength || 500,
      },
      stream: false,
    });

    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = this.estimateTokens(response.response);

    return {
      id: this.generateId(),
      model: response.model,
      summary: response.response,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  async createEmbeddings(options: EmbeddingOptions): Promise<EmbeddingResult> {
    const inputs = Array.isArray(options.input)
      ? options.input
      : [options.input];
    const embeddings: number[][] = [];

    for (const input of inputs) {
      const response = await this.client.embeddings({
        model: options.model || "nomic-embed-text",
        prompt: input,
      });
      embeddings.push(response.embedding);
    }

    const promptTokens = inputs.reduce(
      (sum, input) => sum + this.estimateTokens(input),
      0
    );

    return {
      id: this.generateId(),
      model: options.model || "nomic-embed-text",
      embeddings,
      usage: {
        promptTokens,
        totalTokens: promptTokens,
      },
    };
  }

  private buildSummarizationPrompt(
    options: SummarizationOptions,
    text: string
  ): string {
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

    prompt += `\n\nText to summarize:\n${text}\n\nSummary:`;

    return prompt;
  }

  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
