/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        love: {
          50: "#fff0f3",
          100: "#ffe0e8",
          200: "#ffc6d5",
          300: "#ff9db5",
          400: "#ff6490",
          500: "#ff2d6b",
          600: "#f0184f",
          700: "#cc0e3e",
          800: "#a81038",
          900: "#8f1235",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-gentle": "bounceGentle 2s infinite",
        "pulse-heart": "pulseHeart 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        pulseHeart: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        jnapp: {
          primary: "#ff2d6b",
          "primary-content": "#ffffff",
          secondary: "#f471b5",
          "secondary-content": "#ffffff",
          accent: "#fb7185",
          "accent-content": "#ffffff",
          neutral: "#2a1728",
          "neutral-content": "#f5d0fe",
          "base-100": "#1a0a1f",
          "base-200": "#230d2b",
          "base-300": "#2d1238",
          "base-content": "#f5e6ff",
          info: "#7dd3fc",
          success: "#86efac",
          warning: "#fde68a",
          error: "#fca5a5",
        },
      },
    ],
    darkMode: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
