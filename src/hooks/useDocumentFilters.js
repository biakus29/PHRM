// src/hooks/useDocumentFilters.js
// Hook pour gérer le filtrage et la recherche de documents

import { useState, useMemo, useCallback } from 'react';
import { getDocDepartment } from '../utils/documentHelpers';

/**
 * Hook pour gérer les filtres de documents
 * @param {Array} documents - Liste des documents à filtrer
 * @param {Array} employees - Liste des employés
 * @returns {Object} - Documents filtrés et fonctions de filtrage
 */
export const useDocumentFilters = (documents = [], employees = []) => {
  const [viewMode, setViewMode] = useState('all'); // 'all' ou 'employee'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  /**
   * Filtre les employés selon le terme de recherche
   */
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    
    const term = searchTerm.toLowerCase();
    return employees.filter(emp => 
      (emp.name || emp.nom || '').toLowerCase().includes(term) ||
      (emp.matricule || '').toLowerCase().includes(term) ||
      (emp.poste || emp.position || '').toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  /**
   * Filtre les documents selon les critères actifs
   */
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];
    
    // Filtre par employé si mode employé actif
    if (viewMode === 'employee' && selectedEmployee) {
      filtered = filtered.filter(doc => {
        const docEmployeeName = (doc.employeeName || doc.nomEmploye || '').toLowerCase();
        const selectedEmployeeName = (selectedEmployee.name || selectedEmployee.nom || '').toLowerCase();
        return docEmployeeName === selectedEmployeeName;
      });
    }
    
    // Filtre par département
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const dept = getDocDepartment(doc, employees);
        return dept.toLowerCase() === departmentFilter.toLowerCase();
      });
    }
    
    return filtered;
  }, [documents, viewMode, selectedEmployee, departmentFilter, employees]);

  /**
   * Liste des départements disponibles
   */
  const departments = useMemo(() => {
    const depts = new Set();
    
    // Départements des employés
    employees.forEach(emp => {
      const dept = emp.department || emp.departement || emp.service || emp.services;
      if (dept) depts.add(dept);
    });
    
    // Départements des documents
    documents.forEach(doc => {
      const dept = getDocDepartment(doc, employees);
      if (dept) depts.add(dept);
    });
    
    return Array.from(depts).sort();
  }, [employees, documents]);

  /**
   * Statistiques de filtrage
   */
  const filterStats = useMemo(() => {
    return {
      total: documents.length,
      filtered: filteredDocuments.length,
      hasActiveFilters: viewMode === 'employee' && selectedEmployee || departmentFilter !== 'all'
    };
  }, [documents.length, filteredDocuments.length, viewMode, selectedEmployee, departmentFilter]);

  /**
   * Réinitialise tous les filtres
   */
  const resetFilters = useCallback(() => {
    setViewMode('all');
    setSelectedEmployee(null);
    setSearchTerm('');
    setDepartmentFilter('all');
  }, []);

  /**
   * Réinitialise uniquement le filtre employé
   */
  const resetEmployeeFilter = useCallback(() => {
    setSelectedEmployee(null);
    setViewMode('all');
  }, []);

  return {
    // États
    viewMode,
    selectedEmployee,
    searchTerm,
    departmentFilter,
    
    // Setters
    setViewMode,
    setSelectedEmployee,
    setSearchTerm,
    setDepartmentFilter,
    
    // Données filtrées
    filteredDocuments,
    filteredEmployees,
    departments,
    filterStats,
    
    // Actions
    resetFilters,
    resetEmployeeFilter
  };
};
