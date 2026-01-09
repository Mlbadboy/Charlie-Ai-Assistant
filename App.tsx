
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, Terminal, FileCode, FileText, Upload, Send, Cpu, Power, Globe, Wifi, Bluetooth, Shield, Mail, ArrowRight, Languages, ScanFace, Fingerprint, Lock, CheckCircle, Bell, AlertTriangle, Video, Cloud, Database, Download, Settings, Users, Server, Play, StopCircle, Check, X, Search, HardDrive, Zap, Key, MessageSquare, BrainCircuit, RefreshCw, Trash2, TrendingUp, Sliders, Smartphone, BookUser } from 'lucide-react';
import { GeminiLiveService } from './services/geminiLive';
import { OfflineLlmService } from './services/offlineLlm';
import { AgentOrchestrator } from './services/agentSystem';
import { MemorySystem } from './services/memorySystem';
import { FaceRecognitionService } from './services/faceRecognition';
import Visualizer from './components/Visualizer';
import SystemWindow from './components/SystemWindow';
import BiometricScanner from './components/BiometricScanner';
import ActivityTracker from './components/ActivityTracker';
import DeviceMirror from './components/DeviceMirror';
import PeopleDirectory from './components/PeopleDirectory';
import { AppState, SystemApp, GeneratedReport, GeneratedCode, ChatMessage, Email, SystemStatus, AgentTask, AgentLog, LlmConfig, ApiProvider, LearnedMemory, TrainingLog, PhoneState, PersonProfile } from './types';

// Mock Data for "System"
const INITIAL_APPS: SystemApp[] = [
  { id: 'camera', name: 'Visual Sensors', isOpen: true, type: 'utility' },
  { id: 'people', name: 'People Directory', isOpen: false, type: 'people' },
  { id: 'agents', name: 'Agent Command', isOpen: false, type: 'agents' },
  { id: 'neural', name: 'Neural Core', isOpen: false, type: 'neural' },
  { id: 'status', name: 'System Status', isOpen: false, type: 'utility' },
  { id: 'term', name: 'Terminal', isOpen: false, type: 'terminal' },
  { id: 'code', name: 'VS Code', isOpen: false, type: 'editor' },
  { id: 'browser', name: 'Chrome', isOpen: false, type: 'browser' },
  { id: 'mail', name: 'Mail', isOpen: false, type: 'mail' },
  { id: 'phone', name: 'Device Link', isOpen: false, type: 'device_link' }
];

// Mock Emails
const MOCK_EMAILS: Email[] = [
    { id: '1', to: 'me', subject: 'Project Alpha Update', body: 'The project is moving along nicely. We hit the alpha milestone yesterday. The team is celebrating.', timestamp: Date.now() - 100000 },
    { id: '2', to: 'me', subject: 'Meeting Notes', body: 'Summary of today\'s sync: 1. Deploy to prod on Friday. 2. Fix the login bug. 3. Buy more coffee.', timestamp: Date.now() - 200000 },
    { id: '3', to: 'me', subject: 'Lunch?', body: 'Hey, want to grab some sushi for lunch today?', timestamp: Date.now() - 300000 },
    { id: '4', to: 'me', subject: 'System Alert', body: 'Server usage is at 95%. Please investigate potential memory leak in the agents module.', timestamp: Date.now() - 400000 }
];

// Mock Contacts for WhatsApp/Messaging simulation
const CONTACTS: Record<string, string> = {
    'mom': '15550109999', // Example Number
    'boss': '15550108888',
    'alice': '15550107777',
    'bob': '15550106666',
    'xyz': '15550199999' // For the specific request
};

type BootState = 'OFF' | 'BOOTING' | 'BIOMETRIC_SCAN' | 'MEMORY_SYNC' | 'READY';
type NotificationType = 'success' | 'alert' | 'info';
type ModelMode = 'CLOUD' | 'LOCAL';

interface SystemNotification {
    message: string;
    type: NotificationType;
    id: number;
}

const App: React.FC = () => {
  const [bootState, setBootState] = useState<BootState>('OFF');
  const [bootProgress, setBootProgress] = useState(0);
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcripts, setTranscripts] = useState<ChatMessage[]>([]);
  const [apps, setApps] = useState<SystemApp[]>(INITIAL_APPS);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [peopleList, setPeopleList] = useState<PersonProfile[]>([]);
  const [notification, setNotification] = useState<SystemNotification | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>("https://google.com");
  
  // Phone State
  const [phoneState, setPhoneState] = useState<PhoneState>({
      connected: false,
      platform: 'NONE',
      screen: 'LOCK',
      batteryLevel: 85,
      notifications: ['Missed call from Mom', 'Instagram: New Like']
  });
  
  // Model Mode State
  const [modelMode, setModelMode] = useState<ModelMode>('CLOUD');
  const [offlineLoadingText, setOfflineLoadingText] = useState<string>("");
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'AI' | 'VOICE'>('AI');
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(OfflineLlmService.getInstance().getConfig());
  const [connectionTestStatus, setConnectionTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  // Wake Word Config
  const [wakeThreshold, setWakeThreshold] = useState(0.6);
  const wakeThresholdRef = useRef(wakeThreshold);

  // Model Manager State
  const [searchQuery, setSearchQuery] = useState("");
  const [customModelId, setCustomModelId] = useState("");
  const [availableModels, setAvailableModels] = useState(OfflineLlmService.getInstance().getAvailableModels());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({}); 

  // Agent State
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);

  // Neural Core State (Memory)
  const [memories, setMemories] = useState<LearnedMemory[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [evolutionLevel, setEvolutionLevel] = useState(1);

  // System Status State
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    wifi: true,
    bluetooth: true,
    security: true
  });

  // Refs
  const appsRef = useRef(apps);
  const emailsRef = useRef(emails);
  const transcriptsRef = useRef(transcripts);
  const systemStatusRef = useRef(systemStatus);
  const geminiService = useRef<GeminiLiveService | null>(null);
  const recognitionRef = useRef<any>(null); // For Offline SpeechRecognition
  const wakeWordRef = useRef<any>(null); // For Wake Word Detection
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const appStateRef = useRef(appState); // Ref for state in closures

  // Sync refs
  useEffect(() => { appsRef.current = apps; }, [apps]);
  useEffect(() => { emailsRef.current = emails; }, [emails]);
  useEffect(() => { transcriptsRef.current = transcripts; }, [transcripts]);
  useEffect(() => { systemStatusRef.current = systemStatus; }, [systemStatus]);
  useEffect(() => { wakeThresholdRef.current = wakeThreshold; }, [wakeThreshold]);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // Text Input State
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info') => {
      const id = Date.now();
      setNotification({ message, type, id });
      setTimeout(() => {
          setNotification(prev => prev?.id === id ? null : prev);
      }, 3000);
  };

  // Agent System Init & Memory Init
  useEffect(() => {
      const orchestrator = AgentOrchestrator.getInstance();
      orchestrator.onTaskUpdate = setAgentTasks;
      orchestrator.onLogUpdate = setAgentLogs;
      orchestrator.onComplete = (summary) => {
          showNotification("Agent Mission Complete", 'success');
          speakText("Mission accomplished. All tasks executed successfully.");
          setTranscripts(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: summary, timestamp: Date.now() }]);
      };
      
      refreshMemoryState();
  }, []);

  const refreshMemoryState = () => {
    const memorySystem = MemorySystem.getInstance();
    setMemories(memorySystem.getMemories());
    setTrainingLogs(memorySystem.getLogs());
    setEvolutionLevel(memorySystem.getEvolutionLevel());
  };

  const handleSelfTraining = async () => {
    setIsTraining(true);
    const memorySystem = MemorySystem.getInstance();
    const offlineService = OfflineLlmService.getInstance();
    
    // Pass the actual transcript history to the memory system for analysis
    await memorySystem.runSelfOptimization(offlineService, transcriptsRef.current);
    
    refreshMemoryState();
    setIsTraining(false);
    showNotification("Neural Pathways Optimized", 'success');
  };

  // Boot Sequence
  useEffect(() => {
    setBootState('BOOTING');
    const bootInterval = setInterval(() => {
        setBootProgress(prev => {
            if (prev >= 30) {
                clearInterval(bootInterval);
                setBootState('BIOMETRIC_SCAN');
                return 30;
            }
            return prev + 2;
        });
    }, 50);
    return () => clearInterval(bootInterval);
  }, []);

  const handleVerificationComplete = () => {
      setBootProgress(60);
      setBootState('MEMORY_SYNC');
      setTimeout(() => setBootProgress(80), 1000);
      setTimeout(() => {
          setBootProgress(100);
          setBootState('READY');
          setTranscripts([{
            id: 'init',
            role: 'system',
            text: 'Identity Verified. Charlie is online.',
            timestamp: Date.now()
          }]);
          startWakeWordListener(); // Start listening for "Hey Charlie"
      }, 2500);
  };

  // Auto-scroll
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Cloud Service Init
  useEffect(() => {
    if (bootState !== 'READY') return;
    const service = new GeminiLiveService();
    geminiService.current = service;
    
    // Cloud Callbacks
    service.onStateChange = (state) => {
        if (modelMode === 'CLOUD') {
            setAppState(state);
            // If we go idle, restart wake word listener
            if (state === AppState.IDLE) startWakeWordListener();
            else stopWakeWordListener();
        }
    };
    service.onAudioLevel = (level) => {
        if (modelMode === 'CLOUD') setAudioLevel(level);
    };
    service.onTranscript = (text, isUser) => {
      if (modelMode === 'CLOUD') {
          setTranscripts(prev => [...prev, {
            id: Date.now().toString(),
            role: isUser ? 'user' : 'assistant',
            text,
            timestamp: Date.now()
          }]);
      }
    };

    // Tool Registrations
    const handleOpenApp = async ({ appName }: { appName: string }) => {
        const currentApps = appsRef.current;
        const target = currentApps.find(a => a.name.toLowerCase().includes(appName.toLowerCase()));
        if (target) {
            setApps(prev => prev.map(a => a.id === target.id ? { ...a, isOpen: true } : a));
            return { success: true, message: `Opened ${target.name}` };
        }
        return { success: false, message: `Application ${appName} not installed.` };
    };

    const handleNavigateBrowser = async ({ url, search_query, site }: { url?: string, search_query?: string, site: 'YOUTUBE'|'GOOGLE'|'GENERAL' }) => {
        setApps(prev => prev.map(a => a.id === 'browser' ? { ...a, isOpen: true } : a));
        
        let targetUrl = "https://www.google.com/search?igu=1"; // Safe default

        // Logic to construct EMBEDDABLE URLs (bypassing X-Frame-Options)
        if (site === 'YOUTUBE') {
            if (search_query) {
                // Creates a playable playlist of search results
                targetUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(search_query)}&autoplay=1`;
            } else if (url && url.includes('v=')) {
                // Extract video ID from URL
                const vId = url.split('v=')[1]?.split('&')[0];
                targetUrl = `https://www.youtube.com/embed/${vId}?autoplay=1`;
            } else {
                // Fallback to trending music if just "Open YouTube"
                targetUrl = `https://www.youtube.com/embed?listType=search&list=trending%20music&autoplay=1`;
            }
        } else if (site === 'GOOGLE') {
            if (search_query) {
                targetUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(search_query)}`;
            } else {
                targetUrl = `https://www.google.com/search?igu=1`;
            }
        } else if (url) {
             targetUrl = url;
        }
        
        setBrowserUrl(targetUrl);
        return { success: true, message: `Browser navigated to ${site}` };
    };

    const handleSendMessage = async ({ app, recipient, message }: { app: string, recipient: string, message: string }) => {
        const appLower = app.toLowerCase();
        
        if (appLower.includes('whatsapp')) {
             const number = CONTACTS[recipient.toLowerCase()];
             let url = `https://wa.me/${number || ''}?text=${encodeURIComponent(message)}`;
             window.open(url, '_blank');
             return { success: true, message: `Opened WhatsApp for ${recipient}.` };
        } else if (appLower.includes('slack')) {
             window.open(`https://slack.com/app_redirect?channel=${recipient}`, '_blank');
             return { success: true, message: `Opening Slack for ${recipient}` };
        }
        return { success: false, message: `Messaging app ${app} not configured.` };
    };

    const handleLearnRule = async ({ trigger, instruction }: { trigger: string, instruction: string }) => {
        const memorySystem = MemorySystem.getInstance();
        memorySystem.learnRule(trigger, instruction, 'USER_CORRECTION');
        
        setApps(prev => prev.map(a => a.id === 'neural' ? { ...a, isOpen: true } : a));
        refreshMemoryState();

        return { success: true, message: `Pattern acquired: When ${trigger}, I will ${instruction}` };
    };

    const handleReadEmails = async ({ limit }: { limit?: number }) => {
        setApps(prev => prev.map(a => a.id === 'mail' ? { ...a, isOpen: true } : a));
        const count = limit || 5;
        const currentEmails = emailsRef.current;
        const recentEmails = currentEmails.slice(0, count);
        
        if (recentEmails.length === 0) {
            return { success: true, emails: [], message: "Inbox is empty." };
        }
        
        // Return structured data for the LLM to summarize
        return { 
            success: true, 
            message: `Found ${recentEmails.length} emails.`,
            emails: recentEmails.map(e => ({ subject: e.subject, body: e.body, from: "sender@example.com" })) 
        };
    };

    const handleSendEmail = async ({ to, subject, body }: { to: string, subject: string, body: string }) => {
        setApps(prev => prev.map(a => a.id === 'mail' ? { ...a, isOpen: true } : a));
        
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1000));
        
        showNotification(`Email sent to ${to}`, 'success');
        return { success: true, message: `Email sent to ${to}` };
    };

    // --- NEW HANDLERS FOR PHONE ---
    const handleConnectPhone = async ({ platform }: { platform: 'ANDROID'|'IOS' }) => {
        setApps(prev => prev.map(a => a.id === 'phone' ? { ...a, isOpen: true } : a));
        
        // Simulate connection delay
        await new Promise(r => setTimeout(r, 2000));
        
        setPhoneState(prev => ({ ...prev, connected: true, platform: platform, screen: 'HOME' }));
        return { success: true, message: `Connected to ${platform} Device.` };
    };

    const handleOperatePhone = async ({ action, appName }: { action: string, appName?: string }) => {
        setApps(prev => prev.map(a => a.id === 'phone' ? { ...a, isOpen: true } : a));
        
        setPhoneState(prev => {
            let newState = { ...prev };
            if (action === 'HOME') newState.screen = 'HOME';
            if (action === 'LOCK') newState.screen = 'LOCK';
            if (action === 'OPEN_APP' && appName) {
                newState.screen = 'APP_OPEN';
                newState.currentApp = appName;
            }
            return newState;
        });

        return { success: true, message: `Executed ${action} on Device.` };
    };

    const handleBuildProductionApp = async ({ description }: { description: string }) => {
        setApps(prev => prev.map(a => a.id === 'agents' ? { ...a, isOpen: true } : a));
        const orchestrator = AgentOrchestrator.getInstance();
        orchestrator.startMission(`Build a production ready app: ${description}`);
        return { success: true, message: "Production Build Protocol Initiated." };
    };

    const handleStartSecurityScan = async ({ scope }: { scope: string }) => {
        setApps(prev => prev.map(a => a.id === 'agents' ? { ...a, isOpen: true } : a));
        const orchestrator = AgentOrchestrator.getInstance();
        orchestrator.startMission(`Start security update and audit: ${scope}`);
        return { success: true, message: "Security Protocol Initiated." };
    };

    // --- NEW HANDLERS FOR FACE REGISTRATION ---
    const handleRegisterPerson = async ({ name, mobile, email, type, nickname }: { name: string, mobile: string, email: string, type: 'PERMANENT'|'TEMPORARY', nickname?: string }) => {
        const faceService = FaceRecognitionService.getInstance();
        const result = faceService.registerCurrentPerson(name, mobile, email, type, nickname);
        
        if (result.success) {
            showNotification(result.message, 'success');
            // Update list immediately if open
            setPeopleList(faceService.getPeopleReport());
            setApps(prev => prev.map(a => a.id === 'people' ? { ...a, isOpen: true } : a));
        } else {
            showNotification(result.message, 'alert');
        }
        return result;
    };

    const handleGetPeopleReport = async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
        const faceService = FaceRecognitionService.getInstance();
        const report = faceService.getPeopleReport(startDate, endDate);
        
        setPeopleList(report);
        setApps(prev => prev.map(a => a.id === 'people' ? { ...a, isOpen: true } : a));
        
        return { success: true, message: `Generated report for ${report.length} people.` };
    };

    const handleGetVisualContext = async () => {
        const faceService = FaceRecognitionService.getInstance();
        const name = faceService.currentDetectedName;
        const nickname = faceService.currentDetectedNickname;
        const confidence = faceService.currentDetectionConfidence;

        // Ensure camera app is open if not already
        const currentApps = appsRef.current;
        if (!currentApps.find(a => a.id === 'camera' && a.isOpen)) {
             setApps(prev => prev.map(a => a.id === 'camera' ? { ...a, isOpen: true } : a));
             await new Promise(r => setTimeout(r, 500)); // Wait for camera to init
        }

        if (name) {
             const label = nickname ? `${name} (Known as: ${nickname})` : name;
             return { success: true, message: `Visual Sensors detect: ${label} (Confidence: ${(confidence * 100).toFixed(0)}%).` };
        } else {
             return { success: true, message: "Visual Sensors active. No registered face detected in current frame." };
        }
    };

    service.registerTool('openApplication', handleOpenApp);
    service.registerTool('navigateBrowser', handleNavigateBrowser);
    service.registerTool('sendMessage', handleSendMessage);
    service.registerTool('sendEmail', handleSendEmail);
    service.registerTool('learnRule', handleLearnRule);
    service.registerTool('readEmails', handleReadEmails);
    service.registerTool('connectPhone', handleConnectPhone);
    service.registerTool('operatePhone', handleOperatePhone);
    service.registerTool('buildProductionApp', handleBuildProductionApp);
    service.registerTool('startSecurityScan', handleStartSecurityScan);
    service.registerTool('registerPerson', handleRegisterPerson);
    service.registerTool('getPeopleReport', handleGetPeopleReport);
    service.registerTool('getVisualContext', handleGetVisualContext); // Register new tool
    
    return () => { service.disconnect(); };
  }, [bootState]);

  // --- WAKE WORD DETECTION ---
  const startWakeWordListener = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
      
      // Stop any existing instance
      stopWakeWordListener();
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Default for wake word

      recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
             if (event.results[i].isFinal || event.results[i][0].confidence > wakeThresholdRef.current) {
                 const transcript = event.results[i][0].transcript.toLowerCase();
                 // WAKE WORD LOGIC
                 if (transcript.includes("hey charlie") || transcript.includes("charlie boy")) {
                     stopWakeWordListener();
                     triggerActiveSession();
                 }
             }
          }
      };
      
      recognition.onend = () => {
          // Restart if still idle (keep listening)
          // Robust check: Only restart if we are truly meant to be idle waiting for wake word
          if (appStateRef.current === AppState.IDLE) {
              setTimeout(() => {
                  try { recognition.start(); } catch(e) {} 
              }, 200); // Slight debounce to prevent rapid fire crashes
          }
      };

      try { recognition.start(); } catch(e) {}
      wakeWordRef.current = recognition;
  };

  const stopWakeWordListener = () => {
      if (wakeWordRef.current) {
          wakeWordRef.current.onend = null; // Prevent auto-restart
          wakeWordRef.current.stop();
          wakeWordRef.current = null;
      }
  };

  const triggerActiveSession = () => {
      // IMMEDIATE FEEDBACK
      showNotification("Listening...", 'success');
      // Play a subtle 'listening' tone
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);

      if (modelMode === 'CLOUD') {
          // Cloud mode takes a second to connect, so we set state manually to show visualizer activity immediately
          setAppState(AppState.CONNECTING);
          // Pass current history to give context
          geminiService.current?.connect(transcriptsRef.current);
      } else {
          startOfflineListening();
      }
  };

  // Offline Voice Logic
  const startOfflineListening = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          showNotification("Speech Recognition not supported.", 'alert');
          return;
      }
      
      stopWakeWordListener();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // CHANGED: Keep listening
      recognition.interimResults = true; // CHANGED: Allow partial results for faster feedback
      recognition.lang = 'en-US';

      recognition.onstart = () => {
          setAppState(AppState.LISTENING);
          const fakeAudioInterval = setInterval(() => {
              setAudioLevel(Math.random() * 0.5 + 0.1);
          }, 100);
          recognitionRef.current = { stop: () => {
              recognition.stop();
              clearInterval(fakeAudioInterval);
              setAudioLevel(0);
          }};
      };

      recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1];
          const text = lastResult[0].transcript;

          if (lastResult.isFinal) {
              handleOfflineInput(text);
          } else {
             // Show interim results in the UI to reduce perceived latency
             // We don't submit it yet, just show it
             setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === 'interim') {
                    // Update existing interim
                    return [...prev.slice(0, -1), { ...last, text: text + '...' }];
                } else {
                    // Add new interim
                    return [...prev, { id: 'interim', role: 'user', text: text + '...', timestamp: Date.now() }];
                }
             });
          }
      };

      recognition.onerror = (e: any) => {
          console.log("Rec Error", e);
          if (e.error === 'no-speech') {
             // Just ignore no-speech errors and let it restart if needed
             return; 
          }
          // If real error, maybe fall back
          if (appStateRef.current === AppState.LISTENING) {
              // Ignore error, try restart (debounce slightly)
              setTimeout(() => {
                  try { recognition.start(); } catch(e) {}
              }, 500);
          }
      };

      recognition.onend = () => {
          // CRITICAL FIX: Browser aggressively kills recognition. We must restart it if state matches.
          if (appStateRef.current === AppState.LISTENING) {
             console.log("Recognition ended unexpectedly. Restarting...");
             setTimeout(() => {
                 try {
                     recognition.start();
                 } catch(e) {
                     console.error("Failed to restart rec", e);
                     // If we really can't restart, fallback to idle
                     setAppState(AppState.IDLE);
                     startWakeWordListener();
                 }
             }, 100);
          } else {
             // Intentionally stopped
             setAppState(AppState.IDLE);
             setAudioLevel(0);
             startWakeWordListener();
          }
      };

      try {
        recognition.start();
      } catch(e) {
        console.error("Rec start failed", e);
      }
  };

  const speakText = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 0.9; // Slightly deeper for male
      
      const voices = window.speechSynthesis.getVoices();
      const userLang = navigator.language;

      // 1. Exact Match (Lang + "Male")
      let selectedVoice = voices.find(v => v.lang === userLang && (v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('Daniel')));
      
      // 2. English Male fallback
      if (!selectedVoice) {
          selectedVoice = voices.find(v => (v.name.includes('Google US English') || v.name.includes('Microsoft David')));
      }

      // 3. Any Male voice
      if (!selectedVoice) {
          selectedVoice = voices.find(v => v.name.toLowerCase().includes('male'));
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => {
          setAppState(AppState.SPEAKING);
          const speakInterval = setInterval(() => setAudioLevel(Math.random() * 0.8), 100);
          (utterance as any).interval = speakInterval;
      };

      utterance.onend = () => {
          setAppState(AppState.IDLE);
          setAudioLevel(0);
          clearInterval((utterance as any).interval);
          startWakeWordListener(); // Go back to standby
      };

      window.speechSynthesis.speak(utterance);
  };

  const handleOfflineInput = async (text: string) => {
      // Clean up interim results
      setTranscripts(prev => prev.filter(t => t.id !== 'interim'));

      setTranscripts(prev => [...prev, {
          id: Date.now().toString(),
          role: 'user',
          text,
          timestamp: Date.now()
      }]);

      setAppState(AppState.PROCESSING);

      // Check if command triggers Agents
      if (text.toLowerCase().includes("build") || text.toLowerCase().includes("create") || text.toLowerCase().includes("develop")) {
          // Open Agent Window
          setApps(prev => prev.map(a => a.id === 'agents' ? { ...a, isOpen: true } : a));
          
          speakText("Initiating Agent Army. Analyzing requirements.");
          const orchestrator = AgentOrchestrator.getInstance();
          // Fire and forget, orchestrator updates UI
          orchestrator.startMission(text);
          setAppState(AppState.IDLE);
          startWakeWordListener();
          return;
      }
      
      try {
          const offlineService = OfflineLlmService.getInstance();
          let responseText = "";
          
          // Use chatStream for all modes (it simulates stream for HTTP modes)
          await offlineService.chatStream(
            text, 
            (partial) => { /* update UI real-time could go here */ },
            "You are Charlie, a capable and efficient AI assistant."
          );
          
          // Get full text (the stream function returns it at end)
          responseText = await offlineService.chat(text, "You are Charlie.", transcriptsRef.current);
          
          setTranscripts(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              text: responseText,
              timestamp: Date.now()
          }]);
          
          speakText(responseText);

      } catch (err: any) {
          console.error(err);
          showNotification(`Error: ${err.message}`, 'alert');
          setAppState(AppState.IDLE);
          startWakeWordListener();
      }
  };

  const toggleSession = () => {
    stopWakeWordListener();

    if (modelMode === 'CLOUD') {
        if (appState === AppState.IDLE || appState === AppState.ERROR) {
            triggerActiveSession();
        } else {
            geminiService.current?.disconnect();
        }
    } else {
        // Local Mode
        if (appState === AppState.IDLE) {
            if (!isOfflineReady && llmConfig.mode === 'BROWSER_WEBGPU') {
                showNotification("Model loading...", 'alert');
                startWakeWordListener();
                return;
            }
            startOfflineListening();
        } else {
            recognitionRef.current?.stop();
            window.speechSynthesis.cancel();
            setAppState(AppState.IDLE);
            startWakeWordListener();
        }
    }
  };

  const toggleModelMode = async () => {
      if (modelMode === 'CLOUD') {
          // Switch to Local
          setModelMode('LOCAL');
          geminiService.current?.disconnect();
          
          const offlineService = OfflineLlmService.getInstance();
          
          // Check if we need to load anything
          if (llmConfig.mode === 'CLOUD' || llmConfig.mode === 'LOCAL_SERVER') {
               setIsOfflineReady(true);
               showNotification(`Active: ${llmConfig.provider || 'External Server'}`, 'success');
          } else if (!isOfflineReady) {
              try {
                  await offlineService.initialize((progress) => setOfflineLoadingText(progress));
                  setIsOfflineReady(true);
                  showNotification("Local Neural Engine Ready", 'success');
              } catch (e) {
                  showNotification("Failed to load local model", 'alert');
              }
          }
      } else {
          // Switch to Cloud (Live API)
          setModelMode('CLOUD');
          window.speechSynthesis.cancel();
          recognitionRef.current?.stop();
      }
      // Restart listener with new mode awareness
      startWakeWordListener();
  };

  const updateLlmSettings = (e: React.FormEvent) => {
      e.preventDefault();
      const service = OfflineLlmService.getInstance();
      service.updateConfig(llmConfig);
      setShowSettings(false);
      showNotification(`Configuration Saved`, 'info');
      
      // Re-init if in Local mode
      if (modelMode === 'LOCAL') {
          service.initialize((p) => setOfflineLoadingText(p))
            .then(() => {
                setIsOfflineReady(true);
                showNotification("Connected", 'success');
            })
            .catch((e) => showNotification(`Connection Failed: ${e.message}`, 'alert'));
      }
  };

  const loadModel = async (modelId: string) => {
      // Set as current model
      const newConfig = { ...llmConfig, mode: 'BROWSER_WEBGPU' as const, modelId };
      setLlmConfig(newConfig);
      
      // Initialize immediately
      setOfflineLoadingText("Initializing Download...");
      try {
        const service = OfflineLlmService.getInstance();
        service.updateConfig(newConfig);
        await service.initialize((text) => {
             // WebLLM returns text like "Fetching params: 50%" or "Loading model..."
             if (text.includes('%')) {
                 const match = text.match(/(\d+)%/);
                 if (match) {
                     setDownloadProgress(prev => ({...prev, [modelId]: parseInt(match[1])}));
                 }
             } else if (text.includes("Finish")) {
                 setDownloadProgress(prev => ({...prev, [modelId]: 100}));
             }
             setOfflineLoadingText(text);
        });
        setIsOfflineReady(true);
        showNotification("Model Loaded Successfully", 'success');
      } catch(e: any) {
        showNotification(`Load Failed: ${e.message}`, 'alert');
        setOfflineLoadingText("Error loading model.");
      }
  };

  const addCustomModel = () => {
      if (!customModelId) return;
      const service = OfflineLlmService.getInstance();
      const name = customModelId.split('/').pop() || "Custom Model";
      service.addCustomModel(customModelId, name, "Unknown");
      setAvailableModels(service.getAvailableModels());
      setCustomModelId("");
      showNotification("Model Added to Library", 'success');
  };

  const testConnection = async () => {
      setConnectionTestStatus('testing');
      const service = OfflineLlmService.getInstance();
      const result = await service.validateConnection(llmConfig.serverUrl);
      if (result.success) {
          setConnectionTestStatus('success');
      } else {
          setConnectionTestStatus('error');
          showNotification(result.message, 'alert');
      }
  };

  const closeApp = (id: string) => setApps(prev => prev.map(a => a.id === id ? { ...a, isOpen: false } : a));
  const toggleApp = (id: string) => setApps(prev => prev.map(a => a.id === id ? { ...a, isOpen: !a.isOpen } : a));
  
  const toggleSystemFeature = (feature: keyof SystemStatus) => {
      const current = systemStatus[feature];
      setSystemStatus(prev => ({ ...prev, [feature]: !current }));
      showNotification(`${feature.toUpperCase()} ${!current ? 'ENABLED' : 'DISABLED'}`, !current ? 'success' : 'alert');
  };

  const handleTextInput = (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim()) return;
      if (modelMode === 'LOCAL') {
          handleOfflineInput(textInput);
      } else {
          setTranscripts(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textInput, timestamp: Date.now() }]);
          // Simple visual feedback for cloud text
          setTimeout(() => {
              setTranscripts(prev => [...prev, { id: Date.now().toString(), role: 'system', text: "[Switch to Voice for Live API or Local for Chat]", timestamp: Date.now() }]);
          }, 500);
      }
      setTextInput("");
  };

  // Filter models
  const filteredModels = availableModels.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()));

  if (bootState !== 'READY') {
      return (
        <div className="min-h-screen bg-black text-indigo-400 font-mono flex flex-col items-center justify-center relative overflow-hidden">
             <div className="text-center"><h1 className="text-3xl font-bold text-white">CHARLIE <span className="text-indigo-500">OS</span></h1></div>
             <div className="mt-8">{bootState === 'BIOMETRIC_SCAN' ? <BiometricScanner onVerified={handleVerificationComplete} /> : <div className="text-sm animate-pulse">System Booting... {bootProgress}%</div>}</div>
        </div>
      );
  }

  return (
    <div className="h-screen w-full bg-[#09090b] text-slate-200 font-sans flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-1000 relative">
      
      {/* Settings Modal - Omitted for brevity (same as previous) */}
      {showSettings && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
                  {/* ... Settings Content ... */}
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2"><HardDrive size={20} className="text-indigo-400" /> Universal Intelligence Hub</h2>
                          <p className="text-xs text-slate-500 mt-1">Configure On-Device, Local Server, or Cloud APIs.</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="hover:text-white text-slate-500 transition-colors p-2 rounded hover:bg-white/10"><X size={20} /></button>
                  </div>
                  <div className="flex flex-1 overflow-hidden">
                      {/* Left Sidebar */}
                      <div className="w-64 bg-slate-950/50 border-r border-slate-700 p-4 space-y-2">
                          <button onClick={() => { setLlmConfig({...llmConfig, mode: 'BROWSER_WEBGPU'}); setSettingsSection('AI'); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settingsSection === 'AI' && llmConfig.mode === 'BROWSER_WEBGPU' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                             <Download size={16} /> On-Device (WebGPU)
                          </button>
                          <button onClick={() => { setLlmConfig({...llmConfig, mode: 'LOCAL_SERVER'}); setSettingsSection('AI'); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settingsSection === 'AI' && llmConfig.mode === 'LOCAL_SERVER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                             <Server size={16} /> Local Server
                          </button>
                          <button onClick={() => { setLlmConfig({...llmConfig, mode: 'CLOUD', provider: 'OPENAI'}); setSettingsSection('AI'); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settingsSection === 'AI' && llmConfig.mode === 'CLOUD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                             <Cloud size={16} /> Cloud APIs
                          </button>
                          
                          <div className="pt-4 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">System Settings</div>
                          
                          <button onClick={() => setSettingsSection('VOICE')} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${settingsSection === 'VOICE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                             <Sliders size={16} /> Voice & Audio
                          </button>
                      </div>

                      {/* Right Content Area */}
                      <div className="flex-1 p-6 overflow-y-auto bg-slate-900 relative">
                          
                          {/* VIEW: BROWSER LIBRARY */}
                          {settingsSection === 'AI' && llmConfig.mode === 'BROWSER_WEBGPU' && (
                              <div className="space-y-6">
                                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 flex items-center justify-between">
                                      <div>
                                          <div className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-1">Active Model</div>
                                          <div className="text-white font-medium text-sm truncate max-w-md">{llmConfig.modelId}</div>
                                          {offlineLoadingText && (
                                              <div className="text-[10px] text-slate-400 mt-1 font-mono">{offlineLoadingText}</div>
                                          )}
                                      </div>
                                      <div className="text-right">
                                          <div className={`text-xs font-bold ${isOfflineReady ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                              {isOfflineReady ? 'READY' : 'NOT LOADED'}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex gap-2">
                                      <div className="relative flex-1">
                                          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                                          <input 
                                              type="text" 
                                              value={searchQuery}
                                              onChange={(e) => setSearchQuery(e.target.value)}
                                              placeholder="Search models (Gemma, Llama, Phi...)" 
                                              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none" 
                                          />
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-3">
                                      {filteredModels.map(model => (
                                          <div key={model.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                                              <div className="flex-1 min-w-0 pr-4">
                                                  <div className="flex items-center gap-2 mb-1">
                                                      <h4 className="font-bold text-white text-sm">{model.name}</h4>
                                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${model.family === 'llama' ? 'bg-blue-500/20 text-blue-300' : model.family === 'gemma' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>{model.family}</span>
                                                  </div>
                                                  <p className="text-xs text-slate-400 mb-2">{(model as any).description || "High performance quantized model."}</p>
                                                  
                                                  <div className="flex gap-2">
                                                      <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 border border-slate-600">VRAM: {model.vram}</span>
                                                      <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 border border-slate-600 font-mono">{model.id.split('-').pop()?.replace('.wasm', '')}</span>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex flex-col items-end gap-2 w-32 shrink-0">
                                                  {downloadProgress[model.id] !== undefined && downloadProgress[model.id] < 100 ? (
                                                      <div className="w-full">
                                                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                              <span>Downloading</span>
                                                              <span>{downloadProgress[model.id]}%</span>
                                                          </div>
                                                          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                                                              <div className="bg-indigo-500 h-full transition-all duration-300" style={{width: `${downloadProgress[model.id]}%`}}></div>
                                                          </div>
                                                      </div>
                                                  ) : (
                                                      <button 
                                                        onClick={() => loadModel(model.id)}
                                                        disabled={llmConfig.modelId === model.id && isOfflineReady}
                                                        className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${llmConfig.modelId === model.id && isOfflineReady ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                                      >
                                                          {llmConfig.modelId === model.id && isOfflineReady ? <><Check size={12}/> Active</> : <><Download size={12}/> Load</>}
                                                      </button>
                                                  )}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* VIEW: LOCAL SERVER */}
                          {settingsSection === 'AI' && llmConfig.mode === 'LOCAL_SERVER' && (
                              <div className="space-y-6">
                                  {/* ... existing Local Server UI ... */}
                                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                      <h3 className="text-lg font-bold text-white mb-4">Connect to Localhost</h3>
                                      <div className="space-y-4">
                                          <div>
                                              <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Presets</label>
                                              <div className="flex gap-2">
                                                  <button type="button" onClick={() => setLlmConfig({...llmConfig, serverUrl: 'http://localhost:1234/v1'})} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-sm text-slate-300 transition-colors font-medium">LM Studio (1234)</button>
                                                  <button type="button" onClick={() => setLlmConfig({...llmConfig, serverUrl: 'http://localhost:11434/v1'})} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700 text-sm text-slate-300 transition-colors font-medium">Ollama (11434)</button>
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Server Endpoint</label>
                                              <div className="flex gap-2">
                                                  <input type="text" value={llmConfig.serverUrl} onChange={(e) => { setLlmConfig({...llmConfig, serverUrl: e.target.value}); setConnectionTestStatus('idle'); }} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-sm focus:border-indigo-500 outline-none transition-all" placeholder="http://localhost:1234/v1" />
                                                  <button type="button" onClick={testConnection} className="px-6 rounded-lg font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">Test</button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* VIEW: CLOUD APIs */}
                          {settingsSection === 'AI' && llmConfig.mode === 'CLOUD' && (
                              <div className="space-y-6">
                                  {/* ... existing Cloud API UI ... */}
                                  <div className="grid grid-cols-3 gap-2 mb-6">
                                      {(['OPENAI', 'ANTHROPIC', 'GEMINI', 'MISTRAL', 'OPENROUTER', 'CUSTOM'] as ApiProvider[]).map(p => (
                                          <button 
                                            key={p} 
                                            onClick={() => setLlmConfig({...llmConfig, provider: p})}
                                            className={`py-3 px-2 rounded-lg text-xs font-bold border transition-all ${llmConfig.provider === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                          >
                                              {p}
                                          </button>
                                      ))}
                                  </div>

                                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4">
                                      <div>
                                          <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">API Key</label>
                                          <div className="relative">
                                              <Key size={16} className="absolute left-3 top-3 text-slate-500" />
                                              <input 
                                                type="password" 
                                                value={llmConfig.apiKey || ''} 
                                                onChange={(e) => setLlmConfig({...llmConfig, apiKey: e.target.value})}
                                                placeholder={`Enter ${llmConfig.provider} API Key`}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none" 
                                              />
                                          </div>
                                      </div>

                                      {/* Custom Endpoint Input for OpenRouter/Blackbox/Antigravity */}
                                      {(llmConfig.provider === 'CUSTOM' || llmConfig.provider === 'OPENROUTER') && (
                                         <div>
                                            <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Base URL (For Blackbox/Cline/Antigravity)</label>
                                            <input 
                                                type="text" 
                                                value={llmConfig.serverUrl || ''} 
                                                onChange={(e) => setLlmConfig({...llmConfig, serverUrl: e.target.value})}
                                                placeholder={llmConfig.provider === 'OPENROUTER' ? 'https://openrouter.ai/api/v1' : 'https://api.antigravity.ai/v1'}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-sm focus:border-indigo-500 outline-none mb-2" 
                                            />
                                            <p className="text-[10px] text-slate-500">Enter the API Base URL compatible with OpenAI SDK.</p>
                                         </div>
                                      )}

                                      <div>
                                          <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Model ID</label>
                                          <input 
                                            type="text" 
                                            value={llmConfig.modelId} 
                                            onChange={(e) => setLlmConfig({...llmConfig, modelId: e.target.value})}
                                            placeholder={
                                                llmConfig.provider === 'OPENAI' ? "gpt-4-turbo" : 
                                                llmConfig.provider === 'ANTHROPIC' ? "claude-3-opus-20240229" :
                                                llmConfig.provider === 'GEMINI' ? "gemini-1.5-pro" : "Model Name"
                                            }
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-sm focus:border-indigo-500 outline-none" 
                                          />
                                      </div>
                                  </div>

                                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3">
                                      <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                      <div className="text-xs text-yellow-200">
                                          <strong>Note:</strong> API Keys are stored in your browser's local memory and are never sent to our servers. 
                                          {llmConfig.provider === 'ANTHROPIC' && " Anthropic API calls from browser may require a CORS proxy."}
                                      </div>
                                  </div>
                              </div>
                          )}
                          
                          {/* VIEW: VOICE SETTINGS */}
                          {settingsSection === 'VOICE' && (
                              <div className="space-y-6">
                                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                      <h3 className="text-lg font-bold text-white mb-4">Voice Activation Settings</h3>
                                      <div>
                                         <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Wake Word Sensitivity</label>
                                         <div className="flex items-center gap-4">
                                             <span className="text-xs text-slate-400">Strict</span>
                                             <input 
                                               type="range" 
                                               min="0.1" 
                                               max="0.95" 
                                               step="0.05" 
                                               value={1 - wakeThreshold} 
                                               onChange={(e) => setWakeThreshold(1 - parseFloat(e.target.value))}
                                               className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                             />
                                             <span className="text-xs text-slate-400">Sensitive</span>
                                         </div>
                                         <p className="text-[10px] text-slate-500 mt-2">Adjust how easily 'Hey Charlie' is detected. Higher sensitivity may cause accidental activations.</p>
                                         <p className="text-[10px] text-indigo-400 mt-1 font-mono">Current Threshold: {wakeThreshold.toFixed(2)}</p>
                                      </div>
                                  </div>
                              </div>
                          )}

                      </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                      <button onClick={updateLlmSettings} className="bg-white text-black hover:bg-slate-200 px-6 py-2 rounded-lg font-bold text-sm transition-colors">
                          Save Configuration
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- SIDEBAR: LEFT (VISUALIZER & CORE) --- */}
      <div className="w-full md:w-[450px] h-full bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-20 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">CHARLIE <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">AI</span></h1>
            <button onClick={() => setShowSettings(true)} className="text-slate-500 hover:text-indigo-400 transition-colors"><Settings size={18} /></button>
        </div>

        {/* Visualizer Container (Unobstructed) */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-transparent to-indigo-950/20">
            
            {/* Loading Overlay */}
            {modelMode === 'LOCAL' && !isOfflineReady && llmConfig.mode === 'BROWSER_WEBGPU' && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <Database size={24} className="absolute inset-0 m-auto text-indigo-400" />
                    </div>
                    <h3 className="text-indigo-400 font-bold tracking-widest text-sm mb-2">INITIALIZING NEURAL CORE</h3>
                    <p className="text-slate-500 text-xs font-mono mb-4">Downloading {llmConfig.modelId.split('-')[0]}...</p>
                    <p className="text-[10px] text-slate-600 font-mono h-8 overflow-hidden">{offlineLoadingText}</p>
                </div>
            )}

            <div className="w-full h-full relative z-10 flex items-center justify-center scale-110">
                 {/* REPLACED AVATAR WITH VISUALIZER */}
                 <Visualizer state={appState} audioLevel={audioLevel} />
            </div>
            
            {/* Wake Word Status - Discreet */}
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                 {appState === AppState.IDLE && (
                    <span className="text-[10px] text-slate-600 font-mono animate-pulse tracking-widest">LISTENING FOR "HEY CHARLIE"</span>
                 )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 left-0 right-0 text-center space-y-4 z-20 w-full px-8 pointer-events-none">
                 <div className="pointer-events-auto flex justify-center mb-2">
                    <div className="bg-slate-900/80 p-1 rounded-full border border-white/10 flex relative shadow-xl">
                        <button onClick={toggleModelMode} disabled={modelMode === 'CLOUD'} className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${modelMode === 'CLOUD' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}><span className="flex items-center gap-1"><Cloud size={12}/> Live</span></button>
                        <button onClick={toggleModelMode} disabled={modelMode === 'LOCAL'} className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${modelMode === 'LOCAL' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}><span className="flex items-center gap-1"><Zap size={12}/> Chat</span></button>
                        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-600 rounded-full transition-all duration-300 ${modelMode === 'CLOUD' ? 'left-1' : 'left-[calc(50%+2px)]'}`}></div>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    <button onClick={toggleSession} disabled={modelMode === 'LOCAL' && !isOfflineReady && llmConfig.mode === 'BROWSER_WEBGPU'} className={`group p-4 rounded-full transition-all duration-500 shadow-2xl relative ${appState === AppState.IDLE ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'} ${(modelMode === 'LOCAL' && !isOfflineReady && llmConfig.mode === 'BROWSER_WEBGPU') ? 'opacity-20 cursor-not-allowed' : ''}`}>
                        {appState === AppState.IDLE || appState === AppState.ERROR ? <Power size={24} /> : <MicOff size={24} />}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- CENTER: MAIN DESKTOP --- */}
      <div className="flex-1 h-full relative bg-[#0c0c0e] p-6 overflow-hidden flex flex-col gap-6" style={{backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #000000 60%)'}}>
        
        {/* NOTIFICATIONS: TOP RIGHT */}
        {notification && (
            <div className="absolute top-6 right-6 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className={`px-5 py-3 rounded-lg border backdrop-blur-md flex items-center gap-3 shadow-2xl ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : notification.type === 'alert' ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'}`}>
                    <Bell size={18} /> 
                    <span className="text-xs font-mono font-bold tracking-wide">{notification.message}</span>
                    <div className="w-1 h-8 bg-current opacity-20 rounded-full ml-2"></div>
                </div>
            </div>
        )}

        {/* System Bar */}
        <div className="flex justify-between items-center mb-2">
            <div className="flex gap-3">
                <div className="relative group">
                   <input type="file" id="file-upload" className="hidden" onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); showNotification(`File ${e.target.files?.[0]?.name} loaded`, 'info'); }} />
                   <label htmlFor="file-upload" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full cursor-pointer transition-all text-sm text-slate-300"><Upload size={14} /> <span>Read Doc</span></label>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => toggleApp('camera')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${apps.find(a => a.id === 'camera')?.isOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><Video size={14} /></button>
                    <button onClick={() => toggleApp('people')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${apps.find(a => a.id === 'people')?.isOpen ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><BookUser size={14} /></button>
                    <button onClick={() => toggleApp('agents')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${apps.find(a => a.id === 'agents')?.isOpen ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><Users size={14} /></button>
                    <button onClick={() => toggleApp('neural')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${apps.find(a => a.id === 'neural')?.isOpen ? 'bg-pink-500/10 border-pink-500/20 text-pink-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><BrainCircuit size={14} /></button>
                    <button onClick={() => toggleApp('phone')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${apps.find(a => a.id === 'phone')?.isOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><Smartphone size={14} /></button>
                    <button onClick={() => toggleSystemFeature('wifi')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${systemStatus.wifi ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><Wifi size={14} /></button>
                    <button onClick={() => toggleSystemFeature('bluetooth')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${systemStatus.bluetooth ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}><Bluetooth size={14} /></button>
                    <button onClick={() => toggleSystemFeature('security')} className={`px-3 py-2 rounded-full border flex items-center gap-2 transition-all ${systemStatus.security ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}><Shield size={14} /></button>
                </div>
            </div>
            <div className="text-slate-500 font-medium text-sm tracking-wider">CHARLIE OS v2.1</div>
        </div>

        {/* Desktop Grid */}
        <div className="grid grid-cols-1 gap-6 h-full content-start overflow-y-auto pb-20 pr-2 custom-scrollbar relative z-10">
            {reports.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-xl p-5 h-64 overflow-hidden flex flex-col ring-1 ring-white/5">
                    <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"><FileText size={16} className="text-indigo-400" /> Reports</h3>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                        {reports.map(r => (
                            <div key={r.id} className="bg-white/5 p-4 rounded-lg border border-white/5 hover:bg-white/10 transition-colors"><h4 className="font-bold text-indigo-300">{r.title}</h4><p className="text-xs text-slate-400 whitespace-pre-wrap">{r.content}</p></div>
                        ))}
                    </div>
                </div>
            )}

            {apps.map(app => (
                <SystemWindow key={app.id} app={app} onClose={closeApp}>
                    {app.id === 'camera' && <ActivityTracker />}
                    {app.id === 'phone' && <DeviceMirror state={phoneState} />}
                    {app.id === 'people' && <PeopleDirectory people={peopleList} />}
                    {app.id === 'status' && (
                        <div className="h-full flex flex-col gap-4">
                             <div className="grid grid-cols-3 gap-4">
                                <div className={`p-4 rounded border ${systemStatus.wifi ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800 border-slate-700'}`}><Wifi size={20} className="mb-2"/><span className="text-xs">WiFi: {systemStatus.wifi ? 'ON' : 'OFF'}</span></div>
                                <div className={`p-4 rounded border ${systemStatus.bluetooth ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800 border-slate-700'}`}><Bluetooth size={20} className="mb-2"/><span className="text-xs">BT: {systemStatus.bluetooth ? 'ON' : 'OFF'}</span></div>
                                <div className={`p-4 rounded border ${systemStatus.security ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}><Shield size={20} className="mb-2"/><span className="text-xs">Sec: {systemStatus.security ? 'ON' : 'OFF'}</span></div>
                             </div>
                        </div>
                    )}
                    {/* ... other apps ... */}
                    {app.id === 'neural' && (
                        <div className="h-full flex flex-col bg-slate-950/50">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <h4 className="text-xs font-bold text-pink-400 flex items-center gap-2"><BrainCircuit size={14}/> NEURAL CORE</h4>
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20">
                                        <TrendingUp size={12} className="text-pink-300"/>
                                        <span className="text-[10px] font-bold text-pink-300">EVOLUTION LEVEL {evolutionLevel}</span>
                                    </div>
                                </div>
                                <button onClick={handleSelfTraining} disabled={isTraining} className={`px-3 py-1 text-[10px] rounded border flex items-center gap-1 transition-all ${isTraining ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 animate-pulse cursor-not-allowed' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}>
                                    <RefreshCw size={10} className={isTraining ? 'animate-spin' : ''}/> {isTraining ? 'DEVELOPING SKILLS...' : 'RUN SELF-DEVELOPMENT'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                                {/* Memories */}
                                <div className="flex flex-col border-r border-white/5 pr-4">
                                    <h5 className="text-[10px] text-slate-500 font-bold mb-2 uppercase">Learned Patterns</h5>
                                    <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                                        {memories.map(m => (
                                            <div key={m.id} className="bg-white/5 p-3 rounded border border-white/5 hover:border-pink-500/30 transition-colors group relative">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-pink-300 font-bold text-xs">{m.trigger}</span>
                                                    <span className="text-[9px] text-slate-500 bg-black/40 px-1 rounded">{(m.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">"{m.instruction}"</p>
                                                <button onClick={() => { MemorySystem.getInstance().deleteMemory(m.id); refreshMemoryState(); }} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 p-1 rounded transition-all"><Trash2 size={10}/></button>
                                            </div>
                                        ))}
                                        {memories.length === 0 && <div className="text-center text-slate-600 text-[10px] py-4">No learned behaviors yet.</div>}
                                    </div>
                                </div>
                                
                                {/* Logs */}
                                <div className="flex flex-col pl-2">
                                    <h5 className="text-[10px] text-slate-500 font-bold mb-2 uppercase">Training Logs</h5>
                                    <div className="space-y-1 overflow-y-auto flex-1 font-mono text-[9px] custom-scrollbar">
                                        {trainingLogs.map(l => (
                                            <div key={l.id} className="flex gap-2 text-slate-400 hover:bg-white/5 p-1 rounded">
                                                <span className="text-slate-600 min-w-[50px]">{new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                                <span className={`${l.type === 'NEW_RULE' ? 'text-emerald-400' : 'text-blue-400'}`}>{l.event}:</span>
                                                <span className="truncate">{l.details}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {app.type === 'terminal' && <div className="font-mono text-xs text-slate-400"><span className="text-green-400">➜ ~</span> System ready.</div>}
                    {app.type === 'editor' && <div className="h-full flex flex-col">{generatedCodes.map(c => <div key={c.id} className="mb-4"><div className="text-xs text-yellow-500 mb-1">{c.description}</div><pre className="bg-black/30 p-2 rounded text-indigo-200 text-xs overflow-auto">{c.code}</pre></div>)}</div>}
                    {app.type === 'browser' && (
                        <div className="flex flex-col h-full bg-slate-100">
                             <div className="bg-slate-200 p-2 border-b border-slate-300 flex gap-2">
                                 <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                 </div>
                                 <input type="text" value={browserUrl} readOnly className="flex-1 bg-white rounded-md px-2 text-xs text-slate-600 border border-slate-300" />
                             </div>
                             <div className="flex-1 bg-white relative overflow-hidden">
                                 <iframe 
                                     src={browserUrl} 
                                     title="Browser Content"
                                     className="w-full h-full border-0"
                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                     allowFullScreen
                                 />
                                 {/* Fallback overlay if iframe is blocked by X-Frame-Options */}
                                 {(!browserUrl.includes('youtube.com/embed') && !browserUrl.includes('google.com/search')) && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-white/90 pointer-events-none">
                                         <div className="text-center text-slate-400">
                                            <Globe size={48} className="mx-auto mb-2 opacity-20"/>
                                            <p className="text-xs">External Site Content Loaded</p>
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}
                    {app.type === 'mail' && <div className="space-y-2">{emails.map(e => <div key={e.id} className="bg-white/5 p-3 rounded border-l-2 border-indigo-500"><div className="font-bold text-xs">{e.to}</div><div className="text-indigo-300 text-xs">{e.subject}</div></div>)}</div>}
                </SystemWindow>
            ))}
        </div>
      </div>

      {/* --- SIDEBAR: RIGHT (COMMUNICATOR) --- */}
      <div className="w-full md:w-[350px] h-full bg-black/40 backdrop-blur-md border-l border-white/10 flex flex-col relative z-20">
         <div className="p-4 border-b border-white/5 flex items-center justify-between">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <MessageSquare size={14} /> Neural Link
             </div>
             <div className={`w-2 h-2 rounded-full ${appState === AppState.LISTENING || appState === AppState.SPEAKING ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm scroll-smooth min-h-0">
            {transcripts.map(t => (
                <div key={t.id} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-3 rounded-2xl text-xs ${t.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : t.role === 'system' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 w-full text-center' : 'bg-slate-800 text-slate-200 rounded-tl-sm'} ${t.id === 'interim' ? 'opacity-70 italic' : ''}`}>
                        {t.text}
                    </div>
                </div>
            ))}
            <div ref={transcriptsEndRef} />
         </div>

         <form onSubmit={handleTextInput} className="p-3 border-t border-white/5 bg-black/20">
            <div className="relative">
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={modelMode === 'LOCAL' ? "Command Agent Army..." : "Type command..."} className="w-full bg-slate-900/50 border border-white/10 rounded-full px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600" />
                <button type="submit" className="absolute right-2 top-1.5 p-1 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors"><ArrowRight size={14} /></button>
            </div>
         </form>
      </div>

    </div>
  );
};

export default App;
