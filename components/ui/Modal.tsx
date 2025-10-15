import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-surface dark:bg-dark rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-text-primary dark:text-slate-100">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-2xl text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;