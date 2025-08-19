import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export function createConfig(_packageName, input = "./src/index.ts") {
  return defineConfig({
    input,
    plugins: [
      typescript({
        module: "esnext",
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ["@haiyami/hyperstruct", "dataloader"],
    output: [
      {
        file: "./dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "./dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
  });
}
