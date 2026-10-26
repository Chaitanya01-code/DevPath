import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line/90 bg-white shadow-card transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
