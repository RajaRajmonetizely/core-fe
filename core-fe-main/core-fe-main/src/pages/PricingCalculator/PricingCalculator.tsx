import { Box, Paper } from '@mui/material';
import { useWindowSize } from '@uidotdev/usehooks';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import _ from 'lodash';
import OpportunityClient from '../../api/Opportunity/OpportunityAPI';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import PricingCalculatorClient from '../../api/PricingCalculator/PricingCalculatorAPI';
import TenantsClient from '../../api/Tenant/TenantAPIs';
import PageLoader from '../../components/PageLoader/PageLoader';
import SaveInput from '../../components/SaveInput/SaveInput';
import Snackbar from '../../components/Snackbar/Snackbar';
import { QuoteStatus } from '../../constants/constants';
import { columnsKeys, pricingTableColumn } from '../../mocks/pricingCalculator';
import { ISnackBar } from '../../models/common';
import { setOpportunities } from '../../store/opportunity/opportunity.slice';
import { setPriceBooks } from '../../store/price_book/pricebook.slice';
import {
  setDealTerms,
  setDealTermsSchema,
  setPriceBookDetails,
  setPriceBookDiscount,
  setQuoteVersions,
  setSelectedOpportunity,
  setSelectedPricingBook,
  setSelectedPricingProducts,
  setSelectedQuote,
  setSelectedQuoteDetails,
} from '../../store/pricing_calculator/pricingCalculator.slice';
import commonStyle from '../../styles/commonStyle';
import { REGEX } from '../../utils/helperService';
import LeftPortion from './LeftPortion';
import RightPortion from './RightPortion';
import SelectionSection from './SelectionSection';

declare global {
  interface Window {
    // ⚠️ notice that "Window" is capitalized here
    handleChatMessage: any;
    removeChatWidget: any;
  }
}
const pageStyle = {
  bodyContainer: {
    marginTop: '24px',
  },
  rightContainer: {
    padding: '28px 26px',
    width: 'fit-content',
  },
  bottomContainer: {
    display: 'flex',
  },
  btnContainer: {
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: '20px',
  },
  mainContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  leftContainer: {
    width: '300px',
    marginRight: '24px',
  },
  smallSizeLeftContainer: {
    width: '100%',
    marginBottom: '24px',
  },
};

