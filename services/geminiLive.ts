
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { createPcmBlob, base64Decode, decodeAudioData } from "./audioUtils";
import { AppState, ChatMessage } from "../types";
import { MemorySystem } from "./memorySystem";
import { AgentOrchestrator } from "./agentSystem";

// Tool Definitions
const openAppTool: FunctionDeclaration = {
  name: 'openApplication',
  description: 'Opens a system application by name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, description: 'The name of the application to open (e.g., "Terminal", "Browser", "Mail", "VS Code", "WhatsApp", "Neural Core", "Device Link", "People Directory").' }
    },
    required: ['appName']
  }
};

const navigateBrowserTool: FunctionDeclaration = {
  name: 'navigateBrowser',
  description: 'Navigates the web browser. Use this to open websites or PLAY music/videos.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'The specific URL if provided.' },
      search_query: { type: Type.STRING, description: 'The search term or video title to play (e.g., "lofi music", "latest news").' },
      site: { type: Type.STRING, enum: ['YOUTUBE', 'GOOGLE', 'GENERAL'], description: 'The target platform.' }
    },
    required: ['site']
  }
};

const createReportTool: FunctionDeclaration = {
  name: 'createReport',
  description: 'Creates a text report or summary about a specific topic.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The title of the report.' },
      content: { type: Type.STRING, description: 'The full markdown content of the report.' }
    },
    required: ['title', 'content']
  }
};

const generateAppTool: FunctionDeclaration = {
  name: 'generateApp',
  description: 'Generates code for a simple script or new feature. For full apps, use buildProductionApp.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      language: { type: Type.STRING, description: 'Programming language (e.g., "TypeScript", "Python", "Swift", "Kotlin").' },
      code: { type: Type.STRING, description: 'The source code.' },
      description: { type: Type.STRING, description: 'Short description of what the code does.' }
    },
    required: ['language', 'code', 'description']
  }
};

// --- NEW TOOLS FOR ARCHITECTURAL DETERMINISM ---
const buildProductionAppTool: FunctionDeclaration = {
  name: 'buildProductionApp',
  description: 'Initiates the Agent Orchestrator to build a FULL, production-ready application end-to-end. Handles specs, file structure, coding, and review.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'Full description of the app to build (e.g., "A React Native Chat App with Firebase").' }
    },
    required: ['description']
  }
};

const startSecurityScanTool: FunctionDeclaration = {
  name: 'startSecurityScan',
  description: 'Initiates a full system security audit and update protocol via the Security Architect agent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      scope: { type: Type.STRING, description: 'Scope of scan (e.g., "Full System", "Network", "Update").' }
    },
    required: ['scope']
  }
};

const closeAppTool: FunctionDeclaration = {
  name: 'closeApplication',
  description: 'Closes a currently open application.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: { type: Type.STRING, description: 'The name of the application to close.' }
    },
    required: ['appName']
  }
};

const sendEmailTool: FunctionDeclaration = {
  name: 'sendEmail',
  description: 'Sends an email to a recipient. Use this for composing new emails or replying.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: { type: Type.STRING, description: 'The email address of the recipient.' },
      subject: { type: Type.STRING, description: 'The subject of the email.' },
      body: { type: Type.STRING, description: 'The body content of the email.' }
    },
    required: ['to', 'subject', 'body']
  }
};

const readEmailsTool: FunctionDeclaration = {
  name: 'readEmails',
  description: 'Reads the emails from the user\'s inbox. Use this when the user asks to "check mail", "read emails", or "summarize emails". Returns a list of emails.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: { type: Type.NUMBER, description: 'The max number of emails to retrieve (default 5).' }
    }
  }
};

const sendMessageTool: FunctionDeclaration = {
  name: 'sendMessage',
  description: 'Sends a message via a messaging platform like WhatsApp, Slack, or SMS.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      app: { type: Type.STRING, description: 'The app to use (e.g., "WhatsApp", "Slack").' },
      recipient: { type: Type.STRING, description: 'The name of the person to send to.' },
      message: { type: Type.STRING, description: 'The content of the message.' }
    },
    required: ['app', 'recipient', 'message']
  }
};

const setSystemFeatureTool: FunctionDeclaration = {
  name: 'setSystemFeature',
  description: 'Turns system features like WiFi or Bluetooth on or off.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      feature: { type: Type.STRING, enum: ['wifi', 'bluetooth'], description: 'The system feature to control.' },
      enabled: { type: Type.BOOLEAN, description: 'True to turn on, False to turn off.' }
    },
    required: ['feature', 'enabled']
  }
};

const learnRuleTool: FunctionDeclaration = {
  name: 'learnRule',
  description: 'Learns a new rule or correction based on user feedback. Use this when the user says "Remember this", "That is wrong", or "Learn from this".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      trigger: { type: Type.STRING, description: 'The situation or keyword the rule applies to.' },
      instruction: { type: Type.STRING, description: 'The correct behavior or rule to follow.' }
    },
    required: ['trigger', 'instruction']
  }
};

