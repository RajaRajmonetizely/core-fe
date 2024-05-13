import componentMapper from '@data-driven-forms/mui-component-mapper/component-mapper';
import FormTemplate from '@data-driven-forms/mui-component-mapper/form-template';
import { FormRenderer, componentTypes } from '@data-driven-forms/react-form-renderer';
import { Button, Chip, IconButton, Paper, Typography } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import React, { ReactElement, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import PageLoader from '../../components/PageLoader/PageLoader';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';

interface IProps {
  intl?: any;
}

const DealTerms: React.FC<IProps> = ({ intl }): ReactElement => {
  const [schema1, setSchema1] = useState<any>({});
  const [schema3, setSchema3] = useState<any>({});
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [defaultKeys, setDefaultKeys] = useState<string[]>([]);
  const [editableField, setEditableField] = useState<any>(null);

  useEffect(() => {
    getDealTerms();
    // eslint-disable-next-line
  }, []);

  const getDealTerms = () => {
    TenantsClient.getDealTerms()
      .then((response) => {
        const responseObj = response.data.map((schema: any) => {
          if (schema.component === 'date-picker' && schema.initialValue) {
            schema.initialValue = new Date(schema.initialValue);
          }
          return schema;
        });
        setSchema1({ fields: responseObj });
        setDefaultKeys(response.data.map((schema: any) => schema.name));
      })
      .catch((e) => {
        console.error(e);
        setSnackBarValues({
          type: 'error',
          display: true,
          message: intl.formatMessage({ id: 'defaultTermsError' }),
        });
      });
  };

  const schema2 = {
    fields: [
      {
        component: componentTypes.FIELD_ARRAY,
        name: 'new_terms',
        fieldKey: 'field_array',
        title: 'New Terms',
        label: 'New Terms',
        minItems: 1,
        FormFieldGridProps: { xs: 12 },
        itemDefault: {
          name: 'Enter field key',
          label: 'Enter field label',
          component: '',
          initalValue: 'Enter default value',
          options: '',
        },
        fields: [
          {
            component: componentTypes.TEXT_FIELD,
            name: 'name',
            label: 'Key',
            isRequired: true,
            validate: [{ type: 'required', message: 'Key is required' }],
            FormFieldGridProps: { xs: 4, p: 2 },
          },
          {
            component: componentTypes.TEXT_FIELD,
            name: 'label',
            label: 'Label',
            isRequired: true,
            validate: [{ type: 'required', message: 'Label is required' }],
            FormFieldGridProps: { xs: 4, p: 2 },
          },
          {
            component: componentTypes.SELECT,
            name: 'component',
            label: 'Type',
            isRequired: true,
            validate: [{ type: 'required', message: 'Type is required' }],
            FormFieldGridProps: { xs: 4, p: 2, marginTop: -2 },
            options: [
              {
                label: 'Text Field',
                value: 'text-field',
              },
              {
                label: 'Dropdown',
                value: 'select',
              },
              {
                label: 'Checkbox',
                value: 'checkbox',
              },
              {
                label: 'Radio Button',
                value: 'radio',
              },
              {
                label: 'Date Picker',
                value: 'date-picker',
              },
            ],
            isSearchable: true,
            isClearable: true,
          },
          {
            component: componentTypes.TEXT_FIELD,
            name: 'initialValue',
            label: 'Default Value',
            FormFieldGridProps: { xs: 4, p: 2 },
          },
          {
            component: componentTypes.TEXT_FIELD,
            name: 'options',
            label: 'Options',
            isRequired: true,
            validate: [{ type: 'required', message: 'Options are required' }],
            placeholder: 'Please enter comma separated values',
            condition: {
              when: (field: any) => {
                const conditionalFieldName = field?.name?.split('.')[0];
                return `${conditionalFieldName}.component`;
              },
              is: ['select', 'radio'],
            },
            FormFieldGridProps: { xs: 4, p: 2 },
          },
        ],
      },
    ],
  };

  const onAddTerms = (values: any, form: any) => {
    if (values.new_terms?.length) {
      if (validateKey(values.new_terms)) {
        const outputData = values.new_terms.map((newTerm: any) => {
          if (newTerm.component === 'select' || newTerm.component === 'radio') {
            newTerm.initialValue = newTerm.initialValue?.trim().toLowerCase();
            const splitOptions = newTerm.options.split(',');
            const trimOptions = splitOptions.map((element: string) => element.trim());
            const optionsArray = trimOptions.map((option: string) => {
              return {
                label: option.charAt(0).toUpperCase() + option.slice(1),
                value: option.toLowerCase(),
              };
            });
            return {
              ...newTerm,
              options: optionsArray,
              FormFieldGridProps:
                newTerm.component === 'select' ? { xs: 4, p: 2, marginTop: -2 } : { xs: 4, p: 2 },
            };
          }
          return {
            ...newTerm,
            FormFieldGridProps:
              newTerm.component === 'date-picker'
                ? { xs: 4, p: 2, marginTop: -2 }
                : { xs: 4, p: 2 },
          };
        });
        setSchema1({
          fields: [...schema1.fields, ...outputData],
        });
        form.reset({ 'new_terms[0].name': '' });
      }
    }
  };
  const onUpdateTerm = (value: any) => {
    let updatedValue = {};
    if (Object.keys(value).length) {
      if (value.component === 'select' || value.component === 'radio') {
        value.initialValue = value.initialValue?.trim().toLowerCase();
        const splitOptions = value.options.split(',');
        const trimOptions = splitOptions.map((element: string) => element.trim());
        const optionsArray = trimOptions.map((option: string) => {
          return {
            label: option.charAt(0).toUpperCase() + option.slice(1),
            value: option.toLowerCase(),
          };
        });
        updatedValue = {
          ...value,
          options: optionsArray,
          FormFieldGridProps:
            value.component === 'select' ? { xs: 4, p: 2, marginTop: -2 } : { xs: 4, p: 2 },
        };
      } else {
        updatedValue = {
          ...value,
          initialValue: value.initialValue?.trim().toLowerCase(),
          FormFieldGridProps:
            value.component === 'date-picker' ? { xs: 4, p: 2, marginTop: -2 } : { xs: 4, p: 2 },
        };
      }
      const updatedSchemaFields = schema1.fields.map((field: any) => {
        if (field.label === value.label) {
          return updatedValue;
        }
        return field;
      });
      setSchema1({ fields: updatedSchemaFields });
      setEditableField(null);
      setSchema3({});
      setSnackBarValues({
        display: true,
        type: 'success',
        message: `"${value.label}" field is successfully updated.Please verify it and press submit.`,
      });
    }
  };

  const validateKey = (newTerms: any) => {
    let isValid = true;
    const duplicateKeys: string[] = [];
    const newTermKeys = newTerms.map((newTerm: any) => newTerm.name.trim());
    if (new Set(newTermKeys).size !== newTermKeys.length) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'arrayDuplication' }),
      });
      isValid = false;
    } else {
      newTermKeys.forEach((key: string) => {
        if (defaultKeys.includes(key)) {
          duplicateKeys.push(key);
          isValid = false;
        }
      });
      if (!isValid) {
        setSnackBarValues({
          display: true,
          type: 'error',
          message: `Key(s): ${duplicateKeys}, is/are duplicates of default term keys. Please change them.`,
        });
      }
    }
    return isValid;
  };

  const onSubmitDealTerms = (values: any) => {
    const requestObject: any[] = [];
    const initialValueKeys = Object.keys(values);
    schema1?.fields?.forEach((field: any) => {
      if (initialValueKeys.includes(field.name)) {
        initialValueKeys.forEach((key) => {
          if (key === field.name) {
            requestObject.push({ ...field, initialValue: values[key] });
          }
        });
      } else {
        requestObject.push(field);
      }
    });
    TenantsClient.addDealTerms(requestObject)
      .then(() => {
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'dealTermsAddSuccess' }),
        });
      })
      .catch((e) => {
        console.error(e);
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'dealTermsAddFail' }),
        });
      });
  };

  const removeField = (fieldName: string) => {
    const updatedFields = schema1.fields.filter((field: any) => field.name !== fieldName);
    setSchema1({ fields: updatedFields });
  };

  const editField = (field: any) => {
    setEditableField(field);
    const editableSchema: any = {
      fields: [
        {
          component: componentTypes.TEXT_FIELD,
          name: 'name',
          label: 'Key',
          isDisabled: true,
          value: field.name,
          initialValue: field.name,
          FormFieldGridProps: { xs: 4, p: 2 },
        },
        {
          component: componentTypes.TEXT_FIELD,
          name: 'label',
          label: 'Label',
          value: field.label,
          initialValue: field.label,
          isDisabled: true,
          FormFieldGridProps: { xs: 4, p: 2 },
        },
        {
          component: componentTypes.SELECT,
          name: 'component',
          label: 'Type',
          isDisabled: true,
          value: field.component,
          initialValue: field.component,
          FormFieldGridProps: { xs: 4, p: 2, marginTop: -2 },
          options: [
            {
              label: 'Text Field',
              value: 'text-field',
            },
            {
              label: 'Select',
              value: 'select',
            },
            {
              label: 'Checkbox',
              value: 'checkbox',
            },
            {
              label: 'Radio Button',
              value: 'radio',
            },
            {
              label: 'Date Picker',
              value: 'date-picker',
            },
          ],
          isSearchable: true,
          isClearable: true,
        },
        {
          component: componentTypes.TEXT_FIELD,
          name: 'initialValue',
          label: 'Default Value',
          initialValue: field.initialValue ? field.initialValue : '',
          FormFieldGridProps: { xs: 4, p: 2 },
        },
      ],
    };
    if (field.options) {
      const optionValue = field.options
        .map((option: { label: string; value: string }) => option.value)
        .join(', ');
      editableSchema.fields.push({
        component: componentTypes.TEXT_FIELD,
        name: 'options',
        label: 'Options',
        isRequired: true,
        initialValue: optionValue,
        validate: [{ type: 'required', message: 'Options are required' }],
        placeholder: 'Please enter comma separated values',
        FormFieldGridProps: { xs: 4, p: 2 },
      });
    }
    setSchema3(editableSchema);
  };

  return (
    <>
      {schema1?.fields?.length ? (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Paper sx={{ p: 3, m: 1 }}>
            <FormRenderer
              schema={schema1}
              FormTemplate={FormTemplate}
              componentMapper={componentMapper}
              onSubmit={onSubmitDealTerms}
            />
            <div>
              {schema1.fields.map((field: any) => (
                <Chip
                  label={field.label}
                  sx={{ marginLeft: '1rem' }}
                  variant="outlined"
                  onDelete={() => {
                    removeField(field.name);
                  }}
                  deleteIcon={
                    <IconButton
                      size="small"
                      onClick={() => {
                        removeField(field.name);
                      }}
                      aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  }
                  avatar={
                    <IconButton
                      size="small"
                      onClick={() => {
                        editField(field);
                      }}
                      aria-label="edit">
                      <EditIcon />
                    </IconButton>
                  }
                />
              ))}
              <br />
            </div>
          </Paper>

          <br />
          {!editableField && (
            <Paper sx={{ p: 3, m: 1 }}>
              <FormRenderer
                componentMapper={componentMapper}
                schema={schema2}
                FormTemplate={FormTemplate}
                onSubmit={onAddTerms}
              />
            </Paper>
          )}
          {editableField && (
            <Paper sx={{ p: 3, m: 1 }}>
              <Typography
                sx={{ marginLeft: '1rem' }}
                variant="subtitle1">{`Edit "${editableField.label}"`}</Typography>
              <Button
                onClick={() => {
                  setEditableField(null);
                  setSchema3({});
                }}
                sx={{ float: 'right', marginTop: '-2rem' }}>
                close
              </Button>
              <FormRenderer
                componentMapper={componentMapper}
                schema={schema3}
                FormTemplate={FormTemplate}
                onSubmit={onUpdateTerm}
              />
            </Paper>
          )}
        </LocalizationProvider>
      ) : (
        <PageLoader />
      )}
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

export default injectIntl(DealTerms);
