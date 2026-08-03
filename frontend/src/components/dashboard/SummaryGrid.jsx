import React from 'react';
import { Box } from '@mui/material';
import DashboardGrid from './DashboardGrid';
import { span } from '../../design/tokens';

const COLUMN_SPAN = {
  3: span.third,
  4: span.quarter,
};

/** Renders summary cards in a balanced responsive row */
const SummaryGrid = ({ children, columns = 4 }) => {
  const spanStyle = COLUMN_SPAN[columns] || span.quarter;

  return (
    <DashboardGrid>
      {React.Children.map(children, (child, index) =>
        child ? (
          <Box key={child.key ?? index} sx={spanStyle}>
            {child}
          </Box>
        ) : null
      )}
    </DashboardGrid>
  );
};

export default SummaryGrid;
