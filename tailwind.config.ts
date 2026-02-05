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
        // === 主题色（红白极简）===
        'wf-crimson': '#C5050C',      // UW Red - logo + CTA
        'wf-crimson-dark': '#9B0000',  // Hover state
        'wf-crimson-light': '#D93036', // Light accent
        
        // === 旧配色别名（向后兼容，逐步迁移）===
        'uw-red': '#C5050C',          // → 使用 wf-crimson
        'uw-dark': '#9B0000',         // → 使用 wf-crimson-dark
        'uw-light': '#D93036',        // → 使用 wf-crimson-light
        
        // === 表面色 ===
        'surface': {
          primary: '#FFFFFF',
          secondary: '#F8F9FA',
          tertiary: '#E9ECEF',
        },
        
        // === 文字色 ===
        'text': {
          primary: '#212529',
          secondary: '#6C757D',
          tertiary: '#ADB5BD',
        },
        
        // === 数据可视化（柔和渐变 - Tailwind 标准色）===
        'grade': {
          excellent: '#10B981',  // emerald-500
          good: '#34D399',       // emerald-400
          average: '#FBBF24',    // amber-400
          below: '#FB923C',      // orange-400
          poor: '#EF4444',       // red-500
        },
        
        // === 功能色 ===
        'success': '#10B981',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
        
        // === 交互状态 ===
        'hover-bg': '#F1F5F9',      // slate-100
        'active-bg': '#FEF2F2',     // red-50
        'focus-ring': '#C5050C33',  // crimson 20% opacity
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
export default config