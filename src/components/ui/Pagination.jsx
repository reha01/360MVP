/**
 * Pagination - Componente de paginación reutilizable
 * 
 * Características:
 * - Paginación eficiente
 * - Navegación por páginas
 * - Indicadores de estado
 * - Accesibilidad (WCAG 2.1 AA)
 */

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showItemCount = true,
  className = '',
  disabled = false
}) => {
  // Calcular rangos de páginas a mostrar
  const getPageNumbers = () => {
    const delta = 2; // Número de páginas a mostrar a cada lado de la página actual
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }
    
    rangeWithDots.push(...range);
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }
    
    return rangeWithDots;
  };
  
  // Calcular información de items
  const startItem = totalItems > 0 ? ((currentPage - 1) * pageSize) + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  // Manejar cambio de página
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange?.(page);
    }
  };
  
  // Manejar cambio de tamaño de página
  const handlePageSizeChange = (newPageSize) => {
    if (newPageSize !== pageSize && !disabled) {
      onPageSizeChange?.(newPageSize);
    }
  };
  
  // Si no hay páginas, no mostrar nada
  if (totalPages <= 1) {
    return null;
  }
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={`flex items-center justify-between ${className}`} data-testid="pagination">
      {/* Información de items */}
      {showItemCount && (
        <div className="text-sm text-gray-600">
          Mostrando {startItem} - {endItem} de {totalItems} elementos
        </div>
      )}
      
      {/* Selector de tamaño de página */}
      {showPageSizeSelector && (
        <div className="flex items-center space-x-2">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Mostrar:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
      
      {/* Navegación de páginas */}
      <div className="flex items-center space-x-1">
        {/* Botón Anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {/* Números de página */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`dots-${index}`}
                className="px-3 py-1 text-sm text-gray-500"
                aria-hidden="true"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }
          
          const isCurrentPage = page === currentPage;
          
          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={disabled}
              aria-label={`Página ${page}`}
              aria-current={isCurrentPage ? "page" : undefined}
              className={isCurrentPage ? "bg-blue-600 text-white" : ""}
            >
              {page}
            </Button>
          );
        })}
        
        {/* Botón Siguiente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;