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
        // TEMP aliases until step 3 replaces bg-section-* usages
        section: {
          light: "hsl(var(--surface))",
          tealLight: "hsl(var(--primary) / 0.08)",
        },
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
      // Type scale (CLAUDE.md / frontend-design skill)
      fontSize: {
        display: ["3rem", { lineHeight: "1.25" }], // 48/60
        "display-sm": ["2rem", { lineHeight: "1.25" }], // 32/40
        h2: ["1.75rem", { lineHeight: "2.25rem" }], // 28/36
        h3: ["1.25rem", { lineHeight: "1.75rem" }], // 20/28
        lead: ["1.125rem", { lineHeight: "1.875rem" }], // 18/30
        body: ["1rem", { lineHeight: "1.625rem" }], // 16/26
        small: ["0.875rem", { lineHeight: "1.25rem" }], // 14/20
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "count-up": "count-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
