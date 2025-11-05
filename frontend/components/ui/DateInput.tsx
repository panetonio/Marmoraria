import React, { useState, useEffect, useRef } from 'react';
import FieldError from './FieldError';
import { formatDate, parseDateToISO } from '../../utils/dateFormat';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: string; // Formato ISO (YYYY-MM-DD) ou vazio
  onChange?: (value: string) => void; // Retorna formato ISO (YYYY-MM-DD)
  placeholder?: string;
}

// Converter de DD/MM/YYYY para YYYY-MM-DD usando utilitário
const formatToISO = (value: string): string | null => {
  if (!value || value.trim() === '') return null;
  
  // Se já está no formato YYYY-MM-DD, retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // Usar utilitário para converter DD/MM/AAAA
  const iso = parseDateToISO(value);
  return iso || null;
};

// Converter de YYYY-MM-DD para DD/MM/YYYY usando utilitário
const formatToDisplay = (value: string | null | undefined): string => {
  if (!value || value.trim() === '') return '';
  
  // Usar utilitário para formatar
  return formatDate(value);
};

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, id, error, className = '', value, onChange, placeholder = 'DD/MM/AAAA', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const displayInputRef = useRef<HTMLInputElement>(null);
    
    // Atualizar valor de exibição quando o valor prop mudar
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatToDisplay(value));
      }
    }, [value, isFocused]);
    
    // Inicializar valor de exibição
    useEffect(() => {
      setDisplayValue(formatToDisplay(value));
    }, []);
    
    const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      // Tentar converter para ISO quando o usuário terminar de digitar
      const isoValue = formatToISO(inputValue);
      if (isoValue && onChange) {
        onChange(isoValue);
      }
    };
    
    const handleDisplayBlur = () => {
      setIsFocused(false);
      
      // Tentar converter o valor digitado
      const isoValue = formatToISO(displayValue);
      if (isoValue) {
        setDisplayValue(formatToDisplay(isoValue));
        if (onChange) {
          onChange(isoValue);
        }
      } else if (displayValue.trim() !== '') {
        // Se não conseguiu converter mas há valor, limpar
        setDisplayValue(formatToDisplay(value));
      }
    };
    
    const handleDisplayFocus = () => {
      setIsFocused(true);
    };
    
    const handleDisplayClick = () => {
      // Ao clicar no campo de exibição, abrir o seletor de datas
      if (dateInputRef.current) {
        // Tentar usar showPicker() se disponível (Chrome, Edge, Safari 16+)
        if (typeof dateInputRef.current.showPicker === 'function') {
          try {
            dateInputRef.current.showPicker();
          } catch (error) {
            // Se showPicker falhar, focar no input para abrir o calendário
            dateInputRef.current.focus();
            dateInputRef.current.click();
          }
        } else {
          // Fallback: focar e clicar no input de data
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      }
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoValue = e.target.value;
      setDisplayValue(formatToDisplay(isoValue));
      if (onChange) {
        onChange(isoValue);
      }
    };
    
    const baseClasses = "p-2 border rounded w-full bg-slate-50 dark:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary";
    const errorClasses = "border-error focus:ring-error";
    const defaultClasses = "border-border dark:border-slate-600";
    
    const combinedClasses = `${baseClasses} ${error ? errorClasses : defaultClasses} ${className}`;
    
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary dark:text-slate-400 mb-1">{label}</label>}
        <div className="relative">
          {/* Input de exibição DD/MM/YYYY */}
          <input
            ref={displayInputRef}
            id={id}
            type="text"
            className={`${combinedClasses} pr-20`}
            value={displayValue}
            onChange={handleDisplayChange}
            onBlur={handleDisplayBlur}
            onFocus={handleDisplayFocus}
            onClick={handleDisplayClick}
            placeholder={placeholder}
            maxLength={10}
            autoComplete="off"
            {...props}
          />
          {/* Input de data oculto para o calendário - posicionado sobre o input de exibição */}
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
              }
              dateInputRef.current = node;
            }}
            type="date"
            className="absolute inset-0 opacity-0 cursor-pointer"
            style={{ width: '100%', height: '100%' }}
            value={value || ''}
            onChange={handleDateChange}
            onFocus={(e) => {
              // Manter o foco no input de exibição visualmente
              displayInputRef.current?.focus();
            }}
          />
          {/* Ícone de calendário */}
          <div 
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            onClick={handleDisplayClick}
            role="button"
            aria-label="Abrir calendário"
          >
            <svg 
              className="w-5 h-5 text-text-secondary dark:text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>
        <FieldError message={error} />
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export default DateInput;

