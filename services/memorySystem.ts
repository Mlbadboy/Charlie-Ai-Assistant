
import { LearnedMemory, TrainingLog, ChatMessage } from "../types";
import { OfflineLlmService } from "./offlineLlm";

const MEMORY_KEY = 'charlie_core_memories';
const LOGS_KEY = 'charlie_training_logs';

export class MemorySystem {
  private static instance: MemorySystem;
  private memories: LearnedMemory[] = [];
  private logs: TrainingLog[] = [];

  private constructor() {
    this.loadFromStorage();
    // Default memory if empty
    if (this.memories.length === 0) {
        this.learnRule("General Behavior", "Speak concisely and professionally.", 'SELF_REFLECTION');
    }
  }

  public static getInstance(): MemorySystem {
    if (!MemorySystem.instance) {
      MemorySystem.instance = new MemorySystem();
    }
    return MemorySystem.instance;
  }

  private loadFromStorage() {
    try {
      const storedMem = localStorage.getItem(MEMORY_KEY);
      const storedLogs = localStorage.getItem(LOGS_KEY);
      if (storedMem) this.memories = JSON.parse(storedMem);
      if (storedLogs) this.logs = JSON.parse(storedLogs);
    } catch (e) {
      console.error("Failed to load memory core", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(this.memories));
    localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
  }

  public getMemories(): LearnedMemory[] {
    return this.memories;
  }

  public getLogs(): TrainingLog[] {
    return this.logs;
  }

  public getEvolutionLevel(): number {
      // Calculate level based on memories and successful training cycles
      return Math.floor(1 + (this.memories.length * 0.5) + (this.logs.filter(l => l.type === 'NEW_RULE').length * 0.2));
  }

  public addLog(event: string, details: string, type: TrainingLog['type'] = 'OPTIMIZATION') {
    const log: TrainingLog = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      event,
      details,
      type
    };
    this.logs = [log, ...this.logs].slice(0, 100); // Keep last 100 logs
    this.saveToStorage();
  }

  public learnRule(trigger: string, instruction: string, source: 'USER_CORRECTION' | 'SELF_REFLECTION') {
    // Check for duplicates
    const exists = this.memories.find(m => m.trigger.toLowerCase() === trigger.toLowerCase());
    if (exists) {
        exists.instruction = instruction;
        exists.createdAt = Date.now();
        exists.confidence = Math.min(exists.confidence + 0.1, 1.0); // Reinforce
        this.addLog("Reinforcement Learning", `Updated rule for '${trigger}'`, 'OPTIMIZATION');
    } else {
        const memory: LearnedMemory = {
            id: Date.now().toString(),
            trigger,
            instruction,
            confidence: 0.8,
            createdAt: Date.now(),
            source
        };
        this.memories.push(memory);
        this.addLog("Skill Acquired", `New neural pathway: ${trigger} -> ${instruction}`, 'NEW_RULE');
    }
    this.saveToStorage();
  }

  public deleteMemory(id: string) {
    this.memories = this.memories.filter(m => m.id !== id);
    this.saveToStorage();
    this.addLog("Memory Pruned", "Removed obsolete neural pathway.", 'OPTIMIZATION');
  }

  // Generates a context string to inject into the LLM System Prompt
  public getSystemPromptInjection(): string {
    if (this.memories.length === 0) return "";
    
    return `
    [SELF-DEVELOPMENT MEMORY BANK - LEVEL ${this.getEvolutionLevel()}]
    You have learned from previous interactions. You MUST strictly adhere to these rules:
    ${this.memories.map((m, i) => `${i + 1}. WHEN "${m.trigger}" THEN: ${m.instruction}`).join('\n')}
    [END MEMORY BANK]
    `;
  }

  // The Core Self-Development Loop
  public async runSelfOptimization(llm: OfflineLlmService, history: ChatMessage[]) {
    this.addLog("Training Cycle Started", "Scanning recent interactions for anomalies...", "OPTIMIZATION");
    await new Promise(r => setTimeout(r, 1000));
    
    // 1. Filter history for potential user corrections or negative sentiment
    // Look for recent user messages that might indicate a correction
    const recentUserMessages = history.slice(-10).filter(m => m.role === 'user');
    const correctionKeywords = ['wrong', 'not', 'stop', 'bad', 'mistake', 'error', 'change', 'incorrect', 'no', 'fail'];
    
    const potentialCorrections = recentUserMessages.filter(m => 
        correctionKeywords.some(keyword => m.text.toLowerCase().includes(keyword))
    );

    if (potentialCorrections.length === 0) {
        this.addLog("Analysis Complete", "No significant errors detected in recent short-term memory.", "OPTIMIZATION");
        // Reinforce existing memories slightly
        this.memories.forEach(m => { if(m.confidence < 1.0) m.confidence += 0.01; });
        this.saveToStorage();
        return;
    }

    this.addLog("Pattern Recognition", `Identified ${potentialCorrections.length} potential correction events. Analyzing...`, "OPTIMIZATION");

    // 2. Generate a new rule based on the correction
    // We try to use the Offline LLM to derive the rule.
    let newRuleTrigger = "";
    let newRuleInstruction = "";

    try {
        // If we have a capable model loaded
        if (llm.getConfig().mode === 'BROWSER_WEBGPU' && (llm as any).isReady) {
            const context = potentialCorrections.map(m => `User: "${m.text}"`).join('\n');
            const prompt = `
                Analyze these user complaints/corrections:
                ${context}
                
                Derive a single, general behavior rule to prevent this in the future.
                Format output exactly as: TRIGGER: [The situation] | INSTRUCTION: [The correct action]
            `;
            
            const result = await llm.chat(prompt, "You are an AI Optimization Subsystem.");
            
            if (result.includes("TRIGGER:") && result.includes("INSTRUCTION:")) {
                const parts = result.split("|");
                newRuleTrigger = parts[0].replace("TRIGGER:", "").trim();
                newRuleInstruction = parts[1].replace("INSTRUCTION:", "").trim();
            }
        }
    } catch (e) {
        console.warn("LLM Optimization failed, using heuristics", e);
    }

    // Fallback Heuristics if LLM didn't return valid format or wasn't available
    if (!newRuleTrigger || !newRuleInstruction) {
        const lastCorrection = potentialCorrections[potentialCorrections.length - 1];
        newRuleTrigger = "User Feedback Detected";
        newRuleInstruction = `Pay close attention to user preference: "${lastCorrection.text.substring(0, 50)}..."`;
    }

    // 3. Commit the new rule
    this.learnRule(newRuleTrigger, newRuleInstruction, 'SELF_REFLECTION');
    this.addLog("Self-Improvement", "Optimization cycle complete. Neural weights updated.", "OPTIMIZATION");
  }
}
