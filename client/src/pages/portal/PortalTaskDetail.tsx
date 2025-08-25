import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { TaskDetail } from '@/pages/TaskDetail';

export default function PortalTaskDetail() {
  return (
    <PortalLayout>
      <TaskDetail />
    </PortalLayout>
  );
}