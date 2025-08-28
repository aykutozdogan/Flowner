// MUI removed - using native elements
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import StatsCards from '@/components/dashboard/stats-cards';
import QuickActions from '@/components/dashboard/quick-actions';
import RecentActivity from '@/components/dashboard/recent-activity';
import ActiveProcesses from '@/components/dashboard/active-processes';
import SystemHealth from '@/components/dashboard/system-health';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-primary, #f5f5f5)' }}>
      <Sidebar />
      
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        
        <main style={{
          flexGrow: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          {/* Stats Cards */}
          <StatsCards />
          
          {/* Main Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <QuickActions />
            <RecentActivity />
          </div>
          
          {/* Bottom Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <ActiveProcesses />
            <SystemHealth />
          </div>
          
          {/* Workflow Designer Preview */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Featured: Workflow Designer</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Create and manage business process workflows with our intuitive BPMN designer
                </p>
              </div>
              <button 
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
                data-testid="button-open-workflow-designer"
              >
                Open Designer
              </button>
            </div>
            
            {/* BPMN Canvas Preview */}
            <div style={{
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              padding: '32px',
              border: '2px dashed #ccc',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px'
            }}>
              <div className="flex items-center justify-center space-x-8">
                {/* Start Event */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-2 border-green-500 rounded-full bg-green-50 flex items-center justify-center">
                    <span className="material-icons text-green-600 text-sm">play_arrow</span>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Start</span>
                </div>
                
                {/* Arrow */}
                <div className="w-8 border-t-2 border-gray-400"></div>
                
                {/* User Task */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-12 border-2 border-blue-500 rounded bg-blue-50 flex items-center justify-center">
                    <span className="material-icons text-blue-600 text-sm">person</span>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Review</span>
                </div>
                
                {/* Arrow */}
                <div className="w-8 border-t-2 border-gray-400"></div>
                
                {/* Gateway */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-2 border-orange-500 bg-orange-50 transform rotate-45 flex items-center justify-center">
                    <span className="material-icons text-orange-600 text-sm transform -rotate-45">help</span>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">Decision</span>
                </div>
                
                {/* Arrow */}
                <div className="w-8 border-t-2 border-gray-400"></div>
                
                {/* End Event */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-red-500 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="material-icons text-red-600 text-sm">stop</span>
                  </div>
                  <span className="text-xs text-gray-600 mt-2">End</span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">Drag and drop BPMN elements to create complex workflows</p>
            </div>
          </div>
        </main>
      </div>
      
      {/* Floating Action Button */}
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        data-testid="button-floating-action"
      >
        <span className="material-icons">add</span>
      </button>
    </div>
  );
}
