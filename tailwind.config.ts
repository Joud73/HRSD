import type { Config } from "tailwindcss";

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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          "light-foreground": "hsl(var(--primary-light-foreground))",
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
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))",
        },
        ink: "hsl(var(--ink))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          ink: "hsl(var(--warning-ink))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          foreground: "hsl(var(--neutral-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "section-alt": "hsl(var(--section-alt))",
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
      // Type scale (brief principle 4)
      fontSize: {
        display: ["3rem", { lineHeight: "3.75rem" }], // 48/60
        h1: ["2.25rem", { lineHeight: "3rem" }], // 36/48
        h2: ["1.75rem", { lineHeight: "2.5rem" }], // 28/40
        h3: ["1.25rem", { lineHeight: "1.875rem" }], // 20/30
        body: ["1rem", { lineHeight: "1.75rem" }], // 16/28
        small: ["0.875rem", { lineHeight: "1.375rem" }], // 14/22
        caption: ["0.75rem", { lineHeight: "1.125rem" }], // 12/18
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        // One shadow level, for floating layers only. Cards use a border.
        none: "none",
        sm: "none",
        DEFAULT: "none",
        md: "var(--shadow-float)",
        lg: "var(--shadow-float)",
        xl: "var(--shadow-float)",
        "2xl": "var(--shadow-float)",
        float: "var(--shadow-float)",
      },
      // tailwindcss-animate defaults (menus, dialogs, sheets, tooltips)
      animationDuration: {
        DEFAULT: "240ms",
      },
      animationTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionDuration: {
        micro: "150ms",
        ui: "240ms",
        reveal: "420ms",
      },
      fontFamily: {
        sans: ["HRSDGov-Medium", "Segoe UI", "Tahoma", "sans-serif"],
        hrsd: ["HRSDGov-Regular", "Segoe UI", "Tahoma", "sans-serif"],
        "hrsd-title": ["HRSDGov-Title", "HRSDGov-Bold", "Segoe UI", "Tahoma", "sans-serif"],
        "hrsd-bold": ["HRSDGov-Bold", "Segoe UI", "Tahoma", "sans-serif"],
        "hrsd-semibold": ["HRSDGov-SemiBold", "Segoe UI", "Tahoma", "sans-serif"],
        "hrsd-medium": ["HRSDGov-Medium", "Segoe UI", "Tahoma", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)", // 12px cards
        md: "calc(var(--radius) - 4px)", // 8px buttons, inputs
        sm: "calc(var(--radius) - 6px)",
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
        "accordion-down": "accordion-down 240ms cubic-bezier(0.2, 0, 0, 1)",
        "accordion-up": "accordion-up 240ms cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