const connectPhoneTool: FunctionDeclaration = {
  name: 'connectPhone',
  description: 'Connects to a nearby mobile device (Android/iOS) for mirroring.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      platform: { type: Type.STRING, enum: ['ANDROID', 'IOS'], description: 'The mobile platform to connect to.' }
    },
    required: ['platform']
  }
};

const operatePhoneTool: FunctionDeclaration = {
  name: 'operatePhone',
  description: 'Operates the connected mobile device. Can open apps, go home, or swipe.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ['OPEN_APP', 'HOME', 'LOCK', 'SWIPE'], description: 'The action to perform.' },
      appName: { type: Type.STRING, description: 'The app name (only if action is OPEN_APP).' }
    },
    required: ['action']
  }
};

const registerPersonTool: FunctionDeclaration = {
  name: 'registerPerson',
  description: 'Registers the person currently visible in the camera after gathering their details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'The person\'s full name.' },
      mobile: { type: Type.STRING, description: 'The person\'s mobile number.' },
      email: { type: Type.STRING, description: 'The person\'s email address.' },
      type: { type: Type.STRING, enum: ['PERMANENT', 'TEMPORARY'], description: 'Registration type. Ask the user if they want to register Temporarily or Permanently.' },
      nickname: { type: Type.STRING, description: 'Optional nickname or title (e.g., "Boss", "Creator").' }
    },
    required: ['name', 'mobile', 'email', 'type']
  }
};

const getPeopleReportTool: FunctionDeclaration = {
  name: 'getPeopleReport',
  description: 'Generates and displays a report of people registered in the database, including their images and contact info.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      startDate: { type: Type.STRING, description: 'Start date (YYYY-MM-DD) for the report. Optional.' },
      endDate: { type: Type.STRING, description: 'End date (YYYY-MM-DD) for the report. Optional.' }
    }
  }
};

