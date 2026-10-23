import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

const variants = {
  primary:
    'bg-gradient-brand text-white shadow-md shadow-teal/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/20 focus-visible:ring-teal',
  secondary:
    'border border-teal bg-white text-teal-hover hover:bg-teal-tint focus-visible:ring-teal',
  ghost:
    'text-body hover:bg-teal-tint hover:text-heading focus-visible:ring-teal',
}

const classes =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-60'

export default function Button({
  to,
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classNames = `${classes} ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link className={classNames} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  )
}
