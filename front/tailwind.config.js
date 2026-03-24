/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
          },
          border: 'var(--border-color)',
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
          },
        },
        brand: {
          blue: 'var(--brand-blue)',
          purple: 'var(--brand-purple)',
        },
      },
    },
  },
  plugins: [],
}
