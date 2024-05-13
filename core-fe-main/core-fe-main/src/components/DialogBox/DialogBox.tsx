import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Formik } from 'formik';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';
import styles from '../../styles/styles';
import './DialogBox.scss';
import CodeEditor from '../CodeEditor/CodeEditor';

interface DialogConfig {
  dialogConfig: {
    name: string;
    isRightMenu?: boolean;
    fields: any[];
    open: boolean;
    loader?: boolean;
    handleSave: any;
    handleClose: any;
    schema: any;
    initialValues: any;
  };
}

const componentsStyle = {
  pricingModelDialogStyle: {
    '& .MuiDialog-container': {
      justifyContent: 'right',
    },
    '& .MuiDialog-paper': {
      marginRight: '0px',
      marginBottom: '0px',
      marginTop: '0px',
      borderRadius: '0px',
      minHeight: '100vh',
    },
  },
  headerTitle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: '1.3rem',
  },
  closeIconStyle: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    cursor: 'pointer',
  },
  titleContainer: {
    display: 'flex',
  },
  bottomBtn: {
    position: 'absolute',
    right: '20px',
    bottom: '20px',
  },
};

const DialogBox: React.FC<DialogConfig> = ({
  dialogConfig = {
    name: '',
    isRightMenu: false,
    fields: [],
    open: false,
    loader: false,
    handleSave: () => {},
    handleClose: () => {},
    schema: {},
    initialValues: {},
  },
}): ReactElement => {
  const [isAdvance, setIsAdvance] = useState<boolean>(false);
  const [formula, setFormula] = useState<any>('');
  const [code, setCode] = useState<any>('');
  const [codeField, setCodeField] = useState<any>();

  useEffect(() => {
    if (dialogConfig?.fields.length)
      dialogConfig?.fields.forEach((f: any) => {
        if (f.key === 'outputFormulaValue' && f.type === 'object') {
          if (f.value?.is_code_editor) {
            setIsAdvance(true);
          }
          setCode(f.value?.advance_formula || '');
          setFormula(f.value?.outputFormula || '');
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCodeValue = (value: string) => {
    value = value.toLowerCase();
    setCode(value);
    codeField.setValue({
      ...codeField.value,
      advance_formula: value,
      formula: value,
      [codeField.key]: value,
    });
  };

  return (
    <Dialog
      sx={dialogConfig.isRightMenu ? componentsStyle.pricingModelDialogStyle : {}}
      onClose={(event: any, reason: string) => {
        if (reason === 'backdropClick') {
          dialogConfig.handleClose();
        }
      }}
      open={dialogConfig?.open}
      fullWidth
      maxWidth="sm">
      <Formik
        onSubmit={dialogConfig.handleSave}
        initialValues={dialogConfig.initialValues}
        enableReinitialize
        validationSchema={dialogConfig.schema}>
        {({
          errors,
          touched,
          setFieldTouched,
          setFieldValue,
          handleSubmit,
          /* and other goodies */
        }) => {
          return (
            <>
              <DialogTitle>
                <Box sx={componentsStyle.titleContainer}>
                  <Box sx={componentsStyle.headerTitle}>
                    <FormattedMessage id={dialogConfig?.name} />
                  </Box>
                  <CloseIcon
                    onClick={dialogConfig.handleClose}
                    sx={componentsStyle.closeIconStyle}
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {dialogConfig?.fields.length &&
                  dialogConfig?.fields.map((f: any) => {
                    return (
                      <>
                        <Typography className="prodHeading" key={f.name}>
                          <FormattedMessage id={f.name} key={`${f.name}msg`} />
                          {f?.isRequired ? <span style={{ color: 'red' }}> *</span> : ''}
                        </Typography>
                        {f.fieldType === 'select' ? (
                          <FormControl
                            error={Boolean(errors[f.key] && touched[f.key])}
                            sx={{ width: '100%' }}>
                            <Select
                              key={`${f.name}text`}
                              id="demo-simple-select"
                              name={f.key}
                              fullWidth
                              error={Boolean(errors[f.key] && touched[f.key])}
                              readOnly={f.readonly ?? false}
                              value={
                                f.type === 'object' && f.value[f?.key] ? f.value[f?.key] : f.value
                              }
                              onChange={(event) => {
                                const { value } = event.target;
                                setFieldValue(f.key, value);
                                f.setValue(
                                  f.type === 'object' ? { ...f.value, [f.key]: value } : value,
                                );
                              }}>
                              {f.options.map((option: any) => {
                                return (
                                  <MenuItem key={uuidv4()} value={option.name}>
                                    {f.dynamicName ? (
                                      option.name
                                    ) : (
                                      <FormattedMessage id={option.name} />
                                    )}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                            {errors[f.key] && touched[f.key] ? (
                              <FormHelperText>{errors[f.key] as string}</FormHelperText>
                            ) : null}
                          </FormControl>
                        ) : (
                          <>
                            {f.key === 'outputFormulaValue' ? (
                              <FormControlLabel
                                sx={{ marginTop: '-16px' }}
                                control={
                                  <Checkbox
                                    checked={isAdvance}
                                    onChange={(event) => {
                                      f.value.is_code_editor = event.target.checked;
                                      setIsAdvance(() => event.target.checked);
                                      if (event.target.checked) {
                                        setFieldValue(f.key, code || '');
                                        f.setValue({
                                          ...f.value,
                                          formula: code,
                                          [f.key]: code,
                                        });
                                      } else {
                                        setFieldValue(f.key, formula || '');
                                        f.setValue({
                                          ...f.value,
                                          formula,
                                          [f.key]: formula,
                                        });
                                      }
                                    }}
                                  />
                                }
                                label="Advance editor"
                              />
                            ) : null}

                            {isAdvance && f.key === 'outputFormulaValue' ? (
                              <>
                                {setCodeField(f)}
                                <CodeEditor code={f.value[f?.key]} setCodeData={setCodeValue} />
                              </>
                            ) : (
                              <TextField
                                key={`${f.name}text`}
                                id="prod-name"
                                name={f.key}
                                multiline={f.key === 'outputFormulaValue'}
                                minRows={18}
                                InputProps={{ readOnly: f.readonly }}
                                variant="outlined"
                                fullWidth
                                value={f.type === 'object' ? f.value[f?.key] : f.value}
                                error={Boolean(errors[f.key] && touched[f.key])}
                                helperText={errors[f.key] as string}
                                onChange={(event) => {
                                  // eslint-disable-next-line
                                  let value;
                                  if (f.key === 'outputFormulaValue') {
                                    value = event.target.value.toLowerCase();
                                  } else {
                                    value = event.target.value;
                                  }
                                  if (f.key === 'outputFormulaValue' && !isAdvance) {
                                    if (value) {
                                      value = value.replace(/(?:\r\n|\r|\n)/g, '');
                                    }
                                  }
                                  setFieldValue(f.key, value);
                                  setTimeout(() => setFieldTouched(f.key, true));
                                  if (f.key === 'outputFormulaValue' && f.type === 'object') {
                                    if (!isAdvance) {
                                      setFormula(value);
                                      f.setValue({
                                        ...f.value,
                                        outputFormula: value,
                                        formula: value,
                                        [f.key]: value,
                                      });
                                    }
                                  } else {
                                    f.setValue(
                                      f.type === 'object' ? { ...f.value, [f.key]: value } : value,
                                    );
                                  }
                                }}
                              />
                            )}
                          </>
                        )}
                        <br />
                        <br />
                      </>
                    );
                  })}
                <DialogActions sx={dialogConfig.isRightMenu ? componentsStyle.bottomBtn : {}}>
                  <Button sx={styles.dialogButton} onClick={dialogConfig?.handleClose}>
                    <FormattedMessage id="cancel" />
                  </Button>
                  <Button sx={styles.dialogButton} onClick={() => handleSubmit()}>
                    {dialogConfig.loader ? (
                      <CircularProgress sx={{ color: 'white' }} size={24} />
                    ) : (
                      <FormattedMessage id="save" />
                    )}
                  </Button>
                </DialogActions>
              </DialogContent>
            </>
          );
        }}
      </Formik>
    </Dialog>
  );
};

export default DialogBox;
