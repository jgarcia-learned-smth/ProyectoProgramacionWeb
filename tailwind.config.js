/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        voltage: '#FAD749',
        spark: '#FFE889',
        ground: '#D8D5CB',
        carbon: '#2A2821',
        paper: '#F8F7F3',
      },
      boxShadow: {
        card: '0 4px 14px rgba(42, 40, 33, 0.06)',
        voltage: '0 0 0 4px rgba(250, 215, 73, 0.2)',
      },
      keyframes: {
        static: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(250, 215, 73, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(250, 215, 73, 0.28)' },
        },
      },
      animation: {
        static: 'static 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
