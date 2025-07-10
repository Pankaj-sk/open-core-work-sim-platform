import * as React from "react"
import { cn } from "../../lib/utils"

interface CollapsibleContextValue {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue>({})

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open, onOpenChange, children, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = open !== undefined
    const isOpen = isControlled ? open : internalOpen

    const handleToggle = () => {
      if (isControlled) {
        onOpenChange?.(!open)
      } else {
        setInternalOpen(prev => !prev)
      }
    }

    return (
      <CollapsibleContext.Provider value={{ open: isOpen, onOpenChange: handleToggle }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, onClick, asChild = false, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      context.onOpenChange?.(!context.open)
      onClick?.(event)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        onClick: handleClick,
        className: cn(className, (children as any).props.className),
      })
    }

    return (
      <button
        ref={ref}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = React.useContext(CollapsibleContext)

    if (!open) return null

    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
