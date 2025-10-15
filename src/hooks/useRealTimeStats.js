import { useMemo } from 'react';

export const useRealTimeStats = (employees = [], leaveRequests = [], companyData = null) => {
  const stats = useMemo(() => {
    // Statistiques des employés
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
    const inactiveEmployees = employees.filter(emp => emp.status === 'Inactive').length;
    const onLeaveEmployees = employees.filter(emp => emp.status === 'On leave').length;
    
    // Statistiques des contrats
    const employeesWithContracts = employees.filter(emp => emp.contract).length;
    const contractCompletionRate = totalEmployees > 0 ? ((employeesWithContracts / totalEmployees) * 100) : 0;
    
    // Statistiques des fiches de paie
    const employeesWithPayslips = employees.filter(emp => emp.payslips && emp.payslips.length > 0).length;
    const payslipCompletionRate = totalEmployees > 0 ? ((employeesWithPayslips / totalEmployees) * 100) : 0;
    
    // Statistiques des demandes de congé
    const totalLeaveRequests = leaveRequests.length;
    const pendingLeaveRequests = leaveRequests.filter(req => req.status === 'pending').length;
    const approvedLeaveRequests = leaveRequests.filter(req => req.status === 'approved').length;
    const rejectedLeaveRequests = leaveRequests.filter(req => req.status === 'rejected').length;
    
    // Statistiques des départements
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    const totalDepartments = departments.length;
    
    // Statistiques CNPS
    const employeesWithCNPS = employees.filter(emp => emp.cnpsNumber).length;
    const cnpsCompletionRate = totalEmployees > 0 ? ((employeesWithCNPS / totalEmployees) * 100) : 0;
    
    // Calcul de l'uptime (simulation basée sur les données)
    const uptimePercentage = totalEmployees > 0 ? Math.min(99.9, 95 + (activeEmployees / totalEmployees) * 5) : 99.9;
    
    // Nombre d'entreprises clientes (simulation)
    const clientCompanies = companyData ? Math.max(1, Math.floor(totalEmployees / 10) + 50) : 50;
    
    return {
      // Statistiques principales
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      
      // Taux de completion
      contractCompletionRate: Math.round(contractCompletionRate * 10) / 10,
      payslipCompletionRate: Math.round(payslipCompletionRate * 10) / 10,
      cnpsCompletionRate: Math.round(cnpsCompletionRate * 10) / 10,
      
      // Demandes de congé
      totalLeaveRequests,
      pendingLeaveRequests,
      approvedLeaveRequests,
      rejectedLeaveRequests,
      
      // Autres statistiques
      totalDepartments,
      uptimePercentage: Math.round(uptimePercentage * 10) / 10,
      clientCompanies,
      
      // Statistiques formatées pour l'affichage
      formattedStats: {
        companies: clientCompanies >= 1000 ? `${Math.floor(clientCompanies / 1000)}K+` : `${clientCompanies}+`,
        employees: totalEmployees >= 1000 ? `${Math.floor(totalEmployees / 1000)}K+` : totalEmployees.toString(),
        uptime: `${Math.round(uptimePercentage * 10) / 10}%`,
        support: '24/7'
      }
    };
  }, [employees, leaveRequests, companyData]);
  
  return stats;
};
