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
      // Read from CSS variables so a page can switch its type: :root sets Unbounded + Hind, and the
      // modern look (.ez-modern in index.css) sets Space Grotesk + Inter.
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        sans: ["var(--font-body)"],
      },
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
        ink: "hsl(var(--ink))",
        cream: "hsl(var(--cream))",
        sand: "hsl(var(--sand))",
        pink: "hsl(var(--pink))",
        sun: "hsl(var(--sun))",
        teal: "hsl(var(--teal))",
        sky: "hsl(var(--sky))",
        lime: "hsl(var(--lime))",
        coral: "hsl(var(--coral))",
        gold: {
          DEFAULT: "hsl(45 100% 50%)",
          light: "hsl(45 100% 65%)",
          dark: "hsl(35 100% 45%)",
        },
      },
      boxShadow: {
        // Every shadow is a hard offset "block" shadow in ink, so older components match the new style.
        sm: "2px 2px 0 0 hsl(0 0% 7%)",
        DEFAULT: "3px 3px 0 0 hsl(0 0% 7%)",
        md: "3px 3px 0 0 hsl(0 0% 7%)",
        lg: "5px 5px 0 0 hsl(0 0% 7%)",
        xl: "7px 7px 0 0 hsl(0 0% 7%)",
        "2xl": "7px 7px 0 0 hsl(0 0% 7%)",
        "block-sm": "var(--shadow-block-sm)",
        block: "var(--shadow-block)",
        "block-lg": "var(--shadow-block-lg)",
        // Soft shadows for the modern look (Tailwind's own defaults, since the names above are taken).
        "soft-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "soft-md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "soft-lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "soft-xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "soft-2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "ep-bob": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 3s ease-in-out infinite",
        marquee: "marquee 70s linear infinite",
        "ep-bob": "ep-bob 3.4s ease-in-out infinite",
        "float-slow": "float-slow 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;