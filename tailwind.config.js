/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0d47a1",
        "primary-dark": "#002171",
        "primary-light": "#5472d3",
        surface: "#e3f2fd",
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Bengali"', 'sans-serif'],
        bangla: ['"Noto Sans Bengali"', 'sans-serif'],
      },
      minHeight: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
