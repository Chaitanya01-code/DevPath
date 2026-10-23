/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-page)',
        white: 'var(--color-white)',
        teal: {
          DEFAULT: 'var(--color-teal)',
          hover: 'var(--color-teal-hover)',
          tint: 'var(--color-tint-teal)',
        },
        violet: {
          DEFAULT: 'var(--color-violet)',
          tint: 'var(--color-tint-violet)',
        },
        coral: {
          DEFAULT: 'var(--color-coral)',
          tint: 'var(--color-tint-coral)',
        },
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        footer: 'var(--color-footer)',
        mint: 'var(--color-tint-mint)',
      },
      boxShadow: {
        soft: '0 18px 48px -28px rgb(20 184 166 / 34%), 0 12px 24px -20px rgb(139 92 246 / 28%)',
      },
    },
  },
  plugins: [],
}
