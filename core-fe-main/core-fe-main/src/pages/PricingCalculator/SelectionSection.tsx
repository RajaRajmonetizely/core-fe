import CommentIcon from '@mui/icons-material/Comment';
import SyncIcon from '@mui/icons-material/Sync';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  Paper,
  SwipeableDrawer,
  Typography,
} from '@mui/material';
import React, { ReactElement, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import SalesForceClient from '../../api/SalesForce/SalesForceAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import CommentLists from '../../components/CommentLists';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';

// import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
// import { updatePricingMetrics } from '../../store/pricing_model/pricingModel.slice';

const componentStyle = {
  sectionName: {
    color: '#3B3F4D',
    marginBottom: '14px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  sectionBox: {
    display: 'inline-block',
    width: '300px',
    verticalAlign: 'top',
  },
  btnStyle: {
    background: '#5D5FEF',
    ':hover': { backgroundColor: '#5D5FEF' },
    '&:disabled': {
      color: 'white',
      opacity: 0.5,
    },
    color: 'white',
    fontFamily: 'Helvetica',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '10px 20px',
  },
  btnContainer: {
    marginLeft: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  paperContainer: {
    minHeight: '120px',
    display: 'flex',
    padding: '18px 33px',
  },
  syncIconStyle: {
    marginRight: '8px',
  },
  loaderStyle: {
    color: 'white',
    marginLeft: '40px',
    marginRight: '40px',
  },
  commentsIcon: {
    color: '#3B3F4D',
    fontSize: '2rem',
    marginLeft: '24px',
    marginTop: 'auto',
    marginBottom: 'auto',
    cursor: 'pointer',
  },
};

interface IProps {
  selectedOpportunity: any;
  setSelectedOpportunity: any;
  selectedQuote: any;
  selectedPricingBook: any;
  setSelectedPricingBook: any;
  setSelectedQuote: any;
  opportunitiesLoader: boolean;
  priceBookLoader: boolean;
  quoteLoader: boolean;
  intl: any;
  comments: any;
  displayConfig?: {
    showPriceBook: boolean;
    showOpportunity: boolean;
    showQuote: boolean;
  };
}

export const dropdownComponent = (
  id: string,
  caption: string,
  options: any,
  selectedItem: any,
  setSelectedData: any,
  loading: boolean,
) => {
  return (
    <Box sx={componentStyle.sectionBox}>
      <Typography sx={componentStyle.sectionName}>
        <FormattedMessage id={id} />
      </Typography>
      <FormControl sx={{ m: 1, minWidth: 245 }}>
        <SearchAddAutocomplete
          caption={caption}
          data={options}
          selectedItem={selectedItem}
          setSelectedData={setSelectedData}
          showSelectionValue
          showAddOption={false}
          loading={loading}
        />
      </FormControl>
    </Box>
  );
};

const SelectionSection: React.FC<IProps> = ({
  selectedOpportunity,
  setSelectedOpportunity,
  selectedPricingBook,
  selectedQuote,
  setSelectedPricingBook,
  setSelectedQuote,
  opportunitiesLoader,
  priceBookLoader,
  quoteLoader,
  intl,
  comments,
  displayConfig = {
    showPriceBook: true,
    showOpportunity: true,
    showQuote: true,
  }, // all three parameters can be passed as config
}): ReactElement => {
  const opportunity = useSelector((state: any) => state.opportunity.opportunities);
  const priceBooks = useSelector((state: any) => state.priceBook.priceBooks);
  const quoteVersions = useSelector((state: any) => state.pricingCalculator.quoteVersions);
  const [loader, setLoader] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [openComments, setOpenComments] = useState(false);

  const syncSalesForceData = async () => {
    try {
      setLoader(true);
      await SalesForceClient.syncSalesForceData();
      setSnackBarValues({
        type: 'success',
        display: true,
        message: intl.formatMessage({ id: 'syncTriggered' }),
      });
      setLoader(false);
    } catch (e) {
      setLoader(false);
    }
  };

  const toggleDrawer = (open: boolean) => {
    setOpenComments(open);
  };

  return (
    <Grid container>
      <Grid item md={12} sm={12}>
        <Paper sx={{ ...componentStyle.paperContainer, maxWidth: '100%', overflowX: 'auto' }}>
          {displayConfig.showOpportunity
            ? dropdownComponent(
                'opportunity',
                'opportunity',
                opportunity,
                selectedOpportunity,
                setSelectedOpportunity,
                opportunitiesLoader,
              )
            : null}
          {displayConfig.showPriceBook
            ? dropdownComponent(
                'pricebook',
                'pricebook',
                priceBooks,
                selectedPricingBook,
                setSelectedPricingBook,
                priceBookLoader,
              )
            : null}
          {displayConfig.showQuote
            ? dropdownComponent(
                'quoteVersion',
                'quoteVersion',
                quoteVersions,
                selectedQuote,
                setSelectedQuote,
                quoteLoader,
              )
            : null}
          <Box sx={componentStyle.btnContainer}>
            <Button
              size="small"
              onClick={syncSalesForceData}
              disabled={loader}
              sx={componentStyle.btnStyle}>
              {loader ? (
                <CircularProgress sx={componentStyle.loaderStyle} size={24} />
              ) : (
                <>
                  <SyncIcon sx={componentStyle.syncIconStyle} />
                  {intl.formatMessage({ id: 'refresh_sales_sync' })}
                </>
              )}
            </Button>
          </Box>
          {comments.length > 0 ? (
            <CommentIcon onClick={() => toggleDrawer(true)} sx={componentStyle.commentsIcon} />
          ) : null}
        </Paper>
      </Grid>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
      <SwipeableDrawer
        anchor="right"
        open={openComments}
        onClose={() => toggleDrawer(false)}
        onOpen={() => toggleDrawer(true)}>
        <CommentLists onClose={() => toggleDrawer(false)} comments={comments} />
      </SwipeableDrawer>
    </Grid>
  );
};

export default injectIntl(SelectionSection);
