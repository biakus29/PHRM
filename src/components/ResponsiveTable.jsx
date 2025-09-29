// src/components/ResponsiveTable.jsx
// Composant de tableau responsive avec vue mobile en cartes et vue desktop en tableau
// Optimisé pour mobile, tablette et desktop

import React from "react";
import { useIsMobile, useIsTablet } from "../hooks/useMediaQuery";

const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  className = "", 
  mobileCardRenderer = null,
  emptyMessage = "Aucune donnée disponible",
  loading = false,
  onRowClick = null,
  stickyHeader = false,
  maxHeight = null,
  showSearch = false,
  searchValue = "",
  onSearchChange = null,
  actions = null
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const showAsCards = isMobile || (isTablet && columns.length > 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-lg border border-gray-200">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 text-base">{emptyMessage}</p>
      </div>
    );
  }

  // Fonction pour rendre une cellule
  const renderCell = (item, column, index) => {
    if (column.render) {
      return column.render(item, index);
    }
    
    const value = typeof column.accessor === 'function' 
      ? column.accessor(item, index) 
      : item[column.accessor];
    
    return value ?? '-';
  };

  return (
    <div className="w-full">
      {/* Barre de recherche si activée */}
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Rechercher..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Version mobile/tablette : cartes */}
      {showAsCards ? (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div 
              key={index} 
              onClick={() => onRowClick?.(item, index)}
              className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all ${
                onRowClick ? 'active:scale-[0.98] cursor-pointer hover:shadow-md' : ''
              }`}
            >
              {mobileCardRenderer ? (
                mobileCardRenderer(item, index)
              ) : (
                <div className="p-4">
                  {/* En-tête de carte avec les premières colonnes importantes */}
                  {columns.slice(0, 2).map((column, colIndex) => (
                    <div key={colIndex} className={colIndex === 0 ? "mb-3" : "mb-2"}>
                      <div className={colIndex === 0 ? "font-semibold text-gray-900" : "text-sm text-gray-600"}>
                        {renderCell(item, column, index)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Détails supplémentaires */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    {columns.slice(2).map((column, colIndex) => {
                      // Ignorer les colonnes d'actions en mode carte
                      if (column.isAction) return null;
                      
                      return (
                        <div key={colIndex} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{column.header}:</span>
                          <span className="font-medium text-gray-900">
                            {renderCell(item, column, index)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Actions en mode carte */}
                  {actions && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      {actions(item, index)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Version desktop : tableau */
        <div className={`overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 ${
          maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''
        }`}>
          <table className={`w-full min-w-full ${className}`}>
            <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={index}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap ${
                      column.headerClassName || ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  onClick={() => onRowClick?.(item, rowIndex)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  } transition-colors`}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`px-4 py-3 text-sm text-gray-900 whitespace-nowrap ${
                        column.cellClassName || ''
                      }`}
                    >
                      {renderCell(item, column, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable;
