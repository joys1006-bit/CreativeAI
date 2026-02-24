/**
 * [CTO 담당] Electron 메인 프로세스
 * - BrowserWindow 생성
 * - 네이티브 메뉴바
 * - 파일 열기 다이얼로그
 * - 시스템 트레이
 * - 자동 업데이트 (electron-updater)
 */
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// === 백엔드 서버 자동 시작 ===
function startBackend() {
    const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
    backendProcess = spawn('node', [serverPath], {
        cwd: path.join(__dirname, '..', 'backend'),
        env: { ...process.env },
        stdio: 'pipe',
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`[Backend] Process exited with code ${code}`);
    });
}

// === 메인 윈도우 생성 ===
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'AI Captioner PRO',
        icon: path.join(__dirname, 'icons', 'icon.png'),
        backgroundColor: '#0d0d0f',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false,
        },
    });

    // 개발 모드 vs 프로덕션
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// === 네이티브 메뉴 ===
function createMenu() {
    const template = [
        {
            label: '파일',
            submenu: [
                {
                    label: '영상 불러오기',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(mainWindow, {
                            title: '영상 파일 선택',
                            filters: [
                                { name: '영상 파일', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv'] },
                                { name: '오디오 파일', extensions: ['mp3', 'wav', 'aac', 'flac', 'ogg'] },
                                { name: '모든 파일', extensions: ['*'] },
                            ],
                            properties: ['openFile'],
                        });
                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow.webContents.send('file-opened', result.filePaths[0]);
                        }
                    },
                },
                { type: 'separator' },
                {
                    label: 'SRT 저장',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => mainWindow.webContents.send('save-srt'),
                },
                {
                    label: '영상 내보내기',
                    accelerator: 'CmdOrCtrl+Shift+E',
                    click: () => mainWindow.webContents.send('export-video'),
                },
                { type: 'separator' },
                { label: '종료', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
            ],
        },
        {
            label: '편집',
            submenu: [
                { label: '되돌리기', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('undo') },
                { label: '다시하기', accelerator: 'CmdOrCtrl+Shift+Z', click: () => mainWindow.webContents.send('redo') },
                { type: 'separator' },
                { role: 'cut', label: '잘라내기' },
                { role: 'copy', label: '복사' },
                { role: 'paste', label: '붙여넣기' },
                { role: 'selectAll', label: '전체 선택' },
            ],
        },
        {
            label: '보기',
            submenu: [
                { role: 'reload', label: '새로고침' },
                { role: 'toggleDevTools', label: '개발자 도구' },
                { type: 'separator' },
                { role: 'zoomIn', label: '확대' },
                { role: 'zoomOut', label: '축소' },
                { role: 'resetZoom', label: '원래 크기' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: '전체 화면' },
            ],
        },
        {
            label: '도움말',
            submenu: [
                {
                    label: 'AI Captioner PRO 정보',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            title: 'AI Captioner PRO',
                            message: 'AI Captioner PRO v1.0.0',
                            detail: 'Vrew 벤치마킹 AI 자막 편집기\n\nWhisper + Gemini 하이브리드 AI\n4개국어 번역 | TTS 음성 | 숏폼 템플릿\n\n© 2026 CreativeAI Team',
                            type: 'info',
                        });
                    },
                },
                {
                    label: 'GitHub',
                    click: () => shell.openExternal('https://github.com/joys1006-bit/CreativeAI'),
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// === IPC 핸들러 ===
ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        filters: [
            { name: '영상/오디오', extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'aac'] },
        ],
        properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{ name: 'SRT 자막', extensions: ['srt'] }],
    });
    return result.canceled ? null : result.filePath;
});

// === 앱 라이프사이클 ===
app.whenReady().then(() => {
    startBackend();

    // 백엔드 준비 대기 후 윈도우 생성
    setTimeout(() => {
        createWindow();
        createMenu();
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (backendProcess) backendProcess.kill();
});
