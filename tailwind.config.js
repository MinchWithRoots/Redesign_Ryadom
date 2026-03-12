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
        accent: '#F5D5C8',
      },
      borderRadius: {
        'lg': '25px',
        'xl': '30px',
      },
      boxShadow: {
        'soft': '0px 4px 8px rgba(212, 132, 106, 0.15)',
        'card': '0px 4px 20px rgba(0, 0, 0, 0.06)',
        'hover': '0px 12px 24px rgba(0, 0, 0, 0.15)',
      },
      spacing: {
        '128': '32rem',
      },
      animation: {
        'bounce': 'bounce 2s infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