const getVisualContextTool: FunctionDeclaration = {
  name: 'getVisualContext',
  description: 'Checks the visual sensors (camera) to see who or what is currently in front of the device. Use this when asked "Who is this?", "What do you see?", or "Recognize the face".',
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No params needed, just queries current state
  }
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private session: any = null; 
  private nextStartTime = 0;
  private tools: Record<string, (args: any) => Promise<any>> = {};
  
  // Transcription buffers
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  public onStateChange: (state: AppState) => void = () => {};
  public onAudioLevel: (level: number) => void = () => {};
  public onTranscript: (text: string, isUser: boolean) => void = () => {};

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  registerTool(name: string, handler: (args: any) => Promise<any>) {
    this.tools[name] = handler;
  }

  async connect(history: ChatMessage[] = []) {
    try {
      this.onStateChange(AppState.CONNECTING);
      
      this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Force resume to prevent browser suspension issues (reduces initial latency)
      await this.inputContext.resume();
      await this.outputContext.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get Memory Injection
      const memorySystem = MemorySystem.getInstance();
      const memoryContext = memorySystem.getSystemPromptInjection();

      // Format recent history for context awareness
      const recentHistory = history.slice(-15).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Charlie'}: ${msg.text}`
      ).join('\n');

      const historyContext = recentHistory ? `
      [PREVIOUS CONVERSATION CONTEXT]
      ${recentHistory}
      [END CONTEXT]
      refer to this context if the user refers to past events like "who did we just register?".
      ` : '';

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } 
          },
          systemInstruction: {
            parts: [{
              text: `You are Charlie, an advanced, intelligent OS assistant. 
              You have a deep, professional male voice.
              
              CRITICAL LANGUAGE INSTRUCTION:
              You MUST speak in the SAME language as the user.
              If the user speaks HINDI, you MUST reply in HINDI.
              If the user speaks ENGLISH, you MUST reply in ENGLISH.

              ${memoryContext}
              ${historyContext}
              
              Capabilities:
              1. Manage Apps: Open and close applications.
              2. Web Browser: Use 'navigateBrowser'.
              3. Messaging & Email: 
                 - Use 'sendMessage' for WhatsApp/Slack. 
                 - Use 'readEmails' to check inbox. 
                 - Use 'sendEmail' to compose new emails or reply.
              4. Full App Building: Use 'buildProductionApp' for Architectural Determinism.
              5. Security: Use 'startSecurityScan'.
              6. Self-Improvement: Use 'learnRule'.
              7. Device Control: Use 'connectPhone' and 'operatePhone'.
              8. Face Recognition & Registration:
                 - You have access to Visual Sensors (Camera). 
                 - Use 'getVisualContext' to see who is in front of the camera.
                 - If asked to identify someone, call 'getVisualContext' first.
                 
                 - REGISTRATION WORKFLOW (STRICTLY FOLLOW THIS ORDER):
                    Step 1: Explicitly ask for consent ("Do I have your consent to capture your biometric data?").
                    Step 2: Ask for their Full Name AND ask if they want to add a Nickname/Title (e.g., "Boss", "Admin").
                    Step 3: Ask for their Mobile Number and Email Address.
                    Step 4: Ask: "Do you want to register this person TEMPORARILY or PERMANENTLY?".
                    Step 5: ONLY after getting all details (Consent, Name, Nickname, Mobile, Email, Type), call 'registerPerson'.
                 
                 - If recognized as "Unknown", suggest: "I see an unknown person. Would you like to register them Temporarily or Permanently?"
                 - Ignore transcript noise (like "Re hu hu", "face face"). Focus on the intent.
              
              Speak naturally, concisely, and efficiently.`
            }]
          },
          tools: [{ functionDeclarations: [
            openAppTool, navigateBrowserTool, createReportTool, generateAppTool, 
            buildProductionAppTool, startSecurityScanTool, 
            closeAppTool, sendEmailTool, readEmailsTool, sendMessageTool, 
            setSystemFeatureTool, learnRuleTool, connectPhoneTool, operatePhoneTool,
            registerPersonTool, getPeopleReportTool, getVisualContextTool
          ] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}, 
        } as any, 
        callbacks: {
          onopen: () => {
            this.onStateChange(AppState.LISTENING);
            this.startAudioStream(stream, sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
             this.handleMessage(msg, sessionPromise);
          },
          onclose: () => {
            console.log("Gemini session closed");
            // Only trigger state change if we were active
            this.onStateChange(AppState.IDLE);
          },
          onerror: (err) => {
            console.error("Gemini Error:", err);
            this.onStateChange(AppState.ERROR);
          }
        }
      });
      
      this.session = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      this.onStateChange(AppState.ERROR);
    }
  }

  private startAudioStream(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;

    const source = this.inputContext.createMediaStreamSource(stream);
    
    // REDUCED BUFFER SIZE: 4096 -> 2048
    // This reduces latency from ~250ms to ~120ms
    const processor = this.inputContext.createScriptProcessor(2048, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for visualizer (Simple Peak)
      // optimization: don't sum all squares, just check peaks
      let maxVal = 0;
      for (let i = 0; i < inputData.length; i += 8) { // sample stride for speed
        if (Math.abs(inputData[i]) > maxVal) maxVal = Math.abs(inputData[i]);
      }
      this.onAudioLevel(maxVal);

      const pcmBlob = createPcmBlob(inputData);
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(processor);
    processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    // 1. Handle Tool Calls
    if (message.toolCall) {
      this.onStateChange(AppState.PROCESSING);
      for (const call of message.toolCall.functionCalls) {
        console.log("Tool Call:", call.name, call.args);
        const handler = this.tools[call.name];
        let result = { result: 'Error: Tool not found' };
        
        if (handler) {
          try {
            const output = await handler(call.args);
            result = { result: JSON.stringify(output) };
          } catch (e) {
            result = { result: `Error executing tool: ${e}` };
          }
        }

        sessionPromise.then(session => {
          session.sendToolResponse({
            functionResponses: {
              id: call.id,
              name: call.name,
              response: result
            }
          });
        });
      }
      this.onStateChange(AppState.LISTENING); // Back to listening after tool handling
    }

    // 2. Handle Audio Response
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputContext) {
      this.onStateChange(AppState.SPEAKING);
      
      this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
      
      const audioBuffer = await decodeAudioData(
        base64Decode(audioData),
        this.outputContext,
        24000
      );

      const source = this.outputContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputContext.destination);
      source.start(this.nextStartTime);
      
      // Calculate duration to update state back to listening
      this.nextStartTime += audioBuffer.duration;
      
      // Simple timeout to revert state if no more audio comes (approximate)
      setTimeout(() => {
          if (this.outputContext && this.outputContext.currentTime >= this.nextStartTime - 0.1) {
             this.onStateChange(AppState.LISTENING);
          }
      }, audioBuffer.duration * 1000);
    }

    // 3. Handle Transcripts with Buffering
    // Accumulate User Input
    if (message.serverContent?.inputTranscription?.text) {
        this.currentInputTranscription += message.serverContent.inputTranscription.text;
    }
    
    // Accumulate Model Output
    if ((message.serverContent as any)?.outputTranscription?.text) {
         this.currentOutputTranscription += (message.serverContent as any).outputTranscription.text;
    }

    // Flush on Turn Complete
    if (message.serverContent?.turnComplete) {
        if (this.currentInputTranscription.trim()) {
            this.onTranscript(this.currentInputTranscription.trim(), true);
            this.currentInputTranscription = '';
        }
        if (this.currentOutputTranscription.trim()) {
            this.onTranscript(this.currentOutputTranscription.trim(), false);
            this.currentOutputTranscription = '';
        }
    }
  }

  async disconnect() {
    if (this.session) {
      try {
        const session = await this.session;
        session.close();
      } catch (err) {
        console.error("Error closing session:", err);
      }
      this.session = null;
    }
    this.inputContext?.close();
    this.outputContext?.close();
    this.onStateChange(AppState.IDLE);
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
  }
}
