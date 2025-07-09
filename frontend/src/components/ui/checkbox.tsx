import * as React from "react"
import { Check } from "lucide-react"

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, disabled, ...props }, ref) => (
    <div className="relative">
      <input
        type="checkbox"
        ref={ref}
        id={id}
        checked={checked || false}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={`
          h-4 w-4 shrink-0 rounded-sm border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white'}
          ${className || ''}
        `}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        {checked && (
          <Check className="h-4 w-4 text-white" />
        )}
      </div>
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
