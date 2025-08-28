import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useTheme } from '@/providers/ThemeProvider';
import StatsCards from '@/components/dashboard/stats-cards';
import QuickActions from '@/components/dashboard/quick-actions';
import RecentActivity from '@/components/dashboard/recent-activity';
import ActiveProcesses from '@/components/dashboard/active-processes';
import SystemHealth from '@/components/dashboard/system-health';
// 🎨 PREMIUM DevExtreme Component Library
import { DashboardWidget, ThemeSwitcher } from '@/components/ui/analytics/DashboardWidget';
import { RevenueCard } from '@/components/ui/analytics/RevenueCard';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Sample revenue data for DevExtreme chart
  const revenueData = [
    { date: 'Jan', revenue: 245000, profit: 85000 },
    { date: 'Feb', revenue: 267000, profit: 92000 },
    { date: 'Mar', revenue: 234000, profit: 78000 },
    { date: 'Apr', revenue: 298000, profit: 105000 },
    { date: 'May', revenue: 312000, profit: 118000 },
    { date: 'Jun', revenue: 289000, profit: 95000 }
  ];

  return (
    <AdminLayout>
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* 🎨 PREMIUM THEME SWITCHER */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Admin Dashboard
          </h1>
          <ThemeSwitcher />
        </div>

        {/* 💎 PREMIUM ANALYTICS WIDGETS */}
        <div className="mb-6">
          <DashboardWidget />
        </div>

        {/* Stats Cards */}
        <StatsCards />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <QuickActions />
          <div className={`p-6 rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Workflow Engine</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Use Form Builder and BPMN Designer to create custom workflows.
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Form Builder
              </button>
              <button className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                BPMN Designer
              </button>
            </div>
          </div>
          <RecentActivity />
        </div>
        
        {/* Bottom Grid - ENHANCED WITH REVENUE CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ActiveProcesses />
          <SystemHealth />
        </div>
        
        {/* 📊 PREMIUM REVENUE ANALYTICS */}
        <div className="mb-6">
          <RevenueCard
            title="📈 Revenue Analysis - DevExtreme Professional"
            data={revenueData}
            totalRevenue={1645000}
            totalProfit={573000}
            percentageChange={12.5}
          />
        </div>
        
        {/* Workflow Designer Preview */}
        <div className={`p-6 rounded-lg shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>İş Akışı Tasarımcısı</h3>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                Sezgisel BPMN tasarımcısı ile iş süreçlerini oluşturun ve yönetin
              </p>
            </div>
            <button 
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
            >
              Designer'ı Aç
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}