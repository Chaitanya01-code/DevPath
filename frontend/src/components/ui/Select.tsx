import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string | number
  label: string
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: SelectOption[]
  error?: string
  helperText?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, id, className = '', ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId
    const errorId = `${selectId}-error`

    return (
      <div className="space-y-1.5">
        <label htmlFor={selectId} className="block text-sm font-semibold text-heading">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`min-h-12 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-body outline-none transition-all duration-200 focus:border-teal focus:ring-4 focus:ring-teal/15 aria-[invalid=true]:border-coral disabled:cursor-not-allowed disabled:bg-page ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && <p className="text-xs text-muted">{helperText}</p>}
        {error && (
          <p id={errorId} className="text-sm font-semibold text-heading">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'

export default Select
