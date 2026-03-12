/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D4846A',
        secondary: '#5D5A88',
        border: '#D3D2E3',
        'light-bg': '#F8F7FC',
      },
      borderRadius: {
        'lg': '25px',
        'xl': '30px',
      },
      boxShadow: {
        'soft': '0px 4px 4px rgba(0, 0, 0, 0.25)',
        'card': '0px 4px 12px rgba(0, 0, 0, 0.08)',
        'hover': '0px 8px 16px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
