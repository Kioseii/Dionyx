import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * The kuromoji dictionary (public/kuromoji-dict/*.dat.gz) must reach the page
 * still gzipped: kuromoji gunzips it itself. Vite's static server labels .gz
 * files with "Content-Encoding: gzip", so the browser decompresses them first
 * and the romanizer never finishes loading. Drop that header for these files
 * (dev server only; the bundled app serves them untouched).
 */
function rawKuromojiDictionary(): Plugin {
  return {
    name: "dionyx-raw-kuromoji-dictionary",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req as { url?: string }).url ?? "";

        if (url.indexOf("/kuromoji-dict/") !== -1) {
          const setHeader = res.setHeader.bind(res);
          res.setHeader = (name, value) =>
            name.toLowerCase() === "content-encoding" ? res : setHeader(name, value);

          const writeHead = res.writeHead.bind(res) as (...args: unknown[]) => typeof res;
          res.writeHead = ((...args: unknown[]) => {
            for (const arg of args) {
              if (typeof arg !== "object" || arg === null || Array.isArray(arg)) {
                continue;
              }

              for (const key of Object.keys(arg)) {
                if (key.toLowerCase() === "content-encoding") {
                  delete (arg as Record<string, unknown>)[key];
                }
              }
            }
            return writeHead(...args);
          }) as typeof res.writeHead;
        }
        next();
      });
    },
  };
}

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), rawKuromojiDictionary()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
