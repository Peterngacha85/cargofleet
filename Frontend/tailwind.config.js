/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1F2937',
        lime: '#A3E635',
        'soft-gray': '#F3F4F6',
      },
    },
  },
  plugins: [],
};
