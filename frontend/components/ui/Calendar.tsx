import React, { useState, useMemo } from 'react';

interface CalendarProps {
    value?: string;
    onChange: (date: string) => void;
    minDate?: string;
    maxDate?: string;
    className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ 
    value, 
    onChange, 
    minDate, 
    maxDate, 
    className = '' 
}) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = value ? new Date(value) : new Date();
        return new Date(date.getFullYear(), date.getMonth(), 1);
    });

    const today = new Date();
    const selectedDate = value ? new Date(value) : null;
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        return days;
    }, [currentMonth]);

    const isDateDisabled = (date: Date) => {
        if (minDateObj && date < minDateObj) return true;
        if (maxDateObj && date > maxDateObj) return true;
        return false;
    };

    const isDateSelected = (date: Date) => {
        return selectedDate && 
               date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const handleDateClick = (date: Date) => {
        if (!isDateDisabled(date)) {
            const dateString = date.toISOString().split('T')[0];
            onChange(dateString);
        }
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    return (
        <div className={`bg-white dark:bg-slate-800 border border-border dark:border-slate-600 rounded-lg shadow-lg p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                
                <h3 className="text-lg font-semibold text-text-primary dark:text-slate-100">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                
                <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    type="button"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-text-secondary dark:text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((date, index) => {
                    if (!date) {
                        return <div key={index} className="h-10" />;
                    }

                    const disabled = isDateDisabled(date);
                    const selected = isDateSelected(date);
                    const isTodayDate = isToday(date);

                    return (
                        <button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            disabled={disabled}
                            className={`
                                h-10 w-10 rounded-lg text-sm font-medium transition-colors
                                ${disabled 
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                                }
                                ${selected 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'text-text-primary dark:text-slate-100'
                                }
                                ${isTodayDate && !selected 
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                                    : ''
                                }
                            `}
                            type="button"
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
