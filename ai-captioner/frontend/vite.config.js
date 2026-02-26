import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        // Windows 환경에서 파일 감시 정상화 (HMR 수정)
        watch: {
            usePolling: true,
            interval: 1000,
        },
        hmr: {
            overlay: true,
        },
    },
});
