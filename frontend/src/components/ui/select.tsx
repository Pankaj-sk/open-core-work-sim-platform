import React, { useState } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === SelectTrigger) {
            return child;
          }
          return null;
        })}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-white py-1 shadow-lg">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child, {
                onValueChange: (itemValue: string) => {
                  onValueChange?.(itemValue);
                  setIsOpen(false);
                }
              } as any);
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 opacity-50"
      >
        <path
          d="m4.93179 5.43179c0.20811-0.20811 0.54565-0.20811 0.75376 0l2.81445 2.81445 2.8145-2.81445c0.2081-0.20811 0.5456-0.20811 0.7537 0 0.2081 0.20811 0.2081 0.54565 0 0.75376l-3.1913 3.19131c-0.2081 0.2081-0.5457 0.2081-0.7538 0l-3.19131-3.19131c-0.20811-0.20811-0.20811-0.54565 0-0.75376z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        ></path>
      </svg>
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-gray-500">{placeholder}</span>;
};

export const SelectContent: React.FC<SelectContentProps & { onValueChange?: (value: string) => void }> = ({ 
  children, 
  onValueChange 
}) => {
  return (
    <>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, { onValueChange } as any);
        }
        return child;
      })}
    </>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onValueChange?: (value: string) => void }> = ({ 
  value, 
  children, 
  onValueChange 
}) => {
  return (
    <div
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
};
