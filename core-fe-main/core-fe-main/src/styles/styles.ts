const styles = {
  dialogButton: {
    backgroundColor: '#5D5FEF',
    fontStyle: 'normal',
    fontWeight: 700,
    padding: '10px 20px',
    color: 'white',
    ':hover': { backgroundColor: '#5D5FEF' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
  },
  tabLabelStyle: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    fontWeight: 700,
  },
  tableCell: {
    fontFamily: 'Helvetica',
    fontStyle: 'normal',
    lineHeight: '16px',
    textAlign: 'center',
  },
};
export default styles;
