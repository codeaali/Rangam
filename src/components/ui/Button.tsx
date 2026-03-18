import { cn } from '../../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#a41e22]/50 focus:ring-offset-2 focus:ring-offset-[#f9f0e7] disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-[#a41e22] text-white hover:bg-[#8a191c] active:scale-[0.98] shadow-md shadow-[#a41e22]/20 hover:shadow-lg hover:shadow-[#a41e22]/30': variant === 'primary',
          'bg-transparent text-[#33130d] hover:bg-[#33130d]/5': variant === 'ghost',
          'bg-red-600/90 text-white hover:bg-red-700': variant === 'danger',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5 text-sm': size === 'md',
          'px-7 py-3.5 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing…
        </>
      ) : children}
    </button>
  );
}
