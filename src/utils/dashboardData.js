// src/utils/dashboardData.js
// Reusable dataset builders for dashboard charts

// Doughnut: leave types distribution (static baseline)
export const buildLeaveTypeDoughnut = () => ({
  labels: ["Vacances", "Maladie", "Personnel", "Maternité", "Autre"],
  datasets: [
    {
      data: [30, 20, 15, 10, 25],
      backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"],
      borderColor: ["#ffffff"],
      borderWidth: 2,
    },
  ],
});

// Bar: employees per department (static baseline)
export const buildDepartmentBar = () => ({
  labels: ["Informatique", "RH", "Finance", "Marketing", "Non assigné"],
  datasets: [
    {
      label: "Employés par département",
      data: [5, 3, 2, 4, 1],
      backgroundColor: "#3B82F6",
      borderColor: "#2563EB",
      borderWidth: 1,
    },
  ],
});

// Line: monthly trends (hires vs departures) (static baseline)
export const buildMonthlyTrendsLine = () => ({
  labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"],
  datasets: [
    {
      label: "Embauches",
      data: [2, 3, 1, 4, 2, 5],
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
      fill: true,
    },
    {
      label: "Départs",
      data: [1, 0, 2, 1, 0, 1],
      borderColor: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      fill: true,
    },
  ],
});
