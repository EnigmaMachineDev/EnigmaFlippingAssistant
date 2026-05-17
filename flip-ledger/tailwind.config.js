/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0f0a",
        foreground: "#c8e6c8",
        card: {
          DEFAULT: "#142014",
          foreground: "#c8e6c8",
        },
        popover: {
          DEFAULT: "#0f1a0f",
          foreground: "#c8e6c8",
        },
        primary: {
          DEFAULT: "#4a8c4a",
          foreground: "#c8e6c8",
        },
        secondary: {
          DEFAULT: "#1a2e1a",
          foreground: "#7a9f7a",
        },
        muted: {
          DEFAULT: "#1a2e1a",
          foreground: "#7a9f7a",
        },
        accent: {
          DEFAULT: "#1e3a1e",
          foreground: "#c8e6c8",
        },
        destructive: {
          DEFAULT: "#e57373",
          foreground: "#c8e6c8",
        },
        border: "#1e3a1e",
        input: "#1a2e1a",
        ring: "#4a8c4a",
        bright: "#6abf6a",
        panel: "#0f1a0f",
        hover: "#1a2e1a",
        success: "#81c784",
        warning: "#f59e0b",
        info: "#7986cb",
        courage: "#e57373",
        spirit: "#81c784",
        grace: "#7986cb",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.4rem",
        sm: "0.3rem",
      },
    },
  },
  plugins: [],
};
