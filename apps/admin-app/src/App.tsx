import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Router, Route, Switch } from 'wouter';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
  },
});

const Dashboard = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Admin Dashboard
    </Typography>
    <Typography variant="body1">
      Flowner Admin Panel - Forms, Workflows, Tenants, Users yönetimi
    </Typography>
  </Box>
);

const Forms = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Forms Management
    </Typography>
    <Typography variant="body1">
      Form oluşturma ve yönetim sayfası
    </Typography>
  </Box>
);

const Workflows = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Workflows Management
    </Typography>
    <Typography variant="body1">
      BPMN Workflow oluşturma ve yönetim sayfası
    </Typography>
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router base="/admin">
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Flowner Admin
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/forms" component={Forms} />
            <Route path="/workflows" component={Workflows} />
            <Route>
              <Box sx={{ p: 3 }}>
                <Typography variant="h5">404 - Sayfa Bulunamadı</Typography>
              </Box>
            </Route>
          </Switch>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;