import React from 'react';

// FIX: Extend React.HTMLAttributes<HTMLElement> to allow standard HTML props like onClick and draggable.
interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

// FIX: Spread additional props to the underlying component.
const Card: React.FC<CardProps> = ({ children, className = '', as: Component = 'div', ...props }) => {
  const cardClasses = `bg-surface dark:bg-dark rounded-lg shadow-md ${className}`;
  return <Component className={cardClasses} {...props}>{children}</Component>;
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`border-b border-border dark:border-slate-700 p-6 ${className}`}>
        {typeof children === 'string' ? <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100">{children}</h3> : children}
    </div>
}

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`p-6 ${className}`}>{children}</div>
}

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`border-t border-border dark:border-slate-700 p-6 ${className}`}>{children}</div>
}


export default Card;