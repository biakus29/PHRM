import React, { memo } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { buildCommonOptions } from "../utils/chartConfig";
import { buildLeaveTypeDoughnut, buildDepartmentBar, buildMonthlyTrendsLine } from "../utils/dashboardData";

const CardLike = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
    {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
    {children}
  </div>
);

const ChartsSection = () => {
  const doughnutData = buildLeaveTypeDoughnut();
  const barData = buildDepartmentBar();
  const lineData = buildMonthlyTrendsLine();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CardLike title="Types de Congés">
        <div className="h-64">
          <Doughnut data={doughnutData} options={buildCommonOptions({ title: "Types de Congés" })} />
        </div>
      </CardLike>
      <CardLike title="Répartition par Département">
        <div className="h-64">
          <Bar data={barData} options={buildCommonOptions({ title: "Répartition par Département" })} />
        </div>
      </CardLike>
      <CardLike title="Tendances Mensuelles">
        <div className="h-64">
          <Line data={lineData} options={buildCommonOptions({ title: "Tendances Mensuelles" })} />
        </div>
      </CardLike>
    </div>
  );
};

export default memo(ChartsSection);
