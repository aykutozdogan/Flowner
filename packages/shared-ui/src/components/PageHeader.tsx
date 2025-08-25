import React, { ReactNode } from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';

interface Breadcrumb {
  label: string;
  href?: string;
  current?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((breadcrumb, index) => (
            breadcrumb.current ? (
              <Typography key={index} color="text.primary">
                {breadcrumb.label}
              </Typography>
            ) : (
              <Link
                key={index}
                color="inherit"
                href={breadcrumb.href}
                underline="hover"
              >
                {breadcrumb.label}
              </Link>
            )
          ))}
        </Breadcrumbs>
      )}
      
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {actions && (
          <Box display="flex" gap={1}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};