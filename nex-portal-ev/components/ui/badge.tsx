import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-nex-yellow border-nex-yellow text-nex-black',
        secondary: 'bg-gray-100 border-gray-200 text-gray-600',
        destructive: 'bg-red-50 border-red-200 text-red-700',
        pendente: 'bg-gray-100 border-gray-200 text-gray-600',
        enviado: 'bg-blue-50 border-blue-200 text-blue-700',
        aprovado: 'bg-yellow-50 border-nex-yellow text-yellow-800',
        rejeitado: 'bg-red-50 border-red-200 text-red-700',
        completo: 'bg-green-50 border-green-200 text-green-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
