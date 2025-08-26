import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { Router, Route, Switch } from 'wouter';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4caf50',
    },
  },
});

const Tasks = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      My Tasks
    </Typography>
    <Typography variant="body1">
      Kullanıcı görev listesi ve işlem sayfası
    </Typography>
  </Box>
);

const MyProcesses = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      My Processes
    </Typography>
    <Typography variant="body1">
      Başlatılan süreç listesi
    </Typography>
  </Box>
);

const Profile = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Profile
    </Typography>
    <Typography variant="body1">
      Kullanıcı profil ayarları
    </Typography>
  </Box>
);

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Flowner Portal
              </Typography>
            </Toolbar>
          </AppBar>

          <Switch>
            <Route path="/" component={Tasks} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/my-processes" component={MyProcesses} />
            <Route path="/profile" component={Profile} />
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