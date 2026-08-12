import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-0 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-8 px-3 py-1.5 has-[>svg]:px-2.5',
        xs: "h-5 gap-1 rounded px-2 text-[11px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-7 rounded-md gap-1.5 px-2.5 text-xs has-[>svg]:px-2',
        lg: 'h-9 rounded-md px-4 has-[>svg]:px-3',
        icon: 'size-8',
        'icon-xs': "size-5 rounded [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7',
        'icon-lg': 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
