import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "ORBIT",
        short_name: "ORBIT",
        description: "ORBIT Social Media App",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",

        icons: [
          {
            src: "/icon/icon-192.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});