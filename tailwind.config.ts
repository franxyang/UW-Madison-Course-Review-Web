import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'uw-red': '#c5050c',
        'uw-light': '#d93036',
        'uw-dark': '#9b0000',
        'grade-a': 'rgb(34, 197, 94)',    // green-500
        'grade-ab': 'rgb(74, 222, 128)',  // green-400
        'grade-b': 'rgb(59, 130, 246)',   // blue-500
        'grade-bc': 'rgb(96, 165, 250)',  // blue-400
        'grade-c': 'rgb(250, 204, 21)',   // yellow-400
        'grade-d': 'rgb(251, 146, 60)',   // orange-400
        'grade-f': 'rgb(239, 68, 68)',    // red-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
export default config