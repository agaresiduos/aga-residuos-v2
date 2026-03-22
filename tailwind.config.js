/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#e8eef8',
          100: '#c5d2ed',
          200: '#9fb4e0',
          300: '#7895d2',
          400: '#5c7dc9',
          500: '#3f65bf',
          600: '#2a5298',
          700: '#1b3a6b',
          800: '#102348',
          900: '#060e1f',
        },
        aga: {
          green: '#2D9C45',
          teal:  '#2DD4BF',
        }
      },
      fontFamily: {
        sans:  ['DM Sans', 'sans-serif'],
        title: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
