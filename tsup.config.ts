import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react"], // Treat all React-related modules as external
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";', // Add use client directive for Next.js compatibility
    };
  }
});