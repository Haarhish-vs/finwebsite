/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a', // Deep Royal Navy (Flutter Primary)
          950: '#0f172a', // Midnight Slate
        },
        navy: {
          DEFAULT: '#1E3A8A',
          light: '#3B82F6',
          dark: '#0F172A',
          container: '#DBEAFE',
        },
        app: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          divider: '#F1F5F9',
          textPrimary: '#0F172A',
          textSecondary: '#64748B',
          textMuted: '#94A3B8',
        },
        status: {
          success: '#10B981',
          successContainer: '#D1FAE5',
          onSuccessContainer: '#065F46',
          warning: '#F59E0B',
          warningContainer: '#FEF3C7',
          onWarningContainer: '#92400E',
          error: '#EF4444',
          errorContainer: '#FEE2E2',
          onErrorContainer: '#991B1B',
          info: '#0284C7',
          infoContainer: '#E0F2FE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
