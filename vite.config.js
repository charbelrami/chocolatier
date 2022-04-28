import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  return {
    root: mode === "development" ? "./dev" : "./",
    server: {
      port: 3000,
    },
    esbuild: {
      jsxFactory: "h",
      jsxFragment: "Fragment",
    },
    build: {
      lib: {
        entry: "./src/index.js",
        name: "Chocolatier",
        fileName: (format) => `index.${format}.js`,
      },
    },
  };
});
