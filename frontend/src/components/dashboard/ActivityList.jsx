import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';
import { tokens } from '../../design/tokens';

const ActivityList = ({ items = [], emptyMessage = 'No activity yet.' }) => {
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <List disablePadding sx={{ width: '100%' }}>
      {items.map((item, idx) => (
        <React.Fragment key={item.id ?? idx}>
          <ListItem sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
            <ListItemText
              primary={item.title}
              secondary={
                <>
                  {item.description && (
                    <Typography component="span" variant="caption" color="text.secondary" display="block">
                      {item.description}
                    </Typography>
                  )}
                  {item.time && (
                    <Typography component="span" variant="caption" color="text.disabled" display="block" sx={{ mt: 0.25 }}>
                      {typeof item.time === 'string'
                        ? item.time
                        : new Date(item.time).toLocaleString()}
                    </Typography>
                  )}
                </>
              }
              primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
            />
            {item.badge && <Box sx={{ flexShrink: 0, ml: 1 }}>{item.badge}</Box>}
          </ListItem>
          {idx < items.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ActivityList;
