
import { CreateMLCEngine, MLCEngineInterface, InitProgressCallback } from "@mlc-ai/web-llm";
import { LlmConfig, ApiProvider, ChatMessage } from "../types";

// Expanded set of verified models compatible with WebLLM
export const DEFAULT_WEB_MODELS = [
  { id: "gemma-2-2b-it-q4f32_1-MLC", name: "Google Gemma 2 2B (Fast)", vram: "2GB", family: "gemma", description: "Best for older laptops. Fast & Efficient." },
  { id: "Llama-3.1-8B-Instruct-q4f32_1-MLC", name: "Meta Llama 3.1 8B", vram: "6GB", family: "llama", description: "Standard for general reasoning and chat." },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Microsoft Phi 3.5 Mini", vram: "4GB", family: "phi", description: "Excellent logic in a small package." },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 7B", vram: "6GB", family: "qwen", description: "Great for coding and math." },
  { id: "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC", name: "Hermes 2 Pro (Llama 3)", vram: "6GB", family: "llama", description: "Uncensored, agentic capabilities." },
  { id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC", name: "Mistral 7B v0.3", vram: "6GB", family: "mistral", description: "Reliable all-rounder." },
  { id: "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC", name: "TinyLlama 1.1B", vram: "1.5GB", family: "llama", description: "Ultra-lightweight for mobile." }
];

export class OfflineLlmService {
  private static instance: OfflineLlmService;
  private engine: MLCEngineInterface | null = null;
  private availableModels = [...DEFAULT_WEB_MODELS];
  
  private config: LlmConfig = {
    mode: 'BROWSER_WEBGPU',
    serverUrl: 'http://localhost:1234/v1', 
    modelId: 'gemma-2-2b-it-q4f32_1-MLC'
  };

  private isInitializing = false;
  private isReady = false;

  private constructor() {}

  public static getInstance(): OfflineLlmService {
    if (!OfflineLlmService.instance) {
      OfflineLlmService.instance = new OfflineLlmService();
    }
    return OfflineLlmService.instance;
  }

  public getAvailableModels() {
      return this.availableModels;
  }

  public addCustomModel(id: string, name: string, vram: string) {
      if (!this.availableModels.find(m => m.id === id)) {
          this.availableModels.push({ id, name, vram, family: 'custom', description: 'User added model' });
      }
  }

  public updateConfig(newConfig: Partial<LlmConfig>) {
    const modelChanged = newConfig.modelId && newConfig.modelId !== this.config.modelId;
    const modeChanged = newConfig.mode && newConfig.mode !== this.config.mode;

    this.config = { ...this.config, ...newConfig };
    
    // Only reset engine if switching TO or FROM WebGPU, or if the model ID changed while in WebGPU mode
    if (this.config.mode === 'BROWSER_WEBGPU' && (modeChanged || modelChanged)) {
        this.isReady = false;
        // If the engine exists, we might need to reload it with the new model
        if (this.engine && modelChanged) {
             // We don't nullify engine here, we let initialize() handle the switch
             this.isReady = false; 
        }
    } else if (this.config.mode !== 'BROWSER_WEBGPU') {
        // For Cloud/Local, we are "ready" if we have URL/Key configuration
        this.isReady = true; 
    }
  }

  public getConfig(): LlmConfig {
    return this.config;
  }

