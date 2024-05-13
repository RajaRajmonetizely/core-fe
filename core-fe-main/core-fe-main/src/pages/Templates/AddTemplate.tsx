import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Formik, useField } from 'formik';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import TemplateClient from '../../api/Template/TemplateAPIs';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setEditData, setEditMode, setRefetchData } from '../../store/template/template.slice';
import styles from '../../styles/styles';

const FileUpload: React.FunctionComponent<any> = ({ fileRef, ...props }) => {
  const [field, meta] = useField(props);
  return (
    <div style={{ marginLeft: 10 }}>
      <input
        ref={fileRef}
        accept=".doc"
        type="file"
        hidden
        {...field}
        onChange={(u) => {
          const { files } = u.target;
          const selectedFile = files?.[0];
          props.setFile(selectedFile);
          props.setFieldValue('file', u.target.value);
          setTimeout(() => props.setFieldTouched('file', true));
        }}
      />
      {meta.touched && meta.error ? <div style={{ color: 'red' }}>{meta.error}</div> : null}
    </div>
  );
};

const AddTemplate: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const [isAddTemplateDialogOpen, setAddTemplateDialogOpen] = useState<boolean>(false);
  const isEditMode = useSelector((state: any) => state.template.isEditMode);
  const editData = useSelector((state: any) => state.template.editTemplateData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    if (isEditMode) {
      setAddTemplateDialogOpen(true);
    }
  }, [isEditMode]);

  const openAddTemplateDialog = () => {
    setAddTemplateDialogOpen(true);
  };

  const handleClose = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    setAddTemplateDialogOpen(false);
  };

  const submit = async (values: any) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('description', values.description);
    if (file !== null) {
      formData.append('file', file);
    }
    try {
      setIsSaving(true);
      if (isEditMode) {
        const response = await TemplateClient.updateTemplate(values.id, formData);
        if (response.message === 'File Updated successfully') {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'templateUpdated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          dispatch(setEditMode(false));
          dispatch(setEditData({}));
          setIsSaving(false);
          setAddTemplateDialogOpen(false);
          setFile(null);
        }
      } else {
        const response = await TemplateClient.addTemplate(formData);
        if (response.message === 'success') {
          setSnackBarValues({
            display: true,
            message: intl.formatMessage({ id: 'templateCreated' }),
            type: 'success',
          });
          dispatch(setRefetchData(true));
          setIsSaving(false);
          setAddTemplateDialogOpen(false);
          setFile(null);
        }
      }
    } catch (e) {
      setIsSaving(false);
      setFile(null);
      console.error(e);
    }
  };

  const fileRef = useRef(null);
  const addValidationSchema = Yup.object({
    name: Yup.string().trim().required('Please enter Template Name'),
    description: Yup.string().trim().required('Please enter Template description'),
    file: Yup.mixed().required('File is required'),
  });
  const editValidationSchema = Yup.object({
    name: Yup.string().trim().required('Please enter Template Name'),
    description: Yup.string().trim().required('Please enter Template description'),
  });

  return (
    <>
      <Button
        sx={styles.dialogButton}
        onClick={() => {
          openAddTemplateDialog();
        }}>
        <FormattedMessage id="addTemplate" />
      </Button>
      <Dialog open={isAddTemplateDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle className="fieldHeader">
          <FormattedMessage id="addTemplate" />
        </DialogTitle>
        <DialogContent dividers>
          <Formik
            onSubmit={submit}
            enableReinitialize
            initialValues={
              isEditMode
                ? editData
                : {
                    name: '',
                    description: '',
                    file: '',
                  }
            }
            validationSchema={isEditMode ? editValidationSchema : addValidationSchema}>
            {({ values, errors, touched, setFieldTouched, setFieldValue, handleSubmit }) => {
              return (
                <>
                  <Grid>
                    <Stack>
                      <Grid item md={12}>
                        <Typography className="fieldHeader">
                          <FormattedMessage id="templateName" />
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>
                        <TextField
                          label={intl.formatMessage({ id: 'templateName' })}
                          id="name"
                          name="name"
                          variant="outlined"
                          fullWidth
                          required
                          value={values.name}
                          sx={{ marginY: '10px' }}
                          onChange={(u) => {
                            setFieldValue('name', u.target.value);
                            setTimeout(() => setFieldTouched('name', true));
                          }}
                          error={Boolean(errors.name && touched.name)}
                          helperText={errors.name as string}
                        />
                        <Typography className="fieldHeader">
                          <FormattedMessage id="description" />
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>
                        <TextField
                          multiline
                          fullWidth
                          label={intl.formatMessage({ id: 'description' })}
                          id="description"
                          name="description"
                          variant="outlined"
                          required
                          value={values.description}
                          disabled={editData.account_ext_id}
                          sx={{ marginY: '10px' }}
                          onChange={(u) => {
                            setFieldValue('description', u.target.value);
                            setTimeout(() => setFieldTouched('description', true));
                          }}
                          error={Boolean(errors.description && touched.description)}
                          helperText={errors.description as string}
                        />
                        <Typography className="fieldHeader">
                          <FormattedMessage id="uploadFile" />
                          <span style={{ color: 'red' }}> *</span>
                        </Typography>
                        <Button
                          variant="contained"
                          component="label"
                          sx={{ marginY: '10px' }}
                          startIcon={<CloudUploadIcon />}>
                          Upload
                          <FileUpload
                            name="file"
                            fileRef={fileRef}
                            value={values.s3_doc_file_path}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                            setFile={setFile}
                          />
                        </Button>
                        {isEditMode ? (
                          <Chip
                            label={
                              values?.file
                                ? values?.file?.split('\\').pop()
                                : editData?.s3_doc_file_path?.split('/').pop()
                            }
                            sx={{ ml: 1 }}
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label={values?.file?.split('\\').pop()}
                            sx={{ ml: 1, display: values?.file ? '' : 'none' }}
                            variant="outlined"
                          />
                        )}
                        <br />
                        <br />
                      </Grid>
                    </Stack>
                  </Grid>
                  <DialogActions>
                    <Button sx={styles.dialogButton} onClick={handleClose}>
                      <FormattedMessage id="cancel" />
                    </Button>
                    <Button
                      disabled={isSaving}
                      sx={styles.dialogButton}
                      onClick={() => handleSubmit()}>
                      {isSaving ? (
                        <CircularProgress color="inherit" size={24} />
                      ) : (
                        <FormattedMessage id="save" />
                      )}
                    </Button>
                  </DialogActions>
                </>
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>
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

export default injectIntl(AddTemplate);
