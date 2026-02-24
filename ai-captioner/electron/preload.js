/**
 * [CTO 담당] Electron Preload 스크립트
 * - contextBridge로 안전한 API 노출
 * - 파일 드래그&드롭 지원
 * - IPC 통신 브리지
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 파일 다이얼로그
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName),

    // 메인 프로세스 이벤트 수신
    onFileOpened: (callback) => ipcRenderer.on('file-opened', (_, filePath) => callback(filePath)),
    onSaveSrt: (callback) => ipcRenderer.on('save-srt', () => callback()),
    onExportVideo: (callback) => ipcRenderer.on('export-video', () => callback()),
    onUndo: (callback) => ipcRenderer.on('undo', () => callback()),
    onRedo: (callback) => ipcRenderer.on('redo', () => callback()),

    // 플랫폼 정보
    platform: process.platform,
    isElectron: true,
});
