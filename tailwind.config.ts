import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Discreet Concierge - UX Psychology Colors
        discreet: {
          // Cores Base (Escuras = Confidencialidade)
          void: '#0a0a0f',      // Fundo principal - noir absoluto
          deep: '#0f0f17',      // Fundo secundário
          surface: '#1a1a2e',   // Cards e containers
          
          // Bordas e Divisores
          border: '#2d3748',    // Borda padrão
          'border-hover': '#4a5568', // Borda hover
          
          // Accent (Vermelho = Urgência controlada)
          accent: '#e94560',    // CTA principal
          'accent-hover': '#d63d56',
          'accent-muted': '#e94560',
          
          // Texto
          'text-primary': '#ffffff',
          'text-secondary': '#a0aec0',
          'text-muted': '#718096',
          
          // Status
          'status-success': '#48bb78',
          'status-warning': '#ecc94b',
          'status-danger': '#f56565',
          'status-info': '#4299e1',
          
          // Privacy Levels
          'privacy-normal': '#4299e1',
          'privacy-discreet': '#9f7aea',
          'privacy-notrace': '#e94560',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
