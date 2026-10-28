import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { DemandForecasting } from './pages/DemandForecasting';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { ConservationRecommendations } from './pages/ConservationRecommendations';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { DataManagement } from './pages/DataManagement';
import { CloudOperations } from './pages/CloudOperations';
import { AboutDocumentation } from './pages/AboutDocumentation';
import { api } from './services/api';
import { DashboardSummary } from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load telemetry summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      <Navbar
        isDemoMode={summary?.is_demo_mode ?? true}
        cloudStatus={summary?.cloud_pipeline_status ?? 'Local Demo Mode'}
        onRefresh={loadData}
        loading={loading}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          anomalyCount={summary?.detected_anomalies_count ?? 0}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex justify-between items-center">
              <span>Notice: Backend API is syncing or initializing: {error}</span>
              <button
                onClick={loadData}
                className="underline hover:text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {activePage === 'overview' && (
            <OverviewDashboard
              summary={summary}
              loading={loading}
              onNavigate={(page) => setActivePage(page as PageId)}
            />
          )}

          {activePage === 'forecasting' && <DemandForecasting />}
          {activePage === 'anomalies' && <AnomalyDetection />}
          {activePage === 'conservation' && <ConservationRecommendations />}
          {activePage === 'models' && <ModelEvaluation />}
          {activePage === 'data' && <DataManagement />}
          {activePage === 'cloud' && <CloudOperations />}
          {activePage === 'about' && <AboutDocumentation />}
        </main>
      </div>
    </div>
  );
};

export default App;
