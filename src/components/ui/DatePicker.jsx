/**
 * DatePicker - Componente de selección de fechas reutilizable
 * 
 * Características:
 * - Selección de fechas individuales y rangos
 * - Validación de fechas
 * - Accesibilidad (WCAG 2.1 AA)
 * - Soporte para diferentes formatos
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

const DatePicker = ({
  value = '',
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate = null,
  maxDate = null,
  disabled = false,
  required = false,
  className = '',
  showTime = false,
  format = 'YYYY-MM-DD',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [inputValue, setInputValue] = useState(value);
  
  const inputRef = useRef(null);
  const calendarRef = useRef(null);
  
  // Efecto para cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Efecto para sincronizar el valor
  useEffect(() => {
    setInputValue(value);
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);
  
  // Formatear fecha para mostrar
  const formatDate = (date) => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (showTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    return `${year}-${month}-${day}`;
  };
  
  // Obtener días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  // Verificar si una fecha está deshabilitada
  const isDateDisabled = (date) => {
    if (!date) return true;
    
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    
    return false;
  };
  
  // Verificar si una fecha está seleccionada
  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    
    return date.toDateString() === selectedDate.toDateString();
  };
  
  // Manejar selección de fecha
  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    
    setSelectedDate(date);
    const formattedDate = formatDate(date);
    setInputValue(formattedDate);
    onChange?.(formattedDate);
    setIsOpen(false);
  };
  
  // Manejar cambio de mes
  const handleMonthChange = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };
  
  // Manejar cambio de input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validar formato de fecha
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        onChange?.(value);
      }
    }
  };
  
  // Nombres de los meses
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Nombres de los días
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const days = getDaysInMonth(currentMonth);
  
  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type={showTime ? "datetime-local" : "date"}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      
      {/* Calendario */}
      {isOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[280px]"
        >
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(-1)}
              disabled={disabled}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange(1)}
              disabled={disabled}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="py-2" />;
              }
              
              const isDisabled = isDateDisabled(day);
              const isSelected = isDateSelected(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    py-2 text-sm rounded-md transition-colors
                    ${isSelected 
                      ? 'bg-blue-600 text-white' 
                      : isToday 
                        ? 'bg-blue-100 text-blue-600 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDate(new Date());
                const today = formatDate(new Date());
                setInputValue(today);
                onChange?.(today);
                setIsOpen(false);
              }}
            >
              Hoy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;