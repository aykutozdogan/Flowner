import React from 'react';
import MainApp from '../../../client/src/App';

interface PortalAppProps {
  entryMode?: 'admin' | 'portal' | 'unified';
  defaultTheme?: string;
}

function PortalApp({ entryMode = 'portal', defaultTheme = 'material' }: PortalAppProps = {}) {
  return <MainApp entryMode={entryMode} defaultTheme={defaultTheme} />;
}

export default PortalApp;