import React from "react";
import { auth } from "../firebase";
import { Bell } from "lucide-react";
import { displayDateWithOptions } from "../utils/displayUtils";

const DashboardHeader = ({ activeTab, notifications = [] }) => {
  return (
    <header className="bg-white shadow-sm border-b border-blue-100 p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {displayDateWithOptions(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
        <div className="relative">
          <Bell className="w-6 h-6 text-blue-600" />
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {notifications.filter((n) => !n.read).length}
          </span>
        </div>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
          {auth.currentUser?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
