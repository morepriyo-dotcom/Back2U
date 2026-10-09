/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#04070F',
          900: '#070B14',
          850: '#0A101F',
          800: '#0E172A',
          700: '#15223E',
          600: '#1D2F54',
        },
        card: {
          bg: '#0B1325',
          surface: '#0F1A33',
          border: 'rgba(59, 130, 246, 0.18)',
          hover: 'rgba(59, 130, 246, 0.28)',
        },
        brand: {
          blue: '#2563EB',
          electric: '#3B82F6',
          cyan: '#38BDF8',
          glow: '#60A5FA',
          purple: '#7C3AED',
          indigo: '#6366F1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'blue-glow': '0 0 25px -5px rgba(59, 130, 246, 0.35)',
        'blue-rim': '0 0 12px 1px rgba(59, 130, 246, 0.25)',
        'card-glow': '0 10px 30px -10px rgba(7, 11, 20, 0.8), 0 0 15px -3px rgba(37, 99, 235, 0.15)',
        'button-glow': '0 0 20px 2px rgba(37, 99, 235, 0.45)',
      },
      animation: {
        'float-slow': 'float 12s ease-in-out infinite',
        'float-medium': 'float 8s ease-in-out infinite',
        'float-fast': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 10s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 4s ease-in-out infinite',
        'spin-very-slow': 'spin 40s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(3deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-3deg)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
