import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react-swc";
import mkcert from "vite-plugin-mkcert";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
// https://vitejs.dev/config/
export default defineConfig({
  base: "/",

  plugins: [
    // Allows using React dev server along with building a React application with Vite.
    // https://npmjs.com/package/@vitejs/plugin-react-swc
    react(),
    tailwindcss(),
    // Allows using the compilerOptions.paths property in tsconfig.json.
    // https://www.npmjs.com/package/vite-tsconfig-paths
    tsconfigPaths(),
    // Creates a custom SSL certificate valid for the local machine.
    // Using this plugin requires admin rights on the first dev-mode launch.
    // https://www.npmjs.com/package/vite-plugin-mkcert
    process.env.HTTPS && mkcert(),
  ],
  publicDir: "./public",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        consultation: resolve(__dirname, "consultation.html"),
      },
    },
  },
  server: {
    // Exposes your dev server and makes it accessible for the devices in the same network.
    host: true,

    allowedHosts: ["lije-care-miniapp-dev.zikollab.com", ".ngrok-free.dev", ".ngrok.io"],
  },
});
