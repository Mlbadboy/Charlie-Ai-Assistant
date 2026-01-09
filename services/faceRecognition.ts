
import * as faceapi from 'face-api.js';
import { PersonProfile } from '../types';

// Using jsdelivr for reliable model hosting
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
const DB_KEY = 'charlie_face_db_v1';

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private modelsLoaded = false;
  private isFallbackMode = false;
  
  private faceMatcher: faceapi.FaceMatcher | null = null;
  private profiles: PersonProfile[] = [];
  
  // Holds the descriptor of the face currently in the frame (for registration)
  public lastSeenDescriptor: Float32Array | null = null;
  public lastSeenImage: string | null = null;
  
  // NEW: Track current status for LLM queries
  public currentDetectedName: string | null = null;
  public currentDetectedNickname: string | null = null;
  public currentDetectionConfidence: number = 0;

  private constructor() {
    this.loadDatabase();
  }

  public static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  private loadDatabase() {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (stored) {
        this.profiles = JSON.parse(stored);
        this.rebuildMatcher();
      }
    } catch (e) {
      console.error("Failed to load face database", e);
      this.profiles = [];
    }
  }

  private saveDatabase() {
    try {
      // Basic check to prevent localStorage overflow (simple FIFO if too big)
      if (this.profiles.length > 50) {
        this.profiles = this.profiles.slice(-50);
      }
      localStorage.setItem(DB_KEY, JSON.stringify(this.profiles));
      this.rebuildMatcher();
    } catch (e) {
      console.error("Storage full or error", e);
    }
  }

  private rebuildMatcher() {
    if (this.profiles.length === 0) {
      this.faceMatcher = null;
      return;
    }

    const labeledDescriptors = this.profiles.map(profile => {
      // Convert array back to Float32Array
      const descriptor = new Float32Array(profile.descriptor);
      return new faceapi.LabeledFaceDescriptors(profile.name, [descriptor]);
    });

    this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  }

  public async loadModels(): Promise<boolean> {
    if (this.modelsLoaded) return true;

    try {
      console.log("Loading Face API models...");
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); // Essential for descriptors
      
      this.modelsLoaded = true;
      console.log("Face API models loaded successfully.");
      return true;
    } catch (error) {
      console.error("Failed to load Face API models. Switching to fallback simulation mode.", error);
      this.isFallbackMode = true;
      return false;
    }
  }

  public async detectFace(video: HTMLVideoElement): Promise<{ detected: boolean, name?: string, nickname?: string, details?: any }> {
    if (this.isFallbackMode) {
      return new Promise((resolve) => {
         const detected = Math.random() > 0.1; 
         resolve({ detected, name: "Simulation", details: null });
      });
    }

    if (!this.modelsLoaded) {
      return { detected: false };
    }

    try {
      // Detect single face with landmarks and descriptor
      const detection = await faceapi.detectSingleFace(
        video, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection) {
        // Cache for potential registration
        this.lastSeenDescriptor = detection.descriptor;
        
        // Identify
        let name = "Unknown";
        let nickname = undefined;

        if (this.faceMatcher) {
            const bestMatch = this.faceMatcher.findBestMatch(detection.descriptor);
            if (bestMatch.label !== 'unknown') {
                name = bestMatch.label;
                // Find full profile for nickname
                const profile = this.profiles.find(p => p.name === name);
                if (profile) nickname = profile.nickname;
            }
        }

        // Update Public State
        this.currentDetectedName = name;
        this.currentDetectedNickname = nickname || null;
        this.currentDetectionConfidence = detection.detection.score;

        return { 
          detected: true,
          name,
          nickname,
          details: detection
        };
      } else {
        this.lastSeenDescriptor = null;
        this.currentDetectedName = null;
        this.currentDetectedNickname = null;
        this.currentDetectionConfidence = 0;
        return { detected: false };
      }
    } catch (e) {
      return { detected: false };
    }
  }

  // Called by UI when creating a snapshot for registration
  public setLastSeenImage(base64: string) {
      this.lastSeenImage = base64;
  }

  public registerCurrentPerson(
    name: string, 
    mobile: string, 
    email: string, 
    type: 'PERMANENT' | 'TEMPORARY' = 'PERMANENT',
    nickname?: string
  ): { success: boolean, message: string } {
    
    if (!this.lastSeenDescriptor) {
        return { success: false, message: "No face currently detected to register." };
    }

    const newProfile: PersonProfile = {
        id: Date.now().toString(),
        name,
        nickname,
        type,
        mobile,
        email,
        descriptor: Array.from(this.lastSeenDescriptor), // Convert to array for JSON storage
        image: this.lastSeenImage || '',
        registeredAt: Date.now()
    };

    // Remove existing if name matches (overwrite)
    this.profiles = this.profiles.filter(p => p.name !== name);
    this.profiles.push(newProfile);
    this.saveDatabase();

    return { success: true, message: `Successfully registered ${name}${nickname ? ` (${nickname})` : ''} as ${type} User.` };
  }

  public getPeopleReport(startDate?: string, endDate?: string): PersonProfile[] {
    let filtered = this.profiles;
    
    if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(p => p.registeredAt >= start);
    }
    
    if (endDate) {
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(p => p.registeredAt <= end);
    }

    // Sort by most recent
    return filtered.sort((a, b) => b.registeredAt - a.registeredAt);
  }

  public getIsFallback(): boolean {
    return this.isFallbackMode;
  }
}
