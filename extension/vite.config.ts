import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Plugin to copy static extension files (manifest, icons) to dist
function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );

      // Copy icons if they exist
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(__dirname, 'dist/icons');
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }
        for (const size of ['16', '48', '128']) {
          const src = resolve(iconsDir, `icon${size}.png`);
          if (existsSync(src)) {
            copyFileSync(src, resolve(distIconsDir, `icon${size}.png`));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
