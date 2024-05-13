import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import commonStyle from '../../styles/commonStyle';

interface IProps {
  rows: any;
  columns: any;
  loading: any;
}

const MappingGrid: React.FC<IProps> = ({ rows, columns, loading }) => {
  return (
    <DataGrid
      rows={loading ? [] : rows}
      columns={columns}
      getRowHeight={() => 'auto'}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 100,
          },
        },
      }}
      sx={commonStyle.dateGridStyle}
      pageSizeOptions={[100]}
      disableRowSelectionOnClick
      disableColumnMenu
      loading={loading}
    />
  );
};

export default MappingGrid;
