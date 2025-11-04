import React from 'react';

interface FieldErrorProps {
    message?: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ message }) => {
    if (!message) {
        return null;
    }

    return (
        <p className="text-error text-xs mt-1">{message}</p>
    );
};

export default FieldError;
