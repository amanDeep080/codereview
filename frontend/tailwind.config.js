/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // subtle severity palette used across the dashboard
        critical: "#dc2626",
        high: "#ea580c",
        medium: "#ca8a04",
        low: "#65a30d",
        info: "#64748b"
      }
    }
  },
  plugins: []
}
