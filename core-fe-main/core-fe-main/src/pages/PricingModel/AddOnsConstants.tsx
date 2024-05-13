export const getColumns = (handleFormValueChange: any, intl: any) => {
  return [
    {
      field: 'addOnFeatures',
      headerName: intl.formatMessage({ id: 'addOnFeatures' }),
      width: '20%',
    },
    {
      field: 'model',
      headerName: intl.formatMessage({ id: 'model' }),
      width: '20.5%',
    },
    {
      field: 'fee',
      headerName: intl.formatMessage({ id: 'fee' }),
      width: '15%',
    },
    {
      field: 'min',
      headerName: intl.formatMessage({ id: 'min' }),
      width: '14%',
    },
    {
      field: 'max',
      headerName: intl.formatMessage({ id: 'max' }),
      width: '14%',
    },
    {
      field: 'sell_multiple',
      headerName: 'Sell Multiple',
      width: '16%',
    },
  ];
};

export const tierRows: any = {
  tier1: {
    name: 'Good',
    addons: [
      { name: 'SMS' },
      { name: 'Opportunity' },
      { name: 'Sentiment Analysis' },
      { name: 'Whatsapp' },
    ],
  },
  tier2: {
    name: 'Better',
    addons: [{ name: 'Email' }, { name: 'Whatsapp' }],
  },
  tier3: {
    name: 'Best',
    addons: [{ name: 'Whatsapp' }],
  },
};
