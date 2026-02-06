import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        ...(process.env.ANALYZE ? [visualizer({ open: false, gzipSize: true, filename: "stats.html" })] : []),
    ],
    resolve: {
        alias: { "@": path.resolve(__dirname, "src") },
    },
    // Vitest 옵션 (vitest.config.ts 통합)
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
});
