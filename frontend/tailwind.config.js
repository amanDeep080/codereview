/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        critical: "#dc2626",
        high: "#ea580c",
        medium: "#ca8a04",
        low: "#65a30d",
        info: "#64748b"
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.5s ease-out',
      }
    }
  },
  plugins: []
}
