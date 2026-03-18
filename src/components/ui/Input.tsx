import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[#33130d] pl-1"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'bg-white rounded-xl px-4 py-3.5 text-[15px] text-[#33130d] placeholder:text-[#33130d]/40 border border-[#33130d]/10 transition-all duration-300 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-[#a41e22]/20 focus:border-[#a41e22]',
            error ? 'border-red-500/50 focus:ring-red-500/20' : 'hover:border-[#33130d]/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
