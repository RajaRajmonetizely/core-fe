const componentStyle = {
  tableContainer: {
    minWidth: 700,
  },
  tableCell: {
    textAlign: 'center',
    color: '#3B3F4D',
    fontFamily: 'Helvetica',
    fontWeight: 700,
  },
  tableHeaderRow: {
    background: '#F4F6FE',
  },
  productLabel: {
    color: '#3B3F4D',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    paddingLeft: '42px',
  },
  tierLabel: {
    color: '#576079',
    fontFamily: 'Helvetica',
    fontWeight: 400,
    paddingLeft: '42px',
  },
  tierSubData: {
    color: '#576079',
    fontFamily: 'Helvetica',
    fontWeight: 400,
  },
  tierSubPaddingLeft: {
    paddingLeft: '30px',
  },
  resetIconPosition: {
    display: 'table',
    zIndex: '100',
    marginBottom: '-29px',
    marginLeft: '-26px',
  },
  productRow: {
    backgroundColor: '#E5E5E575',
  },
  tableSpace: {
    minWidth: '300px',
    paddingLeft: '42px',
  },
  lastItem: {
    paddingRight: '42px',
  },
  textCenter: {
    textAlign: 'center',
  },
  displayFlex: {
    display: 'flex',
  },
  rightContainer: {
    marginLeft: 'auto',
  },
  purpleBox: {
    border: '#5D5FEF 5px solid',
    borderRadius: '10px',
    padding: '24px',
    marginTop: '24px',
  },
  boxMargin: {
    marginTop: '24px',
  },
  whiteSectionName: {
    color: 'white',
    marginBottom: '8px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
    marginLeft: '8px',
  },
  sectionName: {
    color: '#3B3F4D',
    marginBottom: '8px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
    marginLeft: '8px',
  },
  sectionBox: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    verticalAlign: 'top',
    marginBottom: '8px',
    width: '25%',
  },
  inputBox: {
    background: 'white',
    '& fieldset': { border: 'none' },
    borderRadius: '4px',
  },
  policyContainer: {
    display: 'flex',
  },
  helpIcon: {
    color: '#576079',
    marginTop: 'auto',
    marginBottom: '26px',
    marginLeft: '2px',
    marginRight: '24px',
  },
  settingsContainer: {
    display: 'flex',
    cursor: 'pointer',
    marginLeft: 'auto',
    maxWidth: '200px',
  },
  settingsConfigText: {
    color: '#4168E1',
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'uppercase',
    marginTop: 'auto',
    marginBottom: 'auto',
    textAlign: 'left',
  },
  iconStyle: {
    marginTop: 'auto',
    marginBottom: 'auto',
    marginRight: '8px',
  },
  btnRight: {
    marginRight: '12px',
  },
  formControlStyle: {
    m: 1,
    width: '100%',
  },
  inputField: {
    '& fieldset': { border: 'none' },
  },
  centerLoader: {
    textAlign: 'center',
  },
  alertMessage: {
    color: 'red',
  },
  cellContainer: {
    display: 'flex',
    cursor: 'pointer',
  },
  cellText: (isError: boolean) => {
    return {
      marginLeft: 'auto',
      marginTop: 'auto',
      marginBottom: 'auto',
      marginRight: !isError ? 'auto' : 'unset',
    };
  },
  infoIcon: {
    color: 'red',
    fontSize: '1.1rem',
    marginLeft: '4px',
    marginTop: 'auto',
    marginBottom: 'auto',
    marginRight: 'auto',
  },
  tooltipStyle: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 400,
    bgcolor: '#EFAAAA',
    fontSize: '1.2rem',
    color: '#000000',
    padding: '16px',
  },
  loaderStyle: {
    color: 'white',
  },
  configBtn: {
    display: 'flex',
    marginTop: 2,
    marginLeft: 'auto !important',
  },
};

export default componentStyle;
