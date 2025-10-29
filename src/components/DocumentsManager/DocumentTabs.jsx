// src/components/DocumentsManager/DocumentTabs.jsx
// Onglets de navigation entre les types de documents

import React from 'react';
import { DOCUMENT_TYPES } from '../../config/documentConfig';

/**
 * Onglets pour naviguer entre les types de documents
 */
const DocumentTabs = ({ activeTab, onTabChange, documents }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-0 overflow-x-auto scrollbar-hide">
          {Object.entries(DOCUMENT_TYPES).map(([key, type]) => {
            const Icon = type.icon;
            const isActive = activeTab === key;
            const docCount = documents[key]?.length || 0;
            
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex items-center space-x-2 sm:space-x-3 py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 min-w-0 ${
                  isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium truncate">
                  <span className="hidden sm:inline">{type.title}</span>
                  <span className="sm:hidden">
                    {type.title.split(' ')[0]}
                  </span>
                </span>
                <span className={`py-1 px-2 sm:px-3 rounded-full text-xs font-semibold flex-shrink-0 ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : docCount > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                }`}>
                  {docCount}
                </span>
                {docCount > 0 && !isActive && (
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DocumentTabs;
