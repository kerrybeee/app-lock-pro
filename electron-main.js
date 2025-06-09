const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { UserConsentVerifier } = require('windows-hello'); // Hypothetical module for Windows Hello
const { processMonitor } = require('./src/lib/processMonitor');
const { saveProtectedApps, loadProtectedApps } = require('./src/lib/storageManager');
const { logAuthenticationAttempt } = require('./src/lib/auditLogger');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    frame: false,
    roundedCorners: true,
  });

  mainWindow.loadURL('http://localhost:8000'); // Assuming React dev server runs here

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function checkWindowsHelloAvailability() {
  try {
    const availability = await UserConsentVerifier.checkAvailability();
    return availability === 'Available';
  } catch (error) {
    console.error('Windows Hello availability check failed:', error);
    return false;
  }
}

async function requestWindowsHelloVerification(reason) {
  try {
    const result = await UserConsentVerifier.requestVerification(reason);
    return result === 'Verified';
  } catch (error) {
    console.error('Windows Hello verification failed:', error);
    return false;
  }
}

ipcMain.handle('windows-hello-available', async () => {
  return await checkWindowsHelloAvailability();
});

ipcMain.handle('windows-hello-authenticate', async (event, reason) => {
  return await requestWindowsHelloVerification(reason);
});

const protectedApps = loadProtectedApps();

processMonitor.on("processStarted", async (processName) => {
  console.log("Process started:", processName);
  const app = protectedApps.find(
    (a) => a.name.toLowerCase() === processName.toLowerCase()
  );
  if (app) {
    // Trigger Windows Hello authentication
    const authenticated = await requestWindowsHelloVerification(
      `Authenticate to launch ${app.name}`
    );
    if (!authenticated) {
      // Terminate the process if authentication fails
      console.log(`Authentication failed for ${app.name}, blocking launch.`);
      try {
        const exec = require('child_process').exec;
        exec(`taskkill /IM "${app.name}" /F`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Failed to terminate ${app.name}:`, error);
          } else {
            console.log(`${app.name} terminated successfully.`);
          }
        });
      } catch (error) {
        console.error('Error terminating process:', error);
      }
      logAuthenticationAttempt(app.name, false);
      if (mainWindow) {
        mainWindow.webContents.send("auth-failed", app.name);
      }
    } else {
      console.log(`Authentication succeeded for ${app.name}`);
      logAuthenticationAttempt(app.name, true);
      if (mainWindow) {
        mainWindow.webContents.send("auth-success", app.name);
      }
    }
  }
});

app.whenReady().then(() => {
  createWindow();

  const iconPath = path.join(__dirname, 'public', 'window.svg');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App Lock Pro', click: () => { mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('App Lock Pro');
  tray.setContextMenu(contextMenu);

  // Start monitoring processes
  processMonitor.startMonitoring();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();

  const iconPath = path.join(__dirname, 'public', 'window.svg');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App Lock Pro', click: () => { mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('App Lock Pro');
  tray.setContextMenu(contextMenu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
