import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        nex: {
          yellow: '#FFD400',
          black: '#000000',
          white: '#FFFFFF',
          'yellow-dark': '#E6BF00',
          'yellow-light': '#FFF3A3',
        },
        status: {
          pendente: '#9CA3AF',
          enviado: '#3B82F6',
          aprovado: '#FFD400',
          rejeitado: '#EF4444',
        },
      },
      fontFamily: {
        heading: ['Proxima Nova', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
