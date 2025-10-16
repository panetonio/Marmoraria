import React from 'react';
import FieldError from './FieldError';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, error, className = '', children, ...props }, ref) => {
    const baseClasses = "p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary h-[42px] appearance-none pr-8";
    const errorClasses = "border-error focus:ring-error";
    const defaultClasses = "border-border dark:border-slate-600";

    const combinedClasses = `${baseClasses} ${error ? errorClasses : defaultClasses} ${className}`;
    
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">{label}</label>}
        <div className="relative">
            <select id={id} ref={ref} className={combinedClasses} {...props}>
            {children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary dark:text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
        <FieldError message={error} />
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
