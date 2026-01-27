/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontSize: {
  			// Override default sizes to scale with --font-scale for accessibility
  			xs: 'calc(0.75rem * var(--font-scale, 1))',
  			sm: 'calc(0.875rem * var(--font-scale, 1))',
  			base: 'calc(1rem * var(--font-scale, 1))',
  			lg: 'calc(1.125rem * var(--font-scale, 1))',
  			xl: 'calc(1.25rem * var(--font-scale, 1))',
  			'2xl': 'calc(1.5rem * var(--font-scale, 1))',
  			'3xl': 'calc(1.875rem * var(--font-scale, 1))',
  			'4xl': 'calc(2.25rem * var(--font-scale, 1))',
  			// Custom sizes
  			display: [
  				'calc(3rem * var(--font-scale, 1))',
  				{
  					lineHeight: '1.1',
  					fontWeight: '700',
  					letterSpacing: '-0.02em'
  				}
  			],
  			headline: [
  				'calc(1.75rem * var(--font-scale, 1))',
  				{
  					lineHeight: '1.2',
  					fontWeight: '600',
  					letterSpacing: '-0.01em'
  				}
  			],
  			title: [
  				'calc(1.25rem * var(--font-scale, 1))',
  				{
  					lineHeight: '1.3',
  					fontWeight: '600'
  				}
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}