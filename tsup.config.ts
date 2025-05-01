import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  dts: true, // Generate declaration file (.d.ts)
  splitting: false,
  sourcemap: true,
  clean: true,
  async onSuccess() {
    // Copy the PEM file to the dist directory
    const srcPemPath = path.join(__dirname, "src", "sdk-kms.pem");
    const distPemPath = path.join(__dirname, "dist", "sdk-kms.pem");
    try {
      fs.copyFileSync(srcPemPath, distPemPath);
      console.log("Successfully copied sdk-kms.pem to dist directory");
    } catch (error) {
      console.error("Error copying sdk-kms.pem:", error);
    }
  }
});