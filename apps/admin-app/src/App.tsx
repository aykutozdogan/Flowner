import React from 'react';
import MainApp from '../../../client/src/App';

interface AdminAppProps {
  entryMode?: 'admin' | 'portal' | 'unified';
  defaultTheme?: string;
}

function AdminApp({ entryMode = 'admin', defaultTheme = 'light' }: AdminAppProps = {}) {
  return <MainApp entryMode={entryMode} defaultTheme={defaultTheme} />;
}

export default AdminApp;