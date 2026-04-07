import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { SettingsView } from '../components/SettingsView';
import { ParamsPricingView } from '../components/parameters/ParamsPricingView';
import { ParamsCompanyView } from '../components/parameters/ParamsCompanyView';
import { InflationIndicesView } from '../components/parameters/InflationIndicesView';

export function SettingsPage() {
  const { userPermissions } = useOutletContext<{ userPermissions: string[] }>();
  return <SettingsView userPermissions={userPermissions} />;
}

export function ParamsPricingPage() {
  const { userPermissions } = useOutletContext<{ userPermissions: string[] }>();
  return <ParamsPricingView userPermissions={userPermissions} />;
}

export function ParamsCompanyPage() {
  const { userPermissions } = useOutletContext<{ userPermissions: string[] }>();
  return <ParamsCompanyView userPermissions={userPermissions} />;
}

export function ParamsReajustePage() {
  return <InflationIndicesView />;
}