  public async validateConnection(url: string): Promise<{success: boolean, message: string}> {
      try {
        const cleanUrl = url.replace(/\/$/, '');
        // For standard OpenAI compatible endpoints
        const response = await fetch(`${cleanUrl}/models`, { 
            method: 'GET',
            headers: this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}
        });
        if (response.ok) return { success: true, message: "Server reachable" };
        return { success: false, message: `Server returned ${response.status}` };
      } catch (e) {
        return { success: false, message: "Connection refused. Is CORS enabled?" };
      }
  }

  public async initialize(onProgress: (text: string) => void): Promise<void> {
    if (this.config.mode === 'LOCAL_SERVER') {
      const check = await this.validateConnection(this.config.serverUrl);
      if (check.success) {
           this.isReady = true;
           onProgress("Connected to Local API Server.");
           return;
      }
      throw new Error(check.message);
    }

    if (this.config.mode === 'CLOUD') {
        if (!this.config.apiKey) throw new Error("API Key required for Cloud Mode");
        this.isReady = true;
        onProgress(`Connected to ${this.config.provider}`);
        return;
    }

    // WebGPU Logic
    // If we are already ready with the CORRECT model, skip
    if (this.isReady && this.engine) {
        onProgress("Model already loaded.");
        return;
    }
    
    this.isInitializing = true;
    
    try {
      // If we have an engine but need to switch models, CreateMLCEngine handles caching internally,
      // but strictly speaking, reloading might be cleaner.
      // WebLLM's CreateMLCEngine will reuse the backend if possible or re-init.
      
      const initProgressCallback: InitProgressCallback = (report) => {
        onProgress(report.text);
      };

      // Ensure we pass the specific model ID from config
      this.engine = await CreateMLCEngine(
        this.config.modelId,
        { 
            initProgressCallback: initProgressCallback,
            logLevel: "INFO",
            // appConfig allows defining custom cache usage if needed, default is usually fine
        }
      );

      this.isReady = true;
      this.isInitializing = false;
      onProgress(`Ready`);
    } catch (error) {
      console.error("Failed to initialize Offline LLM:", error);
      this.isInitializing = false;
      onProgress(`Failed: ${(error as any).message}`);
      throw error;
    }
  }

  // --- Unified Chat Interface ---

  public async chat(message: string, systemPrompt?: string, history: ChatMessage[] = []): Promise<string> {
    const fullSystemPrompt = systemPrompt || "You are Charlie, a helpful AI assistant.";
    
    // Construct messages array with history
    const messages = [
        { role: "system", content: fullSystemPrompt },
        ...history.slice(-10).map(msg => ({ 
            role: msg.role === 'user' ? 'user' : 'assistant', 
            content: msg.text 
        })),
        { role: "user", content: message }
    ];

    if (this.config.mode === 'BROWSER_WEBGPU') {
        if (!this.engine || !this.isReady) throw new Error("Engine not ready. Load a model first.");
        const reply = await this.engine.chat.completions.create({
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 1024, 
        });
        return reply.choices[0].message.content || "";
    }

    // Handle Cloud & Local Server via HTTP
    // Note: chatViaHttp needs update to handle full message array, but for now we keep it simple or reconstruct prompt
    // Ideally we pass messages array directly if API supports it.
    
    // For simplicity in this edit, we'll join history into the system prompt for HTTP calls if passing array isn't supported by the simple helper
    // But standard OpenAI API supports messages array.
    return this.chatViaHttp(messages);
  }

  private async chatViaHttp(messages: any[]): Promise<string> {
      const { provider, serverUrl, apiKey, modelId } = this.config;
      let url = serverUrl;
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let body: any = {};

      // Configure Endpoints & Payloads based on Provider
      if (this.config.mode === 'LOCAL_SERVER' || provider === 'CUSTOM' || provider === 'OPENROUTER' || provider === 'MISTRAL') {
          // Standard OpenAI Format (Works for Local, OpenRouter, Mistral, Blackbox/Antigravity if compatible)
          url = serverUrl.endsWith('/v1') ? `${serverUrl}/chat/completions` : `${serverUrl}/v1/chat/completions`;
          if (provider === 'OPENROUTER') url = "https://openrouter.ai/api/v1/chat/completions";
          if (provider === 'MISTRAL') url = "https://api.mistral.ai/v1/chat/completions";
          
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
          
          body = {
              model: modelId,
              messages: messages,
              temperature: 0.7
          };

          // OpenRouter specific headers
          if (provider === 'OPENROUTER') {
            headers['HTTP-Referer'] = 'https://charlie-os.ai';
            headers['X-Title'] = 'Charlie OS';
          }
      } 
      else if (provider === 'OPENAI') {
          url = "https://api.openai.com/v1/chat/completions";
          headers['Authorization'] = `Bearer ${apiKey}`;
          body = {
              model: modelId,
              messages: messages
          };
      }
      else if (provider === 'ANTHROPIC') {
          // Anthropic requires specific formatting (System separate)
          const systemMsg = messages.find(m => m.role === 'system')?.content || "";
          const userMsgs = messages.filter(m => m.role !== 'system');

          url = "https://api.anthropic.com/v1/messages";
          headers['x-api-key'] = apiKey || "";
          headers['anthropic-version'] = '2023-06-01';
          headers['dangerously-allow-browser'] = 'true'; 
          body = {
              model: modelId,
              system: systemMsg,
              messages: userMsgs,
              max_tokens: 1024
          };
      }
      else if (provider === 'GEMINI') {
          // Gemini REST API needs 'contents' with 'parts'
          const systemMsg = messages.find(m => m.role === 'system')?.content || "";
          const lastUserMsg = messages[messages.length - 1].content;
          // Simplified for Gemini: just send context + last msg
          // Ideally construct full multi-turn
          const context = messages.slice(1, -1).map(m => `${m.role}: ${m.content}`).join('\n');

          url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
          body = {
              contents: [{
                  parts: [{ text: `${systemMsg}\n\nHistory:\n${context}\n\nUser: ${lastUserMsg}` }] 
              }]
          };
      }

      try {
          const res = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(body)
          });

          if (!res.ok) {
              const err = await res.text();
              throw new Error(`API Error ${res.status}: ${err}`);
          }

          const data = await res.json();

          // Response Parsing
          if (provider === 'ANTHROPIC') return data.content[0].text;
          if (provider === 'GEMINI') return data.candidates[0].content.parts[0].text;
          return data.choices[0].message.content; // OpenAI Standard

      } catch (e: any) {
          console.error("API Call Failed", e);
          return `Connection Error: ${e.message}`;
      }
  }

  public async chatStream(message: string, onUpdate: (partial: string) => void, systemPrompt?: string): Promise<string> {
      // For simple demo, we will just await the full response for Cloud APIs
      if (this.config.mode !== 'BROWSER_WEBGPU') {
          // We pass empty history here for stream in this basic implementation, 
          // but you could wire it up if needed.
          const text = await this.chat(message, systemPrompt);
          const chunks = text.split(/(?=\s)/); // Split by word boundaries
          let accum = "";
          for(const chunk of chunks) {
              accum += chunk;
              onUpdate(accum);
              await new Promise(r => setTimeout(r, 10)); // Fast type effect
          }
          return text;
      }
  
      // WebGPU Streaming Logic
      if (!this.engine || !this.isReady) throw new Error("Engine not ready");
      const fullSystemPrompt = systemPrompt || "You are Charlie.";
      
      const asyncChunkGenerator = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: fullSystemPrompt },
          { role: "user", content: message }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      });
  
      let fullMessage = "";
      for await (const chunk of asyncChunkGenerator) {
        const delta = chunk.choices[0]?.delta?.content || "";
        fullMessage += delta;
        onUpdate(fullMessage);
      }
      return fullMessage;
  }
}
