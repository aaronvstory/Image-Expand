
import React, { createContext, useContext, useState } from 'react';

interface TooltipContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{ children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }> = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const contextValue = {
    open: isControlled ? open : internalOpen,
    setOpen: isControlled ? onOpenChange : setInternalOpen,
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const context = useContext(TooltipContext);
  if (!context) return <>{children}</>;

  const { setOpen } = context;

  const triggerProps = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps);
  }

  return <div {...triggerProps}>{children}</div>;
};

export const TooltipContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const context = useContext(TooltipContext);
  if (!context) return null;
  const { open } = context;

  return (
    <div
      className={`absolute z-50 w-max max-w-xs p-2 text-sm rounded-md shadow-lg 
                 bg-popover text-popover-foreground border border-border
                 bottom-full mb-2 left-1/2 -translate-x-1/2
                 transition-opacity duration-200
                 ${open ? 'opacity-100 visible' : 'opacity-0 invisible'}
                 ${className}`}
    >
      {children}
    </div>
  );
};
