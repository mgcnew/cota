import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { designSystem } from "./src/styles/design-system";

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
        // Integrate Design System Colors
        brand: {
          DEFAULT: designSystem.colors.brand.primary,
          primary: designSystem.colors.brand.primary,
          hover: designSystem.colors.brand.hover,
          light: designSystem.colors.brand.light,
        },
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
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-custom': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
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
          'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
          '@screen sm': {
            'transition-duration': '200ms',
          },
        },
        // Disable hover effects on mobile (touch devices)
        // Uses @media (hover: hover) to detect devices with hover capability
        '.hover-desktop': {
          '@media (hover: hover)': {
            '&:hover': {
              'opacity': '0.8',
            },
          },
        },
        // Hover scale effect only on desktop
        '.hover-scale-desktop': {
          '@media (hover: hover)': {
            '&:hover': {
              'transform': 'scale(1.02)',
            },
          },
        },
        // Hover lift effect only on desktop
        '.hover-lift-desktop': {
          '@media (hover: hover)': {
            '&:hover': {
              'transform': 'translateY(-2px)',
              'box-shadow': '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
        },
        // No hover effects class - explicitly disable hover on mobile
        '.no-hover-mobile': {
          '@media (hover: none)': {
            '&:hover': {
              'transform': 'none',
              'box-shadow': 'none',
              'opacity': '1',
            },
          },
        },
        // Active state for touch feedback on mobile
        '.active-mobile': {
          '@media (hover: none)': {
            '&:active': {
              'transform': 'scale(0.98)',
              'opacity': '0.9',
            },
          },
        },
        // ============================================
        // RESPONSIVE TYPOGRAPHY CLASSES
        // Requirements: 8.1, 8.2, 8.3, 8.5
        // ============================================
        
        // Body text responsive - minimum 14px on mobile with proper line-height
        // Requirement: 8.1
        '.text-body-responsive': {
          'font-size': '0.875rem', // 14px mobile
          'line-height': '1.5',
          '@screen sm': {
            'font-size': '1rem', // 16px tablet/desktop
          },
        },
        // Small body text - minimum 14px on mobile
        '.text-body-sm-responsive': {
          'font-size': '0.875rem', // 14px mobile (minimum)
          'line-height': '1.5',
          '@screen sm': {
            'font-size': '0.875rem', // 14px tablet/desktop
          },
        },
        // Heading H1 responsive - 20% reduced on mobile
        // Requirement: 8.2
        '.text-h1-responsive': {
          'font-size': '1.875rem', // 30px mobile (20% smaller than 37.5px)
          'line-height': '1.2',
          'font-weight': '700',
          '@screen sm': {
            'font-size': '2.25rem', // 36px tablet
          },
          '@screen lg': {
            'font-size': '3rem', // 48px desktop
          },
        },
        // Heading H2 responsive - 20% reduced on mobile
        '.text-h2-responsive': {
          'font-size': '1.5rem', // 24px mobile (20% smaller than 30px)
          'line-height': '1.25',
          'font-weight': '700',
          '@screen sm': {
            'font-size': '1.875rem', // 30px tablet
          },
          '@screen lg': {
            'font-size': '2.25rem', // 36px desktop
          },
        },
        // Heading H3 responsive - 20% reduced on mobile
        '.text-h3-responsive': {
          'font-size': '1.25rem', // 20px mobile (20% smaller than 25px)
          'line-height': '1.3',
          'font-weight': '600',
          '@screen sm': {
            'font-size': '1.5rem', // 24px tablet
          },
          '@screen lg': {
            'font-size': '1.875rem', // 30px desktop
          },
        },
        // Heading H4 responsive - 20% reduced on mobile
        '.text-h4-responsive': {
          'font-size': '1.125rem', // 18px mobile (20% smaller than 22.5px)
          'line-height': '1.3',
          'font-weight': '600',
          '@screen sm': {
            'font-size': '1.25rem', // 20px tablet
          },
          '@screen lg': {
            'font-size': '1.5rem', // 24px desktop
          },
        },
        // Label responsive - minimum 12px
        // Requirement: 8.3
        '.text-label-responsive': {
          'font-size': '0.75rem', // 12px mobile (minimum)
          'line-height': '1.4',
          'font-weight': '500',
          '@screen sm': {
            'font-size': '0.875rem', // 14px tablet/desktop
          },
        },
        // Small label - always 12px minimum
        '.text-label-sm-responsive': {
          'font-size': '0.75rem', // 12px (minimum)
          'line-height': '1.4',
          'font-weight': '500',
        },
        // Monetary/numeric values - tabular font for alignment
        // Requirement: 8.5
        '.text-monetary': {
          'font-variant-numeric': 'tabular-nums',
          'font-feature-settings': '"tnum"',
        },
        // Monetary value responsive - tabular font with responsive sizing
        '.text-monetary-responsive': {
          'font-size': '0.875rem', // 14px mobile
          'line-height': '1.5',
          'font-variant-numeric': 'tabular-nums',
          'font-feature-settings': '"tnum"',
          '@screen sm': {
            'font-size': '1rem', // 16px tablet/desktop
          },
        },
        // Large monetary value (for metrics/stats)
        '.text-monetary-lg-responsive': {
          'font-size': '1.5rem', // 24px mobile
          'line-height': '1.2',
          'font-weight': '700',
          'font-variant-numeric': 'tabular-nums',
          'font-feature-settings': '"tnum"',
          '@screen sm': {
            'font-size': '1.875rem', // 30px tablet
          },
          '@screen lg': {
            'font-size': '2.25rem', // 36px desktop
          },
        },
        // Caption text responsive - minimum 12px
        '.text-caption-responsive': {
          'font-size': '0.75rem', // 12px mobile (minimum)
          'line-height': '1.4',
          'color': 'hsl(var(--muted-foreground))',
          '@screen sm': {
            'font-size': '0.75rem', // 12px tablet/desktop
          },
        },
        // Combined mobile-optimized interaction class
        '.interaction-mobile': {
          'transition-duration': '150ms',
          'transition-timing-function': 'cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (hover: none)': {
            '&:active': {
              'transform': 'scale(0.98)',
              'opacity': '0.9',
            },
          },
          '@media (hover: hover)': {
            'transition-duration': '200ms',
            '&:hover': {
              'opacity': '0.8',
            },
          },
        },
        // Disable all animations on mobile for performance
        '.animate-desktop-only': {
          'animation': 'none',
          '@screen sm': {
            'animation': 'inherit',
          },
        },
      });
    }),
  ],
} satisfies Config;
