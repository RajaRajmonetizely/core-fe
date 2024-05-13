import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PreviewIcon from '@mui/icons-material/Preview';
import { Backdrop, Box, CircularProgress, Tooltip } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import React, { ReactElement, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import TemplateClient from '../../api/Template/TemplateAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setEditData, setEditMode, setRefetchData } from '../../store/template/template.slice';
import commonStyle from '../../styles/commonStyle';
import Preview from '../DealHub/Preview';

const ViewTemplates: React.FC<any> = ({ intl, loader }): ReactElement => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const templates = useSelector((state: any) => state.template.templates);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [pdfLink, setPdfLink] = useState<any>('');
  const [openPreview, setOpenPreview] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'name' }),
      flex: 1,
    },
    {
      field: 'description',
      headerAlign: 'left',
      align: 'left',
      headerName: intl.formatMessage({ id: 'description' }),
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
            key={params.row.id}
            icon={
              <Tooltip title="Edit" placement="top">
                <EditIcon />
              </Tooltip>
            }
            label="Edit"
            onClick={() => onEditTemplate(params)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Delete" placement="top">
                <DeleteIcon />
              </Tooltip>
            }
            label="Delete"
            onClick={() => onDeleteTemplate(params)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Download" placement="top">
                <FileDownloadIcon />
              </Tooltip>
            }
            label="Download"
            onClick={() => onDownloadTemplate(params)}
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title="Preview" placement="top">
                <PreviewIcon />
              </Tooltip>
            }
            label="Preview"
            onClick={() => onPreviewTemplate(params)}
          />,
        ];
      },
    },
  ];

  const onEditTemplate = (data: any) => {
    if (ability.can('PUT', 'Template Management')) {
      dispatch(setEditData(data.row));
      dispatch(setEditMode(true));
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const onDownloadTemplate = (data: any) => {
    if (ability.can('GET', 'Template Management')) {
      TemplateClient.getTemplateById(data.row.id)
        .then((response) => {
          const filePath = response.data.s3_doc_file_path.split('/');
          const fileName = filePath[filePath.length - 1];
          const link = document.createElement('a');
          link.href = response.data.presigned_url;
          link.download = fileName;
          link.target = '_self';
          link.click();
        })
        .catch((e) => {
          console.error(e);
        });
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const onPreviewTemplate = (data: any) => {
    if (ability.can('GET', 'Template Management')) {
      setIsPdfLoading(true);
      TemplateClient.getTemplateById(data.row.id)
        .then((response) => {
          if (response.message === 'success') {
            setIsPdfLoading(false);
            setPdfLink(response.data.pdf_presigned_url);
            setOpenPreview(true);
          }
        })
        .catch((e) => {
          setIsPdfLoading(false);
          console.error(e);
        });
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  const onDeleteTemplate = (data: any) => {
    if (ability.can('DELETE', 'Template Management')) {
      TemplateClient.deleteTemplate(data.row.id)
        .then(() => {
          dispatch(setRefetchData(true));
          setSnackBarValues({
            display: true,
            type: 'success',
            message: intl.formatMessage({ id: 'deleteTemplate' }),
          });
        })
        .catch((e) => {
          setSnackBarValues({
            display: true,
            type: 'error',
            message: intl.formatMessage({ id: 'failureMessage' }),
          });
          console.error(e);
        });
    } else
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
  };

  return (
    <>
      <br />
      <Box sx={{ height: '520px', width: '100%' }}>
        <DataGrid
          rows={loader ? [] : templates}
          columns={columns}
          density="comfortable"
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          loading={loader}
          sx={commonStyle.dateGridStyle}
          pageSizeOptions={[5]}
          disableRowSelectionOnClick
          disableColumnMenu
        />
        {openPreview && (
          <Preview open={openPreview} onClose={() => setOpenPreview(false)} pdf={pdfLink} />
        )}
      </Box>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isPdfLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </>
  );
};
export default injectIntl(ViewTemplates);
