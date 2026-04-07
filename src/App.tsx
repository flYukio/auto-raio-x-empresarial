/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { MainLayout } from './components/layout/MainLayout';
import { PricingPage } from './pages/PricingPage';
import { ModulePlaceholderPage } from './pages/ModulePlaceholderPage';
import { SettingsPage, ParamsPricingPage, ParamsCompanyPage, ParamsReajustePage } from './pages/ConfigPages';
import { LineChart, Target, Activity, PieChart } from 'lucide-react';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-text-primary overflow-x-hidden transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Dashboard Routes with Shared Layout */}
            <Route path="/dashboard" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="simulator" element={<ModulePlaceholderPage name="Simulador de Negócios" icon={LineChart} color="text-purple-400" />} />
              <Route path="viability" element={<ModulePlaceholderPage name="Análise de Viabilidade" icon={Target} color="text-emerald-400" />} />
              <Route path="stress" element={<ModulePlaceholderPage name="Stress Test Financeiro" icon={Activity} color="text-rose-400" />} />
              <Route path="margin" element={<ModulePlaceholderPage name="Inteligência de Margem" icon={PieChart} color="text-amber-400" />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="params-pricing" element={<ParamsPricingPage />} />
              <Route path="params-empresa" element={<ParamsCompanyPage />} />
              <Route path="params-reajuste" element={<ParamsReajustePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
