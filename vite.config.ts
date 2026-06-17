import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 部署到个人站子路径 mingyuyang.com/projects/wechat-md/，
// 构建时把 base 设为该子路径，资源引用才不会指到主站根目录的 /assets。
// 开发时保持根路径，方便本地预览。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/projects/wechat-md/" : "/",
  plugins: [react(), tailwindcss()],
  server: { port: 8851, strictPort: true },
}));
