import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { defaultDateFormat } from '../../constants/constants';

const getColumns = (onEditOpportunity: any, openDetailsPage: any): GridColDef[] => {
  return [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Opp Name',
      flex: 1,
      renderCell: (params: any) => {
        return (
          <strong>
            <Button
              style={{ marginLeft: 'auto', marginRight: 'auto', textTransform: 'none' }}
              tabIndex={params.hasFocus ? 0 : -1}
              onClick={() => {
                openDetailsPage(params);
              }}>
              {params.value}
            </Button>
          </strong>
        );
      },
    },
    {
      field: 'owner_name',
      headerAlign: 'left',
      align: 'left',
      headerName: 'AE',
      flex: 1,
    },
    {
      field: 'close_date',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Opp Closing Date',
      flex: 1,
      renderCell: (params: any) => {
        return dayjs(params.row.close_date)
          .format(localStorage.getItem('dateFormat') ?? defaultDateFormat)
          .toString();
      },
    },
    {
      field: 'stage_name',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Stage',
      flex: 1,
    },
    {
      field: 'type_name',
      headerAlign: 'left',
      align: 'left',
      headerName: 'Type',
      flex: 1,
    },
    {
      field: 'actions',
      headerName: '',
      align: 'center',
      flex: 1,
      renderCell: (params: any) => {
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            key={params.row.id}
            onClick={() => onEditOpportunity(params)}
          />,
        ];
      },
    },
  ];
};

export default getColumns;
