import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/daisyui/dist/**/*.js",
  ],
  theme: {
    extend: {
      animation: {
        shake: "vertical-shaking 0.35s infinite",
      },
      keyframes: {
        "vertical-shaking": {
          "0%, 100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(5px)" },
          "50%": { transform: "translateY(-5px)" },
          "75%": { transform: "translateY(5px)" },
        },
      },
    },
  },
  daisyui: {
    themes: ["aqua"],
  },
  plugins: [daisyui],
};
