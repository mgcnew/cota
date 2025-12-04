import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))", // #7C3AED
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          lighter: "hsl(var(--primary-lighter))",
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
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-success': 'linear-gradient(135deg, hsl(var(--success)), hsl(158 64% 62%))',
        'gradient-warning': 'linear-gradient(135deg, hsl(var(--warning)), hsl(38 92% 60%))',
        'gradient-error': 'linear-gradient(135deg, hsl(var(--error)), hsl(0 84% 70%))',
        'gradient-info': 'linear-gradient(135deg, hsl(var(--info)), hsl(251 91% 77%))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
      boxShadow: {
        'glow-primary': '0 0 20px hsl(var(--primary) / 0.3)',
        'glow-success': '0 0 20px hsl(var(--success) / 0.3)',
        'glow-warning': '0 0 20px hsl(var(--warning) / 0.3)',
        'glow-error': '0 0 20px hsl(var(--error) / 0.3)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Mobile responsiveness utility classes plugin
    // Requirements: 7.1, 9.1, 9.2
    plugin(function({ addUtilities }) {
      addUtilities({
        // Touch target - minimum 44x44px for accessible touch interactions
        // Requirement: 7.1
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        // Responsive padding - adapts to screen size
        // Requirement: 9.1
        '.p-responsive': {
          'padding': '0.75rem', // 12px mobile
          '@screen sm': {
            'padding': '1rem', // 16px tablet
          },
          '@screen lg': {
            'padding': '1.5rem', // 24px desktop
          },
        },
        // Responsive horizontal padding for page layouts
        // Requirement: 9.1
        '.px-responsive': {
          'padding-left': '1rem', // 16px mobile
          'padding-right': '1rem',
          '@screen sm': {
            'padding-left': '1.5rem', // 24px tablet
            'padding-right': '1.5rem',
          },
          '@screen lg': {
            'padding-left': '2rem', // 32px desktop
            'padding-right': '2rem',
          },
        },
        // Responsive vertical padding
        '.py-responsive': {
          'padding-top': '0.75rem', // 12px mobile
          'padding-bottom': '0.75rem',
          '@screen sm': {
            'padding-top': '1rem', // 16px tablet
            'padding-bottom': '1rem',
          },
          '@screen lg': {
            'padding-top': '1.5rem', // 24px desktop
            'padding-bottom': '1.5rem',
          },
        },
        // Responsive gap - adapts spacing between elements
        // Requirement: 9.2
        '.gap-responsive': {
          'gap': '0.5rem', // 8px mobile
          '@screen sm': {
            'gap': '1rem', // 16px tablet
          },
          '@screen lg': {
            'gap': '1.5rem', // 24px desktop
          },
        },
        // Responsive text - body text with minimum 14px on mobile
        // Requirement: 8.1
        '.text-responsive': {
          'font-size': '0.875rem', // 14px mobile
          'line-height': '1.5',
          '@screen sm': {
            'font-size': '1rem', // 16px tablet/desktop
          },
        },
        // Responsive heading - scales down 20% on mobile
        // Requirement: 8.2
        '.heading-responsive': {
          'font-size': '1.125rem', // 18px mobile (20% smaller than 22.5px)
          'line-height': '1.3',
          '@screen sm': {
            'font-size': '1.25rem', // 20px tablet
          },
          '@screen lg': {
            'font-size': '1.5rem', // 24px desktop
          },
        },
        // Large heading responsive
        '.heading-lg-responsive': {
          'font-size': '1.5rem', // 24px mobile
          'line-height': '1.2',
          '@screen sm': {
            'font-size': '1.875rem', // 30px tablet
          },
          '@screen lg': {
            'font-size': '2.25rem', // 36px desktop
          },
        },
        // Responsive label - minimum 12px
        // Requirement: 8.3
        '.label-responsive': {
          'font-size': '0.75rem', // 12px mobile
          '@screen sm': {
            'font-size': '0.875rem', // 14px tablet/desktop
          },
        },
        // Section gap - spacing between page sections
        // Requirement: 9.2
        '.section-gap': {
          'margin-bottom': '1rem', // 16px mobile
          '@screen sm': {
            'margin-bottom': '1.25rem', // 20px tablet
          },
          '@screen lg': {
            'margin-bottom': '1.5rem', // 24px desktop
          },
        },
        // Card padding responsive
        '.card-padding': {
          'padding': '0.75rem', // 12px mobile
          '@screen sm': {
            'padding': '1rem', // 16px tablet
          },
          '@screen lg': {
            'padding': '1.5rem', // 24px desktop
          },
        },
        // Mobile-optimized animations - shorter duration
        // Requirement: 6.1
        '.transition-mobile': {
          'transition-duration': '150ms',
          '@screen sm': {
            'transition-duration': '200ms',
          },
        },
        // Disable hover effects on mobile (touch devices)
        '.hover-desktop': {
          '@media (hover: hover)': {
            '&:hover': {
              'opacity': '0.8',
            },
          },
        },
      });
    }),
  ],
} satisfies Config;
