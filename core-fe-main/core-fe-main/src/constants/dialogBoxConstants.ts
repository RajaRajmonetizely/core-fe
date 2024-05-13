export const getProductFields = (productData: any, setProductData: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'productName',
      value: productData,
      setValue: setProductData,
      isRequired: true,
    },
    {
      type: 'object',
      key: 'description',
      name: 'productDetails',
      value: productData,
      setValue: setProductData,
      isRequired: false,
    },
  ];
};

export const getPlanFields = (tierValue: any, setTierValue: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'tierName',
      value: tierValue,
      setValue: setTierValue,
      isRequired: true,
    },
  ];
};

export const getFeatureFields = (feature: any, setFeature: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'featureName',
      value: feature,
      setValue: setFeature,
      isRequired: true,
    },
    {
      type: 'object',
      key: 'external_name',
      name: 'featureExternalName',
      value: feature,
      setValue: setFeature,
      isRequired: false,
    },
    {
      type: 'object',
      key: 'external_description',
      name: 'featureExternalDescription',
      value: feature,
      setValue: setFeature,
      isRequired: false,
    },
  ];
};

export const getFeatureGroupFields = (featureGroup: any, setFeatureGroup: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'featureGroupName',
      value: featureGroup,
      setValue: setFeatureGroup,
      isRequired: true,
    },
    {
      type: 'object',
      key: 'external_name',
      name: 'featureGroupExternalName',
      value: featureGroup,
      setValue: setFeatureGroup,
      isRequired: false,
    },
    {
      type: 'object',
      key: 'external_description',
      name: 'featureGroupExternalDescription',
      value: featureGroup,
      setValue: setFeatureGroup,
      isRequired: false,
    },
  ];
};

export const getColumnFields = (
  columnData: any,
  setColumnName: any,
  structure: string,
  isEdit: boolean,
  columns: any,
) => {
  let options = [{ name: 'normal' }];
  const configOptions = [{ name: 'select' }, { name: 'unitColumn' }];
  if (structure === 'Custom') {
    options.push({ name: 'range' });
    options.push({ name: 'upto' });
  }
  options = options.concat([{ name: 'intermediate' }]);
  const uptoColumns = columns.filter((item: any) => item.is_upto_column);
  const metricColumns = columns.filter((item: any) => item.is_metric_column);
  const outputColumns = columns.filter((item: any) => item.is_output_column);
  if (isEdit || metricColumns.length + uptoColumns.length > outputColumns.length) {
    options.push({ name: 'output' });
  }
  const outputArray = [];
  if (columnData.columnType === 'normal') {
    outputArray.push({
      type: 'object',
      key: 'config',
      name: 'config',
      value: columnData,
      setValue: setColumnName,
      fieldType: 'select',
      options: configOptions,
    });
  }
  if (columnData.columnType === 'output' || columnData.columnType === 'intermediate') {
    outputArray.push({
      type: 'object',
      key: 'outputFormulaValue',
      name: 'outputFormula',
      value: columnData,
      setValue: setColumnName,
    });
  }
  return [
    {
      type: 'object',
      key: 'name',
      name: 'columnName',
      value: columnData,
      setValue: setColumnName,
    },
    {
      type: 'object',
      key: 'columnType',
      name: 'columnType',
      value: columnData,
      setValue: setColumnName,
      fieldType: 'select',
      readonly: isEdit,
      options,
    },
    ...outputArray,
  ];
};

export const getMetricFields = (metricValue: any, setMetricValue: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'metric',
      value: metricValue,
      setValue: setMetricValue,
      isRequired: true,
    },
  ];
};

export const getStageFields = (stageValue: any, setStageValue: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'stageName',
      value: stageValue,
      setValue: setStageValue,
      isRequired: true,
    },
  ];
};

export const getTypeFields = (typeValue: any, setTypeValue: any) => {
  return [
    {
      type: 'object',
      key: 'name',
      name: 'typeName',
      value: typeValue,
      setValue: setTypeValue,
      isRequired: true,
    },
  ];
};
