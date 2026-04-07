import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PricingEstrategicoView } from '../components/pricing/PricingEstrategicoView';

export function PricingPage() {
  const { userPermissions } = useOutletContext<{ userPermissions: string[] }>();

  return (
    <div className="max-w-7xl mx-auto">
      <PricingEstrategicoView userPermissions={userPermissions} />
    </div>
  );
}
