// src/router.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes.js';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import AppShell from './layouts/AppShell.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FeatureAwareEvaluation from './pages/FeatureAwareEvaluation.jsx';
import ReportView from './pages/ReportView.jsx';
import Credits from './pages/Credits.jsx';
import FeatureAwareOrgProcesses from './pages/FeatureAwareOrgProcesses.jsx';
import InvitePage from './pages/InvitePage.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import OrgStructurePage from './pages/OrgStructurePage.jsx';
import JobFamilyPage from './pages/JobFamilyPage.jsx';
import CampaignPage from './pages/CampaignPage.jsx';
import EvaluationLandingPage from './pages/EvaluationLandingPage.jsx';
import Evaluation360Page from './pages/Evaluation360Page.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BulkActionsPage from './pages/BulkActionsPage.jsx';
import ComparisonPage from './pages/ComparisonPage.jsx';
import PolicyPage from './pages/PolicyPage.jsx';
import AlertPage from './pages/AlertPage.jsx';

function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.HOME} element={<AuthGuard />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      
      {/* Protected routes with AppShell layout */}
      <Route 
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
      </Route>
      
      <Route 
        path={ROUTES.EVALUATION}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeatureAwareEvaluation />} />
      </Route>
      
      <Route 
        path={ROUTES.EVALUATION_PARAM}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeatureAwareEvaluation />} />
      </Route>
      
      <Route 
        path={ROUTES.REPORT_VIEW}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReportView />} />
      </Route>
      
      <Route 
        path={ROUTES.CREDITS}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Credits />} />
      </Route>
      
      <Route 
        path={ROUTES.ORG_PROCESSES}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeatureAwareOrgProcesses />} />
      </Route>
      
      <Route 
        path={ROUTES.ORG_PROCESS_DETAIL}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeatureAwareOrgProcesses />} />
      </Route>
      
      <Route 
        path={ROUTES.INDIVIDUAL_REPORT}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeatureAwareOrgProcesses />} />
      </Route>
      
      <Route 
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AnalyticsDashboard />} />
      </Route>
      
      <Route 
        path="/evaluations/assigned"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<div>Assigned Evaluations Page</div>} />
      </Route>
      
      <Route 
        path="/reports"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<div>Reports Page</div>} />
      </Route>
      
      <Route 
        path={ROUTES.ORG_STRUCTURE}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrgStructurePage />} />
      </Route>
      
      <Route 
        path={ROUTES.JOB_FAMILIES}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<JobFamilyPage />} />
      </Route>
      
     <Route 
       path={ROUTES.CAMPAIGNS}
       element={
         <ProtectedRoute>
           <AppShell />
         </ProtectedRoute>
       }
     >
       <Route index element={<CampaignPage />} />
     </Route>
     
{/* Dashboard 360° */}
<Route
  path={ROUTES.DASHBOARD_360}
  element={
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  }
>
  <Route index element={<DashboardPage />} />
</Route>

{/* Acciones Masivas */}
<Route
  path={ROUTES.BULK_ACTIONS}
  element={
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  }
>
  <Route index element={<BulkActionsPage />} />
</Route>

{/* Comparativas */}
<Route
       path={ROUTES.COMPARISON}
       element={
         <ProtectedRoute>
           <AppShell />
         </ProtectedRoute>
       }
     >
       <Route index element={<ComparisonPage />} />
     </Route>
     
     {/* Políticas */}
     <Route 
       path={ROUTES.POLICIES}
       element={
         <ProtectedRoute>
           <AppShell />
         </ProtectedRoute>
       }
     >
       <Route index element={<PolicyPage />} />
     </Route>
     
     {/* Alertas */}
     <Route 
       path={ROUTES.ALERTS}
       element={
         <ProtectedRoute>
           <AppShell />
         </ProtectedRoute>
       }
     >
       <Route index element={<AlertPage />} />
     </Route>
      
      {/* Ruta pública para evaluadores con token */}
      <Route 
        path="/eval/:token"
        element={<EvaluationLandingPage />}
      />
      
      {/* Ruta para evaluación 360° */}
      <Route 
        path="/evaluation360/:token"
        element={<Evaluation360Page />}
      />
      
      <Route 
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<div>Settings Page</div>} />
      </Route>
    </Routes>
  );
}

export default AppRouter;