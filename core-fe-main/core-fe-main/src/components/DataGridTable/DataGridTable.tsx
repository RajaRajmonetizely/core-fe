import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import React, { ReactElement } from 'react';

const DataGridTable: React.FC<any> = ({ rows, columns, rowHeight }): ReactElement => {
  return (
    <Box
      sx={{
        width: '102%',
        backgroundColor: 'white',
      }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowHeight={rowHeight}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default DataGridTable;