interface IProps {
  intl: any;
}
// eslint-disable-next-line
const PricingCalculator: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const size = useWindowSize();
  const { quoteId } = useParams();
  const [searchParams] = useSearchParams();
  const opportunityId = searchParams.get('opportunityId');
  const ability = useSelector((state: any) => state.auth.ability);
  const userOperations = useSelector((state: any) => state.auth.userOperations);
  const [quoteName, setQuoteName] = useState('');
  const [saveLoader, setSaveLoader] = useState(false);
  const [comments, setComments] = useState([]);
  const [opportunitiesLoader, setOpportunitiesLoader] = useState(false);
  const [pricingBookLoader, setPricingBookLoader] = useState(false);
  const [quoteLoader, setQuoteLoader] = useState(false);
  const opportunities = useSelector((state: any) => state.opportunity.opportunities);
  const [priceBookLoader, setPriceBookLoader] = useState(false);
  const [quoteDetailsLoader, setQuoteDetailsLoader] = useState(false);
  const [disableEscalation, setDisableEscalation] = useState<boolean>(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const priceBookDetails = useSelector((state: any) => state.pricingCalculator.priceBookDetails);
  const userId = useSelector((state: any) => state.auth.userId);
  const selectedOpportunity = useSelector(
    (state: any) => state.pricingCalculator.selectedOpportunity,
  );
  const selectedPricingBook = useSelector(
    (state: any) => state.pricingCalculator.selectedPricingBook,
  );
  const selectedPricingProducts = useSelector(
    (state: any) => state.pricingCalculator.selectedPricingProducts,
  );
  const priceBookDiscounts = useSelector(
    (state: any) => state.pricingCalculator.priceBookDiscounts,
  );
  const selectedQuote = useSelector((state: any) => state.pricingCalculator.selectedQuote);
  const selectedQuoteDetails = useSelector(
    (state: any) => state.pricingCalculator.selectedQuoteDetails,
  );
  const quoteVersions = useSelector((state: any) => state.pricingCalculator.quoteVersions);
  const dealTermsSchema = useSelector((state: any) => state.pricingCalculator.dealTermsSchema);
  const valuesRef = useRef();

  useEffect(() => {
    getDealTermsSchema();
    getOpportunity();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (quoteId) {
      getQuoteById(quoteId, 'change');
    } else {
      dispatch(setSelectedOpportunity({}));
      dispatch(setSelectedPricingBook({}));
      dispatch(setSelectedQuote({}));
      dispatch(setPriceBooks([]));
      dispatch(setQuoteVersions([]));
      dispatch(setDealTerms({}));
      setComments([]);
    }
    // eslint-disable-next-line
  }, [quoteId]);

  useEffect(() => {
    if (quoteId && selectedQuoteDetails?.id === quoteId) {
      const filterData = opportunities.filter(
        (item: any) => item.id === selectedQuoteDetails.opportunity_id,
      );
      if (filterData?.length > 0) {
        dispatch(setSelectedOpportunity(filterData[0]));
      }
    }
    // eslint-disable-next-line
  }, [quoteId, selectedQuoteDetails, opportunities]);

  useEffect(() => {
    if (!quoteId && opportunityId) {
      const filterData = opportunities.filter((item: any) => item.id === opportunityId);
      if (filterData?.length > 0) {
        dispatch(setSelectedOpportunity(filterData[0]));
        getPriceBooks(opportunityId, 'onSelect', undefined);
      }
    }
    // eslint-disable-next-line
  }, [quoteId, opportunityId, opportunities]);

  useEffect(() => {
    if (priceBookDetails && priceBookDetails.id && priceBookDiscounts?.length > 0) {
      const tempDetails = JSON.parse(JSON.stringify(priceBookDetails));
      tempDetails.products.map((product: any) => {
        const filterData = priceBookDiscounts.filter(
          (discount: any) => discount.product_id === product.product_id,
        );
        if (filterData && filterData.length > 0) {
          product.discount = Number(filterData[0].discount);
        }
        return null;
      });
      if (JSON.stringify(priceBookDetails) !== JSON.stringify(tempDetails)) {
        dispatch(setPriceBookDetails(tempDetails));
      }
    }
    // eslint-disable-next-line
  }, [priceBookDiscounts, priceBookDetails]);

  useEffect(() => {
    const script = document.createElement('script');

    // script.src = 'http://localhost:5555/loader.js';
    script.src = '/loader.js';

    script.async = true;
    script.setAttribute('data-url', 'https://ai-chat-demo-nu.vercel.app');

    document.body.appendChild(script);

    return () => {
      window.removeChatWidget();
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    window.handleChatMessage = async (event: MessageEvent) => {
      if (event.data && event.data.data) {
        if (event.data.data.toLowerCase().includes(' bmw')) {
          dispatch(setSelectedQuote(quoteVersions[0]));

          await getQuoteById(
            quoteVersions.length ? quoteVersions[0].id : '9d9b929a-4757-4084-ab94-cdcb3214140b',
            'change',
          );
        }
        if (event.data.data.toLowerCase().includes(' now changed')) {
          dispatch(setSelectedQuote(quoteVersions[1]));

          await getQuoteById(
            quoteVersions.length ? quoteVersions[1].id : '2115d328-c36d-47bc-a97a-6663fe8cc888',
            'change',
          );
        }
      }
    };
    return () => {
      window.handleChatMessage = null;
    };
  }, [quoteVersions]);

  useEffect(() => {
    if (selectedQuote === null) {
      dispatch(setSelectedPricingProducts([]));
      dispatch(setSelectedQuote({}));
      dispatch(setSelectedQuoteDetails({}));
      dispatch(setDealTerms({}));
      setComments([]);
      setQuoteName('');
      dispatch(setPriceBookDetails({}));
      getPricingBookById(selectedPricingBook.id);
    }
  }, [selectedQuote]);

  const getDealTermsSchema = () => {
    TenantsClient.getDealTerms()
      .then((response) => {
        const responseObj = response.data.map((schema: any) => {
          if (schema.component === 'date-picker' && schema.initialValue) {
            schema.initialValue = new Date(schema.initialValue);
          }
          return schema;
        });
        const sc = {
          fields: [...responseObj],
        };
        dispatch(setDealTermsSchema(sc));
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

  const getQuoteById = async (id?: string, type?: string) => {
    try {
      setQuoteDetailsLoader(true);
      const response = await PricingCalculatorClient.getQuoteDataById(id ?? selectedQuote.id);
      const commentResponse = await PricingCalculatorClient.getCommentByQuote(
        id ?? selectedQuote.id,
      );
      if (commentResponse.data) {
        setComments(commentResponse.data);
      }
      if (response.message === 'success') {
        dispatch(setSelectedQuoteDetails(response.data));
        if (
          response.data?.deal_term_details &&
          Object.values(response.data?.deal_term_details).length
        ) {
          let dealOb = response.data?.deal_term_details;
          dealTermsSchema.fields?.forEach((schema: any) => {
            if (schema.component === 'date-picker') {
              dealOb = { ...dealOb, [schema.name]: new Date(dealOb[schema.name]) };
            }
          });
          dispatch(setDealTerms(dealOb));
          valuesRef.current = dealOb;
        } else {
          dispatch(setDealTerms({}));
        }
      }
      if (type === 'change') {
        getPriceBooks(response.data.opportunity_id, 'load', response.data);
        getQuoteVersions(quoteId, response.data.price_book_id);
        getPricingBookById(response.data.price_book_id, response.data);
        getPriceBookDiscount(response.data.price_book_id);
      } else {
        preLoadQuoteData(response.data, priceBookDetails);
      }
      setQuoteDetailsLoader(false);
    } catch (e) {
      setQuoteDetailsLoader(false);
      console.error(e);
    }
  };

  const getPricingBookById = async (priceBookId: string, quoteData?: string) => {
    try {
      setPriceBookLoader(true);
      const response = await PriceBookClient.getPriceBookById(
        priceBookId ?? selectedPricingBook.id,
      );
      if (response.message === 'success') {
        response.data.products.map((item: any) => {
          item.total = columnsKeys;
          return null;
        });
        if (quoteData) {
          preLoadQuoteData(quoteData, response.data);
        } else {
          dispatch(setPriceBookDetails(response.data));
        }
      }
      setPriceBookLoader(false);
    } catch (e) {
      setPriceBookLoader(false);
    }
  };

  const getPriceBookDiscount = async (priceBookId: string) => {
    try {
      const response = await PricingCalculatorClient.getPriceBookDiscount(
        priceBookId ?? selectedPricingBook.id,
      );
      if (response.message === 'success') {
        dispatch(setPriceBookDiscount(response.data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getQuoteVersions = async (id?: string, priceBookId?: string) => {
    try {
      setQuoteLoader(true);
      const response = await PricingCalculatorClient.getQuotes(
        priceBookId ?? selectedPricingBook.id,
      );
      if (response.message === 'success') {
        dispatch(setQuoteVersions(response.data));
        if (id) {
          const filerData = response.data.filter((item: any) => item.id === id);
          dispatch(setSelectedQuote(filerData.length > 0 ? filerData[0] : {}));
        }
      }
      setQuoteLoader(false);
    } catch (e) {
      setQuoteLoader(false);
    }
  };

  const getOpportunity = async () => {
    try {
      setOpportunitiesLoader(true);
      const response = await OpportunityClient.getOpportunity();
      if (response.message === 'success') {
        dispatch(setOpportunities(response.data));
        if (response.data.length === 1) {
          dispatch(setSelectedOpportunity(response.data[1]));
          getPriceBooks(response.data[0]?.id, 'onSelect');
        }
      }
      setOpportunitiesLoader(false);
    } catch (e) {
      setOpportunitiesLoader(false);
    }
  };

  const getPriceBooks = async (id: string, type: string, quoteDetails?: any) => {
    try {
      if (id || selectedOpportunity?.id) {
        setPricingBookLoader(true);
        const response = await PriceBookClient.getPriceBooks(id ?? selectedOpportunity.id);
        if (response.message === 'success') {
          dispatch(setPriceBooks(response.data));
          if (id && type === 'load' && quoteDetails) {
            const filterPriceBook = response.data.filter(
              (item: any) => item.id === quoteDetails.price_book_id,
            );
            if (filterPriceBook?.length > 0) {
              dispatch(setSelectedPricingBook(filterPriceBook[0]));
            }
          } else if (response.data.length === 1 && type === 'onSelect') {
            dispatch(setSelectedPricingBook(response.data[0]));
            getQuoteVersions('', response.data[0].id);
            getPricingBookById(response.data[0].id);
            getPriceBookDiscount(response.data[0].id);
          }
        }
        setPricingBookLoader(false);
      }
    } catch (e) {
      setPricingBookLoader(false);
    }
  };

  const generateBody = () => {
    const body = {} as any;
    body.opportunity_id = selectedOpportunity.id;
    body.price_book_id = selectedPricingBook.id;
    body.name = quoteName;
    body.columns = pricingTableColumn;
    const quoteDetails: any = [];
    const products = JSON.parse(JSON.stringify(selectedPricingProducts));
    body.total_price = 0;
    body.discount = 0;
    products.map((item: any) => {
      const productBody = { product_id: item.product_id, total: item.total, checked: true } as any;
      item.total.map((totalFields: any) => {
        if (totalFields.key === 'list_total_price') {
          body.total_price += totalFields.value;
        }
        if (totalFields.key === 'discount') {
          body.discount += totalFields.value;
        }
        return null;
      });
      productBody.tiers = [];
      item.tiers.map((tier: any) => {
        if (tier.details && tier.details.addons && tier.details.addons.rows) {
          const addons: any = [];
          tier.details.addons.rows.map((adb: any) => {
            addons.push({ ...adb, addon_id: adb.addon_id ?? adb.id, values: adb.values });
            return null;
          });
          tier.details.addons.rows = addons;
        }
        productBody.tiers.push({
          tier_id: tier.tier_id,
          total: item.total,
          details: tier.details,
          checked: true,
        });
        return null;
      });
      quoteDetails.push(productBody);
      return null;
    });
    body.quote_details = quoteDetails;
    body.discount = body.discount.toString();
    body.total_price = parseInt(body.total_price, 10);
    body.deal_term_details = valuesRef.current;
    return body;
  };

  const isValidData = () => {
    let isValid = true;
    if (quoteName && !REGEX.test(quoteName)) {
      isValid = false;
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'valueWithSpecialCharacters' }),
      });
      return isValid;
    }
    if (quoteName.trim().length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'cloneNameMissing' }),
      });
      isValid = false;
      return isValid;
    }
    if (
      selectedQuoteDetails.name !== quoteName &&
      quoteVersions.some((n: any) => n.name === quoteName)
    ) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'quoteExistsMessage' }),
      });
      isValid = false;
    }
    return isValid;
  };

  const saveQuote = async () => {
    if (isValidData()) {
      try {
        setSaveLoader(true);
        const body = generateBody();
        if (body.name === selectedQuote.name) {
          const response = await PricingCalculatorClient.saveQuote(body, selectedQuote.id ?? '');
          if (response?.message === 'success') {
            if (response.data.id && !selectedQuoteDetails.id) {
              getQuoteVersions(response.data.id);
            }
            getQuoteById(response.data.id);
          }
        } else {
          const response = await PricingCalculatorClient.cloneQuote(body, selectedQuote.id ?? '');
          if (response?.message === 'success') {
            if (response.data.id) {
              setQuoteLoader(true);
              const updatedQuoteVersionsRes = await PricingCalculatorClient.getQuotes(
                selectedPricingBook.id,
              );
              if (updatedQuoteVersionsRes.message === 'success') {
                dispatch(setQuoteVersions(updatedQuoteVersionsRes.data));
                const filerData = updatedQuoteVersionsRes.data.filter(
                  (item: any) => item.name === body.name,
                );
                getQuoteById(filerData[0].id);
                dispatch(setSelectedQuote(filerData.length > 0 ? filerData[0] : {}));
              }
              setQuoteLoader(false);
            }
          }
        }
        setSnackBarValues({
          type: 'success',
          display: true,
          message: intl.formatMessage({ id: 'quote_saved' }),
        });
        setDisableEscalation(false);
        setSaveLoader(false);
      } catch (e) {
        setSaveLoader(false);
        setQuoteLoader(false);
      }
    }
  };

  const checkSaveQuoteCondition = () => {
    if (
      (!selectedQuoteDetails.status && ability.can('POST', 'Pricing Calculator')) ||
      (selectedQuoteDetails.status === QuoteStatus.DRAFT &&
        selectedQuoteDetails.assigned_to_id === userId) ||
      (selectedQuoteDetails.status === QuoteStatus.FORWARD_TO_DD &&
        (selectedQuoteDetails.assigned_to_id === userId ||
          _.keys(userOperations).includes('Deal Hub')))
    ) {
      return true;
    }
    return false;
  };

  /**
   * preLoadQuoteData loads the selected quote and price book data into the state
   * @param {object} quoteData - the quote data object
   * @param {object} priceBookData - the price book data object
   */
  const preLoadQuoteData = (quoteData: any, priceBookData: any) => {
    const tempDetails = JSON.parse(JSON.stringify(quoteData));
    const tempPriceBookDetails = JSON.parse(JSON.stringify(priceBookData));
    setQuoteName(quoteData.name);
    tempPriceBookDetails.products.forEach((ele: any) => {
      ele.checked = false;
      ele.tiers = [];
      ele.total = [
        {
          key: 'qty',
          value: null,
        },
        {
          key: 'list_unit_price',
          value: null,
        },
        {
          key: 'discounted_unit_price',
          value: null,
        },
        {
          key: 'list_total_price',
          value: null,
        },
        {
          key: 'discount',
          value: null,
        },
        {
          key: 'discounted_total_price',
          value: null,
        },
      ];
    });
    tempDetails.quote_details.map((product: any) => {
      product.checked = true;
      const productIndex = tempPriceBookDetails.products.findIndex(
        (item: any) => item.product_id === product.product_id,
      );
      if (productIndex > -1) {
        tempPriceBookDetails.products[productIndex].checked = true;
        tempPriceBookDetails.products[productIndex].tier_details.map((tier: any) => {
          const findTierIndex = product.tiers.findIndex(
            (productTier: any) => productTier.tier_id === tier.tier_id,
          );
          tier.checked = findTierIndex > -1;
          if (product.tiers[findTierIndex] && product.tiers[findTierIndex].details) {
            tier.details = product.tiers[findTierIndex].details;
          }
          if (findTierIndex > -1) {
            tier.total = product.tiers[findTierIndex].total ?? columnsKeys;
            tempPriceBookDetails.products[productIndex].total =
              product.tiers[findTierIndex].total ?? columnsKeys;
          }
          if (
            findTierIndex > -1 &&
            product.tiers[findTierIndex] &&
            product.tiers[findTierIndex].details &&
            product.tiers[findTierIndex].details.addons &&
            product.tiers[findTierIndex].details.addons.rows
          ) {
            tier.addons.map((adb: any) => {
              const findAddonIndex = product.tiers[findTierIndex].details.addons.rows.findIndex(
                (productAddons: any) => productAddons.addon_id === adb.id,
              );
              adb.checked = findAddonIndex > -1;
              return null;
            });
          }
          return null;
        });
        tempPriceBookDetails.products[productIndex].tiers = tempPriceBookDetails.products[
          productIndex
        ].tier_details.filter((tier: any) => tier.checked);
        if (tempPriceBookDetails.products[productIndex].tiers.length > 0) {
          const [tierData] = tempPriceBookDetails.products[productIndex].tiers;
          tempPriceBookDetails.products[productIndex].tierData = tierData;
        }
      }
      return null;
    });
    if (JSON.stringify(tempPriceBookDetails) !== JSON.stringify(priceBookDetails)) {
      dispatch(setPriceBookDetails(tempPriceBookDetails));
    }
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      <SelectionSection
        comments={comments}
        opportunitiesLoader={opportunitiesLoader}
        priceBookLoader={pricingBookLoader}
        quoteLoader={quoteLoader}
        selectedPricingBook={selectedPricingBook}
        selectedOpportunity={selectedOpportunity}
        selectedQuote={selectedQuote}
        setSelectedQuote={(value: any) => {
          if (value?.id) {
            getQuoteById(value?.id);
          }
          dispatch(setSelectedQuote(value));
          setDisableEscalation(false);
        }}
        setSelectedOpportunity={(value: any) => {
          if (value?.id) {
            getPriceBooks(value?.id, 'onSelect');
          }
          dispatch(setSelectedOpportunity(value));
          dispatch(setSelectedPricingBook({}));
          dispatch(setPriceBookDetails({}));
          dispatch(setSelectedQuote({}));
          dispatch(setQuoteVersions([]));
          dispatch(setSelectedPricingProducts([]));
          dispatch(setSelectedQuoteDetails({}));
          dispatch(setDealTerms({}));
          setComments([]);
          setQuoteName('');
          setDisableEscalation(false);
        }}
        setSelectedPricingBook={(value: any) => {
          dispatch(setSelectedQuote({}));
          dispatch(setQuoteVersions([]));
          dispatch(setSelectedPricingProducts([]));
          dispatch(setSelectedQuoteDetails({}));
          setDisableEscalation(false);
          dispatch(setDealTerms({}));
          setComments([]);
          setQuoteName('');
          dispatch(setSelectedPricingBook(value));
          if (value?.id) {
            getQuoteVersions('', value.id);
            getPricingBookById(value.id);
            getPriceBookDiscount(value.id);
          }
        }}
      />
      {quoteDetailsLoader ? <PageLoader /> : null}
      {selectedPricingBook?.id && !quoteDetailsLoader ? (
        <Box sx={pageStyle.bodyContainer}>
          <Box sx={pageStyle.mainContainer}>
            <Paper
              sx={
                size?.width && size?.width < 900
                  ? pageStyle.smallSizeLeftContainer
                  : pageStyle.leftContainer
              }>
              <LeftPortion priceBookLoader={priceBookLoader} />
            </Paper>
            <Paper sx={{ ...pageStyle.rightContainer, flex: 1, overflowX: 'auto' }}>
              <RightPortion
                setDealTermsRef={valuesRef}
                disableEscalation={disableEscalation}
                setDisableEscalation={setDisableEscalation}
              />
            </Paper>
          </Box>
          <Box sx={pageStyle.bottomContainer}>
            {checkSaveQuoteCondition() ? (
              <SaveInput
                value={quoteName}
                showProgress={saveLoader}
                onTextChange={(e) => setQuoteName(e.target.value)}
                onClick={saveQuote}
                placeholder="quote_name"
                btnText="save_quote"
              />
            ) : null}
            {/* 
              {selectedQuoteDetails.status === QuoteStatus.APPROVED ? (
                <Box sx={pageStyle.btnContainer}>
                  <Button sx={commonStyle.orangeButton}>
                    {intl.formatMessage({ id: 'create_contract' })}
                  </Button>
                </Box>
              ) : null} */}
          </Box>
        </Box>
      ) : null}
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </Box>
  );
};
export default injectIntl(PricingCalculator);
