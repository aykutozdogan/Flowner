import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Portal } from '@/pages/Portal';

export default function PortalInbox() {
  return (
    <PortalLayout>
      <Portal />
    </PortalLayout>
  );
}