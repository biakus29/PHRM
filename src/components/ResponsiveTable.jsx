import React from "react";

const ResponsiveTable = ({ 
  data = [], 
  columns = [], 
  className = "", 
  mobileCardRenderer = null,
  emptyMessage = "Aucune donnée disponible"
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Version mobile : cartes */}
      <div className="block lg:hidden space-y-3">
        {data.map((item, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {mobileCardRenderer ? (
              mobileCardRenderer(item, index)
            ) : (
              <div className="space-y-2">
                {columns.map((column, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">
                      {column.header}
                    </span>
                    <span className="text-sm text-gray-900">
                      {typeof column.accessor === 'function' 
                        ? column.accessor(item) 
                        : item[column.accessor] || '-'
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Version desktop : tableau */}
      <div className="hidden lg:block overflow-x-auto">
        <table className={`w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
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
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    className={`px-4 py-3 text-sm text-gray-900 ${
                      column.cellClassName || ''
                    }`}
                  >
                    {typeof column.accessor === 'function' 
                      ? column.accessor(item, rowIndex) 
                      : item[column.accessor] || '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ResponsiveTable;
