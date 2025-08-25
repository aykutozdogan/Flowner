import { Box, Typography, Breadcrumbs, Link, TextField, InputAdornment, IconButton, Badge } from '@mui/material';
import { 
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  HelpOutline as HelpIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function Header({ title = "Dashboard", breadcrumbs = [{ label: "Home" }, { label: "Dashboard" }] }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'grey.200',
        px: 3,
        py: 2,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left side - Title and Breadcrumbs */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          
          <Breadcrumbs
            separator={<ChevronRightIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
            sx={{ '& .MuiBreadcrumbs-ol': { alignItems: 'center' } }}
          >
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                underline={index === breadcrumbs.length - 1 ? 'none' : 'hover'}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
                href={crumb.href}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: index === breadcrumbs.length - 1 ? 500 : 400,
                  cursor: crumb.href ? 'pointer' : 'default',
                }}
              >
                {crumb.label}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        {/* Right side - Search and Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Search Bar */}
          <TextField
            placeholder="Search processes, forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              width: 320,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'background.paper',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            data-testid="input-global-search"
          />

          {/* Notification Button */}
          <IconButton
            sx={{
              p: 1,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'grey.100',
                color: 'text.primary',
              },
            }}
            data-testid="button-notifications"
          >
            <Badge badgeContent={1} color="error" variant="dot">
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          {/* Help Button */}
          <IconButton
            sx={{
              p: 1,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'grey.100',
                color: 'text.primary',
              },
            }}
            data-testid="button-help"
          >
            <HelpIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
