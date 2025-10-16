import React from 'react';
import FieldError from './FieldError';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, className = '', endAdornment, ...props }, ref) => {
    const baseClasses = "p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary";
    const errorClasses = "border-error focus:ring-error";
    const defaultClasses = "border-border dark:border-slate-600";

    const combinedClasses = `${baseClasses} ${error ? errorClasses : defaultClasses} ${endAdornment ? 'pr-10' : ''} ${className}`;
    
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">{label}</label>}
        <div className="relative">
            <input id={id} ref={ref} className={combinedClasses} {...props} />
            {endAdornment && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {endAdornment}
                </div>
            )}
        </div>
        <FieldError message={error} />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
