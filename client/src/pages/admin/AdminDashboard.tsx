import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import StatsCards from '@/components/dashboard/stats-cards';
import QuickActions from '@/components/dashboard/quick-actions';
import RecentActivity from '@/components/dashboard/recent-activity';
import ActiveProcesses from '@/components/dashboard/active-processes';
import SystemHealth from '@/components/dashboard/system-health';
import { Box } from '@mui/material';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {/* Stats Cards */}
      <StatsCards />
      
      {/* Main Content Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 1fr' },
          gap: 3,
          mb: 4
        }}
      >
        <QuickActions />
        <div>
          <h3 className="text-lg font-semibold mb-3">Workflow Engine</h3>
          <p className="text-sm text-gray-600 mb-4">
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
      </Box>
      
      {/* Bottom Grid */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 4
        }}
      >
        <ActiveProcesses />
        <SystemHealth />
      </Box>
      
      {/* Workflow Designer Preview */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          p: 3,
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">İş Akışı Tasarımcısı</h3>
            <p className="text-sm text-gray-500 mt-2">
              Sezgisel BPMN tasarımcısı ile iş süreçlerini oluşturun ve yönetin
            </p>
          </div>
          <button 
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
            data-testid="button-open-workflow-designer"
          >
            Tasarımcıyı Aç
          </button>
        </Box>
      </Box>
    </AdminLayout>
  );
}