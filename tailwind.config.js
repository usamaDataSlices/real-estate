/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F3D3E',
          light: '#1B5E5F',
          dark: '#0A2B2C',
        },
        accent: {
          DEFAULT: '#C9A25D',
          light: '#DDBB7E',
          dark: '#A9813F',
        },
        neutral: {
          50: '#FAFAF8',
          100: '#F2F1ED',
          200: '#E4E2DB',
          600: '#6B6B63',
          900: '#1F1E1B',
        },
        success: '#3D8361',
        warning: '#C9822E',
        danger: '#B23A3A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Fraunces', 'Poppins', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        xl: '1rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  plugins: [],
}
