import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const baseStyles =
      'w-full min-h-[44px] px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent text-greige-900 dark:text-greige-100';

    const stateStyles = error
      ? 'border-terracotta bg-red-50 dark:bg-red-900/20 focus:ring-terracotta'
      : 'border-greige-300 dark:border-greige-600 bg-white dark:bg-greige-700 hover:border-greige-400 dark:hover:border-greige-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-greige-700 dark:text-greige-300 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${stateStyles} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-terracotta" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
