/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#1e293b',
        accent: '#e11d48',
        success: '#10b981',
        warning: '#f59e0b',
        critical: '#dc2626',
      },
    },
  },
  plugins: [],
}
