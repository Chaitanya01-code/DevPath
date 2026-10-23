import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-semibold text-heading">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-12 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-body outline-none transition-all duration-200 placeholder:text-muted/75 focus:border-teal focus:ring-4 focus:ring-teal/15 aria-[invalid=true]:border-coral ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
