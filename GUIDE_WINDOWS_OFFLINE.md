# 🪟 How to Convert Charlie AI to a Native Windows App (Electron)

To make Charlie operate as a **System Assistant** (opening real calculators, creating real files, etc.), you must wrap this React app in **Electron**.

## Step 1: Install Electron Dependencies

Run these commands in your project terminal:

```bash
npm install electron electron-is-dev --save-dev
npm install concurrently wait-on --save-dev
```

## Step 2: Create Electron Entry Point (`public/electron.js`)

Create a file `public/electron.js` (or just `electron.js` in root, adjust paths accordingly).

```javascript
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { exec } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // Sci-fi borderless look
    transparent: true, // Semi-transparent background
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load React App
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // --- IPC HANDLERS (The Bridge) ---

  // 1. Open Real Apps
  ipcMain.handle('system:open-app', async (event, appName) => {
    let command = '';
    switch(appName.toLowerCase()) {
        case 'calculator': command = 'calc.exe'; break;
        case 'notepad': command = 'notepad.exe'; break;
        case 'terminal': command = 'start cmd.exe'; break;
        case 'browser': command = 'start chrome'; break;
        default: return "Unknown App";
    }
    
    exec(command);
    return `Opened ${appName}`;
  });

  // 2. Control System (WiFi/Bluetooth - Requires elevated Node scripts usually)
  ipcMain.handle('system:toggle-feature', async (event, { feature, enabled }) => {
     // Simplified example. Real toggling needs Powershell scripts.
     console.log(`Toggling ${feature} to ${enabled}`);
     return true;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

## Step 3: Create The Bridge (`public/preload.js`)

This allows your React code to talk to the Node.js backend safely.

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openApp: (appName) => ipcRenderer.invoke('system:open-app', appName),
  toggleSystem: (data) => ipcRenderer.invoke('system:toggle-feature', data),
});
```

## Step 4: Update Your React Code (`App.tsx`)

In your `services/geminiLive.ts` or `App.tsx`, replace the simulated "System" calls with real Electron calls.

```typescript
// Check if running in Electron
const isElectron = (window as any).electronAPI;

// In your tool handler:
const handleOpenApp = async ({ appName }) => {
   if (isElectron) {
      // Calls the C++ / Windows Native API
      await (window as any).electronAPI.openApp(appName);
      return { success: true, message: `Opened native ${appName}` };
   } else {
      // Fallback to Web Simulation (Current behavior)
      // ... existing code ...
   }
};
```

## Step 5: Run It

Update `package.json`:

```json
"main": "public/electron.js",
"scripts": {
  "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\""
}
```

Run:
```bash
npm run electron-dev
```
