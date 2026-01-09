
# Charlie AI OS Assistant

Charlie is an advanced, voice-controlled AI operating system interface designed to mimic natural human interaction. It currently features real-time voice processing, system control simulation, and a "multiverse" liquid visualizer.

## 🚀 Features

### Core Functionalities
*   **Voice-First Interface:** Zero-latency conversational capabilities using streaming audio.
*   **System Control:** Capability to toggle WiFi, Bluetooth, and Security modules.
*   **App Management:** Open/Close simulated apps (Terminal, VS Code, Browser, Mail).
*   **Code Generation:** Generates syntax-highlighted code snippets within the "VS Code" window.
*   **Report Generation:** Creates structured markdown reports based on user queries.
*   **Smart Email:** Interactive composition and replies. Charlie asks for subjects, recipients, and body text before sending.
*   **Visual Intelligence:** 3D Liquid Orb visualizer that reacts to audio amplitude and system state.
*   **Inclusive Design:** Full keyboard navigation support and ARIA accessibility for screen readers.

---

## 🔒 Offline Operation (WebGPU & Local LLMs)

Charlie supports running LLMs entirely offline within the browser using WebGPU, or connecting to local inference servers (like LM Studio/Ollama).

### Supported On-Device Models (WebGPU)
Charlie uses `@mlc-ai/web-llm` to run quantized models directly in Chrome/Edge without backend servers.
*   **Google Gemma 2 2B:** Fast, efficient, best for laptops.
*   **Meta Llama 3.1 8B:** Standard for general reasoning.
*   **Microsoft Phi 3.5 Mini:** Excellent logic in a small package.
*   **Mistral 7B:** Reliable all-rounder.
*   **Qwen 2.5 7B:** Great for coding and math.

### Steps to Use Offline Mode
1.  Click the **Settings** (Gear Icon) in the sidebar.
2.  Select **On-Device (WebGPU)**.
3.  Choose a model from the library and click **Load**.
4.  Wait for the model weights to download (cached for future use).
5.  Switch the main toggle to **Chat** (Lightning Icon) to use the local model.

### Local Server Integration
You can also connect Charlie to local API servers:
1.  Run **LM Studio** or **Ollama**.
2.  Start a local server (e.g., `http://localhost:1234/v1`).
3.  In Charlie Settings, select **Local Server** and enter your endpoint.

---

## 🧠 Memory & Agents

### Memory Architecture
To keep a record of previous discussions (Long-term Memory):
1.  **Neural Core:** Stores "Learned Patterns" (User corrections and preferences).
2.  **Implementation:**
    *   Self-reflection loop analyzes user feedback (e.g., "Don't do X").
    *   Updates `localStorage` with new rules.
    *   Injects relevant rules into the System Prompt dynamically.

### Building Agents
To build agents for research and other work:
1.  **Task Queue:** Implement a background job queue (Agent Orchestrator).
2.  **Tool Definitions:** Define tools (Search, Calculator, FileSystem) as JSON schemas.
3.  **Loop:**
    *   Agent receives goal -> "Build a Production App".
    *   Agent creates sub-tasks -> ["Define PRD", "Generate Architecture", "Write Code"].
    *   **Architectural Determinism:** A 'Reviewer' agent audits code against the spec before marking tasks complete.

---

## 👁️ Facial & Voice Recognition

### Facial Recognition
Integration using `face-api.js` (TensorFlow.js wrapper):
1.  `npm install face-api.js`
2.  Load `ssdMobilenetv1` models.
3.  Access Webcam stream.
4.  Match detected descriptor against stored user descriptor to unlock the system.

---

## 📦 Production Ready Setup

To deploy Charlie as a progressive web app (PWA) or desktop app:

1.  **Build**:
    ```bash
    npm run build
    ```

2.  **Electron (Desktop App)**:
    Wrap the build in Electron to give it access to native System APIs (Real file system, real toggle of WiFi/Bluetooth).
    *   See `GUIDE_WINDOWS_OFFLINE.md` for specific instructions.

3.  **Docker**:
    ```dockerfile
    FROM node:18-alpine as build
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    FROM nginx:alpine
    COPY --from=build /app/dist /usr/share/nginx/html
    ```
