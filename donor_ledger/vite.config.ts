import { defineConfig, ConfigEnv, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const plugins = [react()];
  if (mode === "development") {
    plugins.push(componentTagger() as unknown as Plugin);
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
      middlewareMode: false,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

