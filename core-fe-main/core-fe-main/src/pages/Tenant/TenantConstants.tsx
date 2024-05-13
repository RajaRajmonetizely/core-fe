import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import commonStyle from '../../styles/commonStyle';
import { REGEX } from '../../utils/helperService';

export const getColumns = (intl: any, onEditTenant: any, onTenantSelect: any): GridColDef[] => {
  return [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'name' }),
      renderCell: (params: any) => {
        return <Button onClick={() => onTenantSelect(params.row)}>{params.row.name}</Button>;
      },
      flex: 1,
    },

    {
      field: 'created_on',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'createdOn' }),
      flex: 1,
      renderCell: (params: any) => {
        return dayjs(params.row.created_on).format('DD/MM/YYYY').toString();
      },
    },
    {
      field: 'city',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'city' }),
      flex: 1,
    },
    {
      field: 'country',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'country' }),
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
            onClick={(event) => {
              event.stopPropagation();
              onEditTenant(params);
            }}
          />,
        ];
      },
    },
  ];
};

export const getTenantUserColumns = (intl: any, setMimicUser: any): GridColDef[] => {
  return [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'name' }),
      flex: 1,
    },
    {
      field: 'email',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'email' }),
      flex: 1,
    },
    {
      field: 'manager_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'managerName' }),
      flex: 1,
    },
    {
      field: 'org_hierarchy',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'orgHierarchyName' }),
      flex: 1,
    },

    {
      field: 'actions',
      align: 'center',
      headerAlign: 'center',
      flex: 1,
      sortable: false,
      headerName: intl.formatMessage({ id: 'action' }),
      renderCell: (params: any) => {
        if (params.row.is_staff_access) {
          return [
            <Button
              onClick={(event) => {
                event.stopPropagation();
                setMimicUser(params.row);
              }}
              sx={commonStyle.button}>
              {intl.formatMessage({ id: 'mimicUser' })}
            </Button>,
          ];
        }
        return null;
      },
    },
  ];
};

export const schema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Please enter Tenant Name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  address: Yup.string()
    .trim()
    .required('Please enter address')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  country: Yup.string().required('Please select a Country'),
  city: Yup.string().required('Please select a City'),
  state: Yup.string().required('Please enter state'),
  postal_code: Yup.string().trim().required('Please enter postal code'),
  notes: Yup.string().trim().required('Notes are required'),
});

export const userSchema = Yup.object({
  user_name: Yup.string()
    .required('Please enter Admin Name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  user_email: Yup.string().email('Enter a valid email').required('Please enter Admin Email'),
});
