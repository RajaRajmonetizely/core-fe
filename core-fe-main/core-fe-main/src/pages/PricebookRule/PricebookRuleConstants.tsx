import { GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const getColumns = (onEditPriceBookRule: any, deletePriceBook: any): GridColDef[] => {
  return [
    {
      field: 'price_book_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Pricebook Name',
      flex: 1,
    },
    {
      field: 'org_hierarchy_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Designation',
      flex: 1,
    },
    {
      field: 'user_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'User',
      flex: 1,
    },
    {
      field: 'opportunity_type_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Opportunity Type',
      flex: 1,
    },
    {
      field: 'actions',
      headerName: '',
      align: 'center',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        return [
          <GridActionsCellItem
            sx={{ marginRight: '1rem' }}
            icon={<EditIcon />}
            label="Edit"
            onClick={() => onEditPriceBookRule(params)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => deletePriceBook(params)}
          />,
        ];
      },
    },
  ];
};

export default getColumns;
