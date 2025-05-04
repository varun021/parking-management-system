import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
  server: {
    host: "0.0.0.0",  // <- Allow connections from LAN
    port: 5173,       // <- Or any other port you prefer
  },
})
