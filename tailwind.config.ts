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
        "pink-hover": "hsl(var(--pink-hover))",
        sun: "hsl(var(--sun))",
        teal: "hsl(var(--teal))",
        sky: "hsl(var(--sky))",
        lime: "hsl(var(--lime))",
        coral: "hsl(var(--coral))",
        "accent-yellow": "hsl(var(--accent-yellow))",
        "accent-lime": "hsl(var(--accent-lime))",
        gold: {
          DEFAULT: "hsl(45 100% 50%)",
          light: "hsl(45 100% 65%)",
          dark: "hsl(35 100% 45%)",
        },
        // Neo-brutalist rebrand: every page's literal bg-orange-*/text-orange-*/bg-amber-* class
        // (the old #EA580C-orange "modern" primary and its gradient partner) now resolves to the
        // brand pink (#F472D0, anchored at 600/700 — the shades this codebase's buttons use) and
        // brand yellow (#FACC15, anchored at 500) instead, with no per-file sweep needed. zinc stays
        // Tailwind's own neutral gray scale (still correct for text/border hierarchy); rose stays red
        // (favourites, destructive) and emerald/green stay green (success) — explicitly kept semantic.
        orange: {
          50: "#f9f6f8", 100: "#f5eaf2", 200: "#f2d4ea", 300: "#f1b1df", 400: "#f391d7",
          500: "#f580d4", 600: "#f472cf", 700: "#e85bc0", 800: "#de35ae", 900: "#bc2491", 950: "#7a1f60",
        },
        amber: {
          50: "#fefbf0", 100: "#fef7dd", 200: "#fdf1bf", 300: "#fce897", 400: "#fcda55",
          500: "#facc15", 600: "#e7bb08", 700: "#bd9a0f", 800: "#9a7f13", 900: "#756215", 950: "#493e12",
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
        // "Soft" shadows for the modern look (named separately since "sm"/"DEFAULT"/etc. above are
        // taken) — neo-brutalist rebrand: these are now hard offset "block" shadows too, in the
        // theme-aware --shadow-block-* variables (black border in light mode, cream in dark mode),
        // so every modern-look card/button that used shadow-soft-* picked this up with no file sweep.
        "soft-sm": "var(--shadow-block-sm)",
        soft: "var(--shadow-block-sm)",
        "soft-md": "var(--shadow-block)",
        "soft-lg": "var(--shadow-block)",
        "soft-xl": "var(--shadow-block-lg)",
        "soft-2xl": "var(--shadow-block-lg)",
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