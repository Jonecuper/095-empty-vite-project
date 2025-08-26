import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: process.env.ROOT_DIR, // корень проекта (где index.html)
  // publicDir: process.env.PUBLIC_DIR, // файлы из этой папки не будут упакованны
  publicDir: false, // отключаем publicDir полностью, если не нужен
  build: {
    outDir: process.env.BUILD_DIR, // папка для сборки
    emptyOutDir: process.env.IS_CLEAR_DIR_BEFORE_BUILD === 'true', // очищать папку сборки перед сборкой
    rollupOptions: {
      input: process.env.START_ENTRY_BUILD_FILE, // начинать сборку отсюда
    },
  },
  server: {
    port: process.env.DEV_SERVER_PORT, // порт для разработки
  },
  base: process.env.BASE_DEV_SERVER_PATH
});