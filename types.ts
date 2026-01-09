
export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR'
}

export interface SystemApp {
  id: string;
  name: string;
  isOpen: boolean;
  type: 'utility' | 'browser' | 'editor' | 'terminal' | 'mail' | 'agents' | 'neural' | 'device_link' | 'people';
}

export interface GeneratedReport {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface GeneratedCode {
  id: string;
  language: string;
  code: string;
  description: string;
}

export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
}

export interface SystemStatus {
  wifi: boolean;
  bluetooth: boolean;
  security: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
}

// Agent System Types
export type AgentRole = 'MANAGER' | 'CODER' | 'REVIEWER' | 'SYSTEM_OP' | 'RESEARCHER' | 'NEURAL_CORE' | 'MOBILE_DEV' | 'SECURITY_ARCHITECT' | 'PRODUCT_OWNER';

export interface AgentTask {
  id: string;
  description: string;
  assignedTo: AgentRole;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REVIEWING';
  result?: string;
  feedback?: string; // Critique from Reviewer
  retryCount: number;
  dependencies?: string[]; // IDs of tasks that must complete first
  criticality: 'HIGH' | 'MEDIUM' | 'LOW'; // High criticality requires Architectural Determinism (strict audit)
}

export interface AgentLog {
  timestamp: number;
  agent: AgentRole;
  message: string;
}

export interface ProjectFile {
    path: string;
    content: string;
    status: 'DRAFT' | 'APPROVED';
}

// Memory & Learning Types
export interface LearnedMemory {
  id: string;
  trigger: string;       // The concept or keyword (e.g., "YouTube Playback")
  instruction: string;   // The learned rule (e.g., "Always use embed URL")
  confidence: number;    // 0.0 to 1.0
  createdAt: number;
  source: 'USER_CORRECTION' | 'SELF_REFLECTION';
}

export interface TrainingLog {
  id: string;
  timestamp: number;
  event: string;
  details: string;
  type: 'OPTIMIZATION' | 'ERROR' | 'NEW_RULE';
}

export interface PersonProfile {
  id: string;
  name: string;
  nickname?: string;
  type: 'PERMANENT' | 'TEMPORARY';
  mobile: string;
  email: string;
  descriptor: number[]; // Float32Array serialized
  image: string; // Base64 snapshot
  registeredAt: number;
}

export type ApiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'MISTRAL' | 'OPENROUTER' | 'CUSTOM';

export interface LlmConfig {
  mode: 'BROWSER_WEBGPU' | 'LOCAL_SERVER' | 'CLOUD';
  provider?: ApiProvider; // For CLOUD mode
  apiKey?: string;        // For CLOUD mode
  serverUrl: string;      // For LOCAL_SERVER or CUSTOM mode
  modelId: string;        // Model ID/Name for all modes
}

export type ToolHandler = (args: any) => Promise<any>;

// Audio Types
export interface AudioContexts {
  input: AudioContext;
  output: AudioContext;
}

export interface PhoneState {
    connected: boolean;
    platform: 'ANDROID' | 'IOS' | 'NONE';
    screen: 'LOCK' | 'HOME' | 'APP_OPEN' | 'CALLING';
    batteryLevel: number;
    currentApp?: string;
    notifications: string[];
}
