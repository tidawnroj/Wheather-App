/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        'brand-blue': '#1e3a8a',
        'brand-dark': '#0f172a',
        'brand-glass': 'rgba(255, 255, 255, 0.1)',
        "primary": "#13ec92",
        "background-light": "#f6f8f7",
        "background-dark": "#051c14",
        "neutral-dark": "#0a2a1f",
        "glass-bg": "rgba(10, 42, 31, 0.7)",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
