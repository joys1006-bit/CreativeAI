const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    processVideo: (filePath) => ipcRenderer.invoke('process-video', filePath),
    onProgress: (callback) => ipcRenderer.on('processing-progress', (event, data) => callback(data)),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
