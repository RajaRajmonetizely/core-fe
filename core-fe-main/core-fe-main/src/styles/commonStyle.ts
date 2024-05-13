const commonStyle = {
  button: {
    backgroundColor: '#865DDA',
    ':hover': { backgroundColor: '#865DDA' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    color: 'white',
    fontStyle: 'normal',
    fontWeight: 700,
    padding: '12px 40px',
  },
  orangeButton: {
    backgroundColor: '#F27A54',
    ':hover': { backgroundColor: '#F27A54' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    color: 'white',
    fontStyle: 'normal',
    fontWeight: 700,
    padding: '12px 40px',
    borderRadius: '10px',
  },
  blueButton: {
    backgroundColor: '#4168E1',
    ':hover': { backgroundColor: '#4168E1' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    color: 'white',
    fontStyle: 'normal',
    fontWeight: 700,
    padding: '12px 40px',
    borderRadius: '10px',
  },
  customButton: (
    bgColor?: string | null,
    color?: string | null,
    borderRadius?: string | null,
    padding?: string | null,
  ) => {
    return {
      backgroundColor: bgColor ?? '#4168E1',
      ':hover': { backgroundColor: bgColor ?? '#4168E1' },
      '&:disabled': {
        color: color ?? 'white',
        opacity: 0.5,
      },
      color: color ?? 'white',
      fontStyle: 'normal',
      fontWeight: 700,
      padding: padding ?? '12px 40px',
      borderRadius: borderRadius ?? '10px',
    };
  },
  greyButton: {
    color: '#C4C4C4',
    fontStyle: 'normal',
    fontWeight: 700,
    padding: '12px 40px',
    borderRadius: '10px',
  },

  bodyContainer: {
    marginRight: '20px',
    marginLeft: '10px',
  },
  verticalCenter: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  horizontalCenter: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  displayFlex: {
    display: 'flex',
  },
  dateGridStyle: {
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: 'rgba(226, 232, 240, 1)',
      color: 'rgba(59, 63, 77, 1)',
      fontFamily: 'Helvetica',
      fontSize: '16px',
      paddingTop: '36px',
      paddingBottom: '36px',
      textAlign: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,
    },
    '& .MuiDataGrid-columnHeader:focus-within': {
      outline: 'none !important',
    },
    '& .MuiDataGrid-cell:focus': {
      outline: 'none !important',
    },
    '& .MuiDataGrid-cell:hover': {
      cursor: 'pointer',
    },
    '& .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },
    '& .MuiDataGrid-cell': {
      textAlign: 'center',
      color: 'rgba(87, 96, 121, 1)',
      fontFamily: 'Helvetica',
      fontWeight: 400,
      paddingTop: '24px',
      paddingBottom: '24px',
    },
  },
};
export default commonStyle;
