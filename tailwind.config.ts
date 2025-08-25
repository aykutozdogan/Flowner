import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          50: "var(--primary-50)",
          500: "var(--primary-500)",
          700: "var(--primary-700)",
          900: "var(--primary-900)",
          DEFAULT: "var(--primary-500)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          100: "var(--secondary-100)",
          500: "var(--secondary-500)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)",
          DEFAULT: "var(--secondary-500)",
          foreground: "hsl(0 0% 100%)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        // Status colors
        success: {
          main: "var(--success-main)",
          light: "var(--success-light)",
        },
        warning: {
          main: "var(--warning-main)",
          light: "var(--warning-light)",
        },
        error: {
          main: "var(--error-main)",
          light: "var(--error-light)",
        },
        // Gray scale
        gray: {
          50: "hsl(220, 13%, 98%)",
          100: "hsl(220, 14%, 96%)",
          200: "hsl(220, 13%, 91%)",
          300: "hsl(216, 12%, 84%)",
          400: "hsl(218, 11%, 65%)",
          500: "hsl(220, 9%, 46%)",
          600: "hsl(215, 14%, 34%)",
          700: "hsl(217, 19%, 27%)",
          800: "hsl(215, 28%, 17%)",
          900: "hsl(221, 39%, 11%)",
        },
        // Blue scale (primary)
        blue: {
          50: "hsl(207, 90%, 96%)",
          100: "hsl(207, 90%, 91%)",
          200: "hsl(207, 90%, 83%)",
          300: "hsl(207, 90%, 72%)",
          400: "hsl(207, 90%, 63%)",
          500: "hsl(207, 90%, 54%)",
          600: "hsl(207, 90%, 48%)",
          700: "hsl(207, 90%, 42%)",
          800: "hsl(207, 90%, 36%)",
          900: "hsl(207, 100%, 26%)",
        },
        // Green scale
        green: {
          50: "hsl(120, 44%, 94%)",
          100: "hsl(120, 43%, 89%)",
          200: "hsl(120, 43%, 79%)",
          300: "hsl(120, 42%, 69%)",
          400: "hsl(122, 40%, 59%)",
          500: "hsl(122, 39%, 49%)",
          600: "hsl(122, 39%, 41%)",
          700: "hsl(122, 39%, 33%)",
          800: "hsl(122, 39%, 25%)",
          900: "hsl(122, 47%, 15%)",
        },
        // Orange scale
        orange: {
          50: "hsl(35, 100%, 95%)",
          100: "hsl(35, 100%, 90%)",
          200: "hsl(35, 100%, 80%)",
          300: "hsl(35, 100%, 70%)",
          400: "hsl(35, 100%, 60%)",
          500: "hsl(35, 100%, 50%)",
          600: "hsl(35, 100%, 45%)",
          700: "hsl(35, 100%, 40%)",
          800: "hsl(35, 100%, 35%)",
          900: "hsl(35, 84%, 24%)",
        },
        // Red scale
        red: {
          50: "hsl(0, 100%, 97%)",
          100: "hsl(0, 100%, 94%)",
          200: "hsl(0, 100%, 89%)",
          300: "hsl(0, 100%, 83%)",
          400: "hsl(0, 91%, 71%)",
          500: "hsl(0, 84%, 60%)",
          600: "hsl(0, 72%, 51%)",
          700: "hsl(0, 74%, 42%)",
          800: "hsl(0, 70%, 35%)",
          900: "hsl(0, 63%, 31%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        material: "var(--shadow-material)",
        "material-lg": "var(--shadow-material-lg)",
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
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
      },
      spacing: {
        "material-xs": "var(--spacing-xs)",
        "material-sm": "var(--spacing-sm)",
        "material-md": "var(--spacing-md)",
        "material-lg": "var(--spacing-lg)",
        "material-xl": "var(--spacing-xl)",
      },
      gridTemplateColumns: {
        dashboard: "repeat(auto-fit, minmax(280px, 1fr))",
        "dashboard-sidebar": "256px 1fr",
        "dashboard-main": "1fr 2fr",
        "stats": "repeat(auto-fit, minmax(200px, 1fr))",
      },
      screens: {
        xs: "475px",
        "3xl": "1600px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for Material Design utilities
    function({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.transition-material': {
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.hover-lift': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--shadow-lg)',
          },
        },
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 2px var(--ring)',
          },
        },
        '.text-balance': {
          textWrap: 'balance',
        },
      });
    },
  ],
} satisfies Config;
