/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        premium: {
          bg: "#f5f1eb",
          primary: "#bfa27a",
          dark: "#8a6f4d",
          card: "#ffffff",
          border: "#e5ddd5",
          heading: "#2d2a26",
          subtext: "#6b5e52",
        }
      },
    },
  },
  plugins: [],
};














