/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
  colors: {
    empirePurple: '#6B21A8',
    empirePink: '#DB2777',
    empireOrange: '#F97316',
    empireBlue: '#3B82F6',
  },
  fontFamily: {
    serif: ['Merriweather', 'serif'],
    sans: ['Inter', 'sans-serif'],
  },
},

  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
