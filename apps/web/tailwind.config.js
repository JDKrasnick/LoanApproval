/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#1D4ED8',
          700: '#1E3A8A',
          900: '#1E293B',
          950: '#060F2A',
        },
        status: {
          new:       '#6B7280',
          reviewing: '#F59E0B',
          approved:  '#10B981',
          funded:    '#8B5CF6',
          declined:  '#EF4444',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'metric':    ['2.25rem', { lineHeight: '1', fontWeight: '700' }],
        'metric-sm': ['1.5rem',  { lineHeight: '1', fontWeight: '600' }],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
