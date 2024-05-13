/* eslint-disable no-nested-ternary */
import CancelIcon from '@mui/icons-material/Cancel';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  ListItemIcon,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import OrgHierarchyClient from '../../api/UserOrg/UserOrg';
import { ReactComponent as PlusIcon } from '../../assets/icons/plus.svg';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setPriceBooks } from '../../store/price_book/pricebook.slice';
import commonStyle from '../../styles/commonStyle';
import { dropdownComponent } from '../PricingCalculator/SelectionSection';

const componentStyle = {
  sectionName: {
    color: '#3B3F4D',
    marginBottom: '14px',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  tableText: {
    width: '250px',
    height: '36px',
    color: 'white',
    backgroundColor: '#4168E1',
    display: 'block',
    marginBottom: '10px',
    marginRight: '10px',
    padding: '10px',
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
    textAlign: 'right',
    marginTop: '18px',
  },
  paperContainer: {
    minHeight: '120px',
    display: 'flex',
    padding: '18px 33px',
  },
  paperBottomContainer: {
    padding: '18px 33px',
    backgroundColor: '#E5E5E575',
  },
  deleteIcon: {
    display: 'block',
    marginTop: '14px',
    minWidth: '30px',
    textAlign: 'center',
    ':hover': { cursor: 'pointer' },
  },
};

const DiscountingPolicy: React.FC<any> = ({ intl }) => {
  const dispatch = useDispatch();
  const priceBooks = useSelector((state: any) => state.priceBook.priceBooks);
  const [selectedPricingBook, setSelectedPricingBook] = useState<any>();
  const [productRows, setProductRows] = useState<any>();
  const [hierarchyList, setHierarchyList] = useState<any>([]);
  const [designationList, setDesignationList] = useState<any>([
    { designation: {}, discountValues: [] },
  ]);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [showLoader, setLoader] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [pricingBookLoader, setPricingBookLoader] = useState(false);

  useEffect(() => {
    getHierarchy();
    getPriceBooks();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedPricingBook && selectedPricingBook.id) {
      setIsDataLoading(true);
      setDesignationList([]);
      setProductRows(
        selectedPricingBook?.products?.map((p: any) => {
          return { product: p.product_name, id: p.product_id };
        }),
      );
      getDiscountPolicy();
    }
    // eslint-disable-next-line
  }, [selectedPricingBook]);

  const getPriceBooks = () => {
    setPricingBookLoader(true);
    PriceBookClient.getPriceBooks()
      .then((response: any) => {
        dispatch(setPriceBooks(response.data));
        if (response.data.length === 1) setSelectedPricingBook(response.data[0]);
        setPricingBookLoader(false);
      })
      .catch(() => {
        setPricingBookLoader(false);
      });
  };

  const getHierarchy = () => {
    OrgHierarchyClient.getOrgHierarchyStructure()
      .then((response: any) => {
        setHierarchyList(response.data);
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const getDiscountPolicy = async () => {
    const response = await PriceBookClient.getDiscountPolicy(selectedPricingBook.id);
    if (response.data.length) {
      let desgValues: any = [];
      const prodList: any = [];
      selectedPricingBook?.products.forEach((pd: any) => {
        const existingProd = response.data[0].details.find(
          (pr: any) => pr.product_id === pd.product_id,
        );
        if (existingProd) {
          existingProd.org_hierarchy.forEach((v: any) => {
            const discValue = {
              discount: v.discount,
              product_id: existingProd.product_id,
            };
            const existingDesg = desgValues.findIndex(
              (d: any) => d?.designation?.id === v.org_hierarchy_id,
            );
            if (existingDesg !== -1) {
              desgValues[existingDesg].discountValues.push(discValue);
            } else {
              const desg = hierarchyList.find((d: any) => d.id === v.org_hierarchy_id);
              const ob = {
                designation: desg,
                discountValues: [discValue],
              };
              desgValues.push(ob);
            }
          });
        } else {
          prodList.push(pd.product_id);
        }
      });
      if (prodList.length && desgValues.length) {
        prodList.forEach((p: string) => {
          desgValues = desgValues.map((desg: any) => {
            return {
              ...desg,
              discountValues: [...desg.discountValues, { discount: '', product_id: p }],
            };
          });
        });
      } else if (prodList.length) {
        desgValues = initialiseDesgList();
      }
      setDesignationList(desgValues);
      setIsDataLoading(false);
    } else {
      setDesignationList(initialiseDesgList());
      setIsDataLoading(false);
    }
  };

  const initialiseDesgList = () => {
    return [
      {
        designation: {},
        discountValues: selectedPricingBook?.products?.map((p: any) => {
          return { product_id: p.product_id, discount: '' };
        }),
      },
    ];
  };

  const addDesignation = () => {
    setDesignationList((prev: any) => [
      ...prev,
      {
        designation: {},
        discountValues: selectedPricingBook?.products?.map((p: any) => {
          return { product_id: p.product_id, discount: '' };
        }),
      },
    ]);
  };

  const deleteDesignation = (index: number) => {
    const desg = [...designationList];
    desg.splice(index, 1);
    setDesignationList(desg);
  };

  const setHierarchyValue = (v: any, index: number) => {
    const desg = [...designationList];
    desg.splice(index, 1, { ...designationList[index], designation: v });
    setDesignationList(desg);
  };

  const setDiscountValue = (value: any, rowIndex: number, desgIndex: number) => {
    const desg = [...designationList];
    const disc = desg[desgIndex]?.discountValues;
    disc.splice(rowIndex, 1, { ...disc[rowIndex], discount: value });
    desg.splice(desgIndex, 1, { ...designationList[desgIndex], discountValues: disc });
    setDesignationList(desg);
  };

  const getDesignationValues = (i: number) => {
    if (i > 0) {
      const prevDesg = designationList[i - 1].designation;
      const filteredList = hierarchyList.filter((h: any) => h?.level < prevDesg?.level);
      return filteredList;
    }
    return hierarchyList;
  };

  const isValidData = (postOb: any) => {
    let isValidate = true;
    designationList.map((d: any) => {
      if (isValidate) {
        if (
          _.isEmpty(d.designation) ||
          !d.discountValues.every((v: any) => v.discount !== '' && Number(v.discount) <= 100)
        ) {
          isValidate = false;
          setSnackBarValues({
            display: true,
            type: 'error',
            message: intl.formatMessage({ id: 'selectDesignationMessage' }),
          });
        }
      }
      return null;
    });
    postOb.map((p: any) => {
      if (isValidate) {
        const discounts = p.org_hierarchy.map((d: any) => d.discount);
        for (let i = 0; i < discounts.length - 1; i += 1) {
          if (Number(discounts[i]) > Number(discounts[i + 1])) {
            isValidate = false;
            setSnackBarValues({
              display: true,
              type: 'error',
              message: intl.formatMessage({ id: 'discountOrderMessage' }),
            });
          }
        }
      }
      return null;
    });
    return isValidate;
  };

  const saveDiscountingPolicy = async () => {
    const postOb = selectedPricingBook?.products?.map((p: any) => {
      return { product_id: p.product_id, org_hierarchy: [] };
    });
    designationList.forEach((d: any) => {
      d.discountValues.forEach((v: any) => {
        const product = postOb.find((p: any) => p.product_id === v.product_id);
        product.org_hierarchy.push({ org_hierarchy_id: d.designation.id, discount: v.discount });
      });
    });
    if (isValidData(postOb)) {
      setLoader(true);
      const response = await PriceBookClient.updateDiscountingPolicy(selectedPricingBook.id, {
        details: postOb,
      });
      if (response.message === 'success') {
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'dataSaved' }),
        });
        setLoader(false);
      } else {
        console.error(response);
        setLoader(false);
      }
    }
  };

  const getHeirarchyColumn = (designations: any) => {
    return designations.map((d: any, i: number) => {
      return (
        <Box sx={{ marginRight: '10px', minWidth: 'fit-content' }}>
          <SearchAddAutocomplete
            caption="designation"
            data={getDesignationValues(i) || []}
            selectedItem={d.designation}
            setSelectedData={(v: any) => setHierarchyValue(v, i)}
            showSelectionValue
            showAddOption={false}
          />
          {d.discountValues?.map((p: any, index: number) => {
            return (
              <Box key={p.product_id} sx={{ marginTop: '11px' }}>
                <TextField
                  value={p.discount}
                  type="number"
                  error={p.discount !== '' && !(Number(p.discount) <= 100)}
                  helperText={
                    p.discount !== '' && !(Number(p.discount) <= 100)
                      ? `Max Discount value: 100 `
                      : ''
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                  onChange={(e) => {
                    setDiscountValue(e?.target?.value, index, i);
                  }}
                />
              </Box>
            );
          })}
          <ListItemIcon
            key={uuidv4()}
            sx={componentStyle.deleteIcon}
            onClick={() => {
              deleteDesignation(i);
            }}>
            <CancelIcon />
          </ListItemIcon>
        </Box>
      );
    });
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      <Grid container rowSpacing={3}>
        <Grid item md={12}>
          <Paper sx={componentStyle.paperContainer}>
            {dropdownComponent(
              'pricebook',
              'pricebook',
              priceBooks,
              selectedPricingBook,
              setSelectedPricingBook,
              pricingBookLoader,
            )}
          </Paper>
        </Grid>
        <Grid item md={12}>
          {isDataLoading && (
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              sx={{ height: '50vh' }}>
              <CircularProgress color="secondary" />
            </Stack>
          )}
          {selectedPricingBook && !isDataLoading ? (
            hierarchyList.length ? (
              <Paper sx={componentStyle.paperBottomContainer}>
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ marginTop: '77px' }}>
                    {productRows?.map((p: any) => {
                      return (
                        <Box sx={componentStyle.tableText}>
                          <Typography sx={{ paddingTop: '10px', paddingLeft: '20px' }}>
                            {p.product}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  <Box
                    sx={{
                      maxWidth: 'inherit',
                      display: 'flex',
                      overflowX: 'auto',
                      paddingTop: '10px',
                    }}>
                    {getHeirarchyColumn(designationList)}
                    <Button
                      sx={{ height: 'fit-content', width: 'fit-content' }}
                      onClick={addDesignation}>
                      <Box>
                        <PlusIcon /> <FormattedMessage id="addDesignation" />
                      </Box>
                    </Button>
                  </Box>
                </Box>

                <br />

                <Box sx={componentStyle.btnContainer}>
                  <Button sx={commonStyle.button} onClick={saveDiscountingPolicy}>
                    {showLoader ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <FormattedMessage id="save" />
                    )}
                  </Button>
                </Box>
              </Paper>
            ) : (
              <Typography sx={{ paddingTop: '10px', paddingLeft: '20px', color: 'red' }}>
                No Org. Hierarchy found to provide the discounting policy. Import the Org. Hierarchy
                under the `Company Hierarchy` or sync it from Salesforce
              </Typography>
            )
          ) : (
            ''
          )}
        </Grid>
      </Grid>
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
export default injectIntl(DiscountingPolicy);
