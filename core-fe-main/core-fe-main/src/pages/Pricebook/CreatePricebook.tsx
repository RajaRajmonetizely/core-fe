import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import _ from 'lodash';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import PackageClient from '../../api/Package/PackageAPIs';
import PlanClient from '../../api/Plan/PlanAPIs';
import PriceBookClient from '../../api/PriceBook/PricebookAPI';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import ProductClient from '../../api/Product/ProductAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { setPlans } from '../../store/plans/plans.slice';
import { setEditData, setEditMode, setRefetchData } from '../../store/price_book/pricebook.slice';
import { setIsProductLoading, setProductList } from '../../store/products/products.slice';
import styles from '../../styles/styles';

const CreatePricebook: React.FC<any> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const products = useSelector((state: any) => state.products.products);
  const plans = useSelector((state: any) => state.plans.plans);
  const isEditMode = useSelector((state: any) => state.priceBook.isEditMode);
  const editPriceBookData = useSelector((state: any) => state.priceBook.editPriceBookData);
  const priceBooks = useSelector((state: any) => state.priceBook.priceBooks);
  const [isPBDialogOpen, setPBDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [packages, setPackages] = useState<any>({});
  const [pricingVersion, setPricingVersion] = useState<any>({});
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [priceBook, setPriceBook] = useState<any>({
    name: '',
    products: [{ product_id: '', plan_id: '', package_id: '', pricing_model_id: '' }],
  });

  useEffect(() => {
    getProducts();
    getPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const editOb: any = {};
      editOb.name = editPriceBookData.name;
      editOb.products = editPriceBookData.products.map((d: any) => {
        getPackageForPlan(d.plan_id);
        getPricingModel(d.package_id);
        const data: any = _.pick(d, [
          'product_id',
          'plan_id',
          'package_id',
          'pricing_model_id',
          'id',
        ]);
        data.pricebook_entry_id = data.id;
        // delete data.id;
        return data;
      });
      setPriceBook(editOb);
      setPBDialogOpen(true);
    }
    // eslint-disable-next-line
  }, [isEditMode]);

  const getProducts = () => {
    dispatch(setIsProductLoading(true));
    ProductClient.getProducts()
      .then(({ data }) => {
        dispatch(setProductList([...data]));
        dispatch(setIsProductLoading(false));
      })
      .catch((e: any) => {
        console.error(e);
        dispatch(setIsProductLoading(false));
      });
  };

  const getPlans = () => {
    PlanClient.getPlans()
      .then(({ data }) => {
        dispatch(setPlans(data));
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  const openPBDialog = () => {
    setPBDialogOpen(true);
  };

  const handleClose = () => {
    dispatch(setEditMode(false));
    dispatch(setEditData({}));
    setPBDialogOpen(false);
    clearPriceBookData();
  };

  const clearPriceBookData = () => {
    const productList: any = [];
    productList.push({ product_id: '', plan_id: '', package_id: '', pricing_model_id: '' });
    setPriceBook(() => {
      return { name: '', products: productList };
    });
  };

  const isValidData = () => {
    let isValid = true;
    if (priceBook.name.trim().length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseEnterName' }),
      });
      isValid = false;
      return false;
    }
    if (
      (isEditMode &&
        priceBooks
          .filter((p: any) => p.id !== editPriceBookData?.id)
          .some((pb: any) => pb.name === priceBook.name)) ||
      (!isEditMode && priceBooks.some((pb: any) => pb.name === priceBook.name))
    ) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'nameAlreadyExistsMessage' }),
      });
      isValid = false;
      return false;
    }
    if (priceBook.products.length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'pleaseAddOneProduct' }),
      });
      isValid = false;
      return false;
    }
    const prodIds: string[] = [];
    priceBook.products.forEach((p: any) => {
      if (_.values(p).includes(undefined || '')) {
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'pleaseEnterAllValues' }),
        });
        isValid = false;
      }
      if (!prodIds.includes(p.product_id)) prodIds.push(p.product_id);
      else {
        setSnackBarValues({
          display: true,
          type: 'error',
          message: intl.formatMessage({ id: 'pleaseSelectUniqueProduct' }),
        });
        isValid = false;
      }
    });
    return isValid;
  };

  const handleSave = async () => {
    if (isValidData()) {
      try {
        setIsSaving(true);
        if (isEditMode) {
          const response = await PriceBookClient.editPriceBook(editPriceBookData.id, priceBook);
          if (response.message === 'success') {
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'pricebookEditMessage' }),
            });
            dispatch(setRefetchData(true));
            dispatch(setEditMode(false));
            dispatch(setEditData({}));
            setIsSaving(false);
            setPBDialogOpen(false);
            clearPriceBookData();
          }
        } else {
          const response = await PriceBookClient.createPriceBook(priceBook);
          if (response.message === 'success') {
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'pricebookCreateMessage' }),
            });
            dispatch(setRefetchData(true));
            setIsSaving(false);
            setPBDialogOpen(false);
            clearPriceBookData();
          }
        }
      } catch (e) {
        setIsSaving(false);
        console.error(e);
      }
    }
  };

  const onAddProduct = () => {
    const productList = [...priceBook.products];
    productList.push({ product_id: '', plan_id: '', package_id: '', pricing_model_id: '' });
    setPriceBook((prev: any) => {
      return { ...prev, ...{ products: productList } };
    });
  };

  const onRemovePriceBook = (index: number) => {
    const productList = [...priceBook.products];
    productList.splice(index, 1);
    setPriceBook((prev: any) => {
      return { ...prev, ...{ products: productList } };
    });
  };

  const setPriceBookDetails = (index: number, key: string, value: any) => {
    const productList = [...priceBook.products];
    let emptyKeys = {};
    if (key === 'package_id') {
      emptyKeys = { ...emptyKeys, ...{ pricing_model_id: '' } };
    } else if (key === 'plan_id') {
      emptyKeys = { ...emptyKeys, ...{ package_id: '', pricing_model_id: '' } };
    } else if (key === 'product_id') {
      emptyKeys = { ...emptyKeys, ...{ plan_id: '', package_id: '', pricing_model_id: '' } };
    }
    const pbook = { ...productList[index], ...{ [key]: value }, ...emptyKeys };
    productList.splice(index, 1, pbook);
    setPriceBook((prev: any) => {
      return { ...prev, ...{ products: productList } };
    });
  };

  const getPackageForPlan = async (planId: string) => {
    if (planId)
      try {
        const response = await PackageClient.getPackagePerPlan(planId);
        if (response.message === 'success') {
          if (response.data) {
            setPackages((prev: any) => {
              return { ...prev, ...{ [planId]: response.data } };
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
  };

  const getPricingModel = async (packageId: string) => {
    if (packageId) {
      try {
        const response = await PricingModelClient.getPricingModel(packageId);
        if (response.message === 'success') {
          if (response.data) {
            setPricingVersion((prev: any) => {
              return { ...prev, ...{ [packageId]: response.data } };
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const ProductPlanRow = useMemo((): ReactElement => {
    return priceBook?.products?.map((d: any, index: number) => {
      return (
        // eslint-disable-next-line
        <Stack direction="row" key={index}>
          <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
            <SearchAddAutocomplete
              caption="products"
              data={products}
              selectedItem={products.find((p: any) => p.id === d.product_id) || null}
              setSelectedData={(value: any) => {
                setPriceBookDetails(index, 'product_id', value?.id);
              }}
              showAddOption={false}
              showSelectionValue
            />
          </FormControl>
          <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
            <SearchAddAutocomplete
              caption="plans"
              data={d.product_id ? plans.filter((p: any) => p.product_id === d.product_id) : []}
              selectedItem={plans.find((p: any) => p.id === d.plan_id) || null}
              setSelectedData={(value: any) => {
                setPriceBookDetails(index, 'plan_id', value?.id);
                getPackageForPlan(value?.id);
              }}
              showAddOption={false}
              showSelectionValue
            />
          </FormControl>
          <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
            <SearchAddAutocomplete
              caption="packageVersion"
              data={packages[d.plan_id] || []}
              selectedItem={packages[d.plan_id]?.find((p: any) => p.id === d.package_id) || null}
              setSelectedData={(value: any) => {
                setPriceBookDetails(index, 'package_id', value?.id);
                getPricingModel(value?.id);
              }}
              showAddOption={false}
              showSelectionValue
            />
          </FormControl>
          <FormControl sx={{ margin: '20px 4px', width: '280px' }}>
            <SearchAddAutocomplete
              caption="pricingModelVersion"
              data={pricingVersion[d.package_id] || []}
              selectedItem={
                pricingVersion[d.package_id]?.find((p: any) => p.id === d.pricing_model_id) || null
              }
              setSelectedData={(value: any) => {
                setPriceBookDetails(index, 'pricing_model_id', value?.id);
              }}
              showAddOption={false}
              showSelectionValue
            />
          </FormControl>
          <Box sx={{ margin: '34px 17px 34px 15px' }}>
            <IconButton>
              <DeleteIcon onClick={() => onRemovePriceBook(index)} />
            </IconButton>
          </Box>
        </Stack>
      );
    });
    // eslint-disable-next-line
  }, [priceBook, products, plans, pricingVersion, packages, isEditMode]);

  return (
    <>
      <Button
        sx={styles.dialogButton}
        onClick={() => {
          openPBDialog();
        }}>
        <FormattedMessage id="createPricebook" />
      </Button>
      <Dialog open={isPBDialogOpen} maxWidth="lg">
        <DialogTitle>
          <FormattedMessage id={isEditMode ? 'editPriceBook' : 'createPricebook'} />
        </DialogTitle>
        <DialogContent dividers>
          <Grid>
            <Stack>
              <Grid item md={4}>
                <FormControl sx={{ m: 1, width: '280px' }}>
                  <Typography className="dialogHeading">
                    Name <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <TextField
                    label="Name"
                    id="name"
                    name="name"
                    required
                    variant="outlined"
                    value={priceBook.name}
                    sx={{ marginTop: '10px' }}
                    onChange={(e: any) => {
                      const { value } = e.target;
                      setPriceBook((prev: any) => {
                        return { ...prev, ...{ name: value } };
                      });
                    }}
                  />
                </FormControl>
              </Grid>
              <br />
              <Grid item md={12}>
                <Button onClick={() => onAddProduct()}>
                  <FormattedMessage id="addProductPlanSet" />
                </Button>
                <br />
                <br />
                <Stack direction="row">
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="products" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="plans" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="packageVersion" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                  <Typography width="290px" className="dialogHeading">
                    <FormattedMessage id="pricingModelVersion" />
                    <span style={{ color: 'red' }}> *</span>
                  </Typography>
                </Stack>
                <Divider />
                {ProductPlanRow}
              </Grid>
            </Stack>
          </Grid>
          <DialogActions>
            <Button sx={styles.dialogButton} onClick={handleClose}>
              <FormattedMessage id="cancel" />
            </Button>
            <Button sx={styles.dialogButton} onClick={() => handleSave()}>
              {isSaving ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <FormattedMessage id="save" />
              )}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
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
export default injectIntl(CreatePricebook);
