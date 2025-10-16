import React from 'react';
import FieldError from './FieldError';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, id, error, className = '', ...props }, ref) => {
    const baseClasses = "p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary";
    const errorClasses = "border-error focus:ring-error";
    const defaultClasses = "border-border dark:border-slate-600";
    
    const combinedClasses = `${baseClasses} ${error ? errorClasses : defaultClasses} ${className}`;

    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">{label}</label>}
        <textarea id={id} ref={ref} className={combinedClasses} {...props} />
        <FieldError message={error} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
