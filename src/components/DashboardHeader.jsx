import React from "react";
import { auth } from "../firebase";
import { Bell } from "lucide-react";
import { displayDateWithOptions } from "../utils/displayUtils";

const DashboardHeader = ({ activeTab, notifications = [] }) => {
  return (
    <header className="bg-white shadow-sm border-b border-blue-100 p-3 sm:p-4 flex items-center justify-between">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 capitalize truncate">{activeTab}</h1>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:block text-xs sm:text-sm text-gray-500 truncate max-w-32 md:max-w-none">
          {displayDateWithOptions(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
        <div className="relative">
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
          {auth.currentUser?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
