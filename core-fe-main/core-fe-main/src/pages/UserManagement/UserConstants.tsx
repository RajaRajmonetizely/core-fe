import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import * as Yup from 'yup';
import { defaultDateFormat } from '../../constants/constants';
import { REGEX } from '../../utils/helperService';

export const getUserManagementColumns = (
  intl: any,
  onEditUser: any,
  onDeleteUser: any,
): GridColDef[] => {
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
      field: 'created_on',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'createdOn' }),
      flex: 1,
      renderCell: (params: any) => {
        return dayjs(params.row.created_on)
          .format(localStorage.getItem('dateFormat') || defaultDateFormat)
          .toString();
      },
    },
    {
      field: 'manager_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'managerName' }),
      flex: 1,
    },
    {
      field: 'org_hierarchy_name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'orgHierarchyName' }),
      flex: 1,
    },

    {
      field: 'is_active',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'isActive' }),
      flex: 1,
      renderCell: (params: any) => {
        return params.row.is_active ? 'Yes' : 'No';
      },
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
            onClick={() => onEditUser(params)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            key={uuidv4()}
            label="Delete"
            onClick={() => onDeleteUser(params)}
          />,
        ];
      },
    },
  ];
};

export const userSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Please enter name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  email: Yup.string().trim().required('Please enter email').email('Please enter valid email'),
  is_active: Yup.boolean(),
  is_monetizely_user: Yup.boolean(),
  user_roles: Yup.array().when('is_monetizely_user', ([is_monetizely_user], schema) =>
    is_monetizely_user ? Yup.array().min(1, 'Please assign roles').required() : schema,
  ),
});
