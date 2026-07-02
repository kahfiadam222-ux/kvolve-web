import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palet Kvolve — netral hangat + satu aksen "kinetic teal"
        canvas: "#f7f7f5",
        ink: "#1c1c1a",
        accent: {
          DEFAULT: "#0d9488",
          soft: "#ccfbf1",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
