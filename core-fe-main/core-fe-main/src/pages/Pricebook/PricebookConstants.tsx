import { GridActionsCellItem, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const getColumns = (onEditPriceBook: any, onDeletePriceBook: any): GridColDef[] => {
  return [
    {
      field: 'name',
      headerClassName: 'table-header',
      headerName: 'Name',
      headerAlign: 'left',
      align: 'left',
      width: 300,
      flex: 1,
    },
    {
      field: 'product_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Product',
      minWidth: 250,
      flex: 1,
    },
    {
      field: 'plan_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Plan',
      minWidth: 250,
      flex: 1,
    },
    {
      field: 'package_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Package Version',
      minWidth: 250,
      flex: 1,
    },
    {
      field: 'pricing_model_name',
      headerClassName: 'table-header',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Pricing Model Version',
      minWidth: 250,
      flex: 1,
    },
    {
      field: 'actions',
      headerName: '',
      minWidth: 150,
      align: 'center',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (params?.rowNode?.type === 'group') {
          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={() => onEditPriceBook(params)}
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={() => onDeletePriceBook(params)}
            />,
          ];
        }
        return [];
      },
    },
  ];
};

export default getColumns;
