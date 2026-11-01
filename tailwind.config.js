/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#0a0a0c',
        panel: '#101015',
        panel2: '#1a1a22',
        line: '#2c2436',
        fg: '#e9e6ef',
        mute: '#b2a7c0',
        pulse: '#9333ea',
        z1: '#5bc0eb',
        z2: '#4ade80',
        z3: '#facc15',
        z4: '#fb923c',
        z5: '#ef4444',
      },
    },
  },
  plugins: [],
}
