import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Grid } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import ProductClient from '../../api/Product/ProductAPIs';
import ConfirmDialog from '../../components/DialogBox/ConfirmDialog';
import DialogBox from '../../components/DialogBox/DialogBox';
import SearchAddCard from '../../components/SearchAddCard/SearchAddCard';
import Snackbar from '../../components/Snackbar/Snackbar';
import { getProductFields } from '../../constants/dialogBoxConstants';
import { ISnackBar } from '../../models/common';
import {
  addProductToList,
  deleteProduct,
  setIsProductLoading,
  setProductList,
  setSelectedProduct,
  updateProducts,
} from '../../store/products/products.slice';
import { REGEX } from '../../utils/helperService';
import './Products.scss';

const Products: React.FC<any> = ({ intl }) => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const productList = useSelector((state: any) => state.products.products);
  const isProductLoading = useSelector((state: any) => state.products.isProductLoading);
  const selectedProduct = useSelector((state: any) => state.products.selectedProduct);
  const [products, setProducts] = useState<any>(productList);
  const [productData, setProductData] = useState<any>({});
  const [open, toggleOpen] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [editLoader, setEditLoader] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteProd, setDeleteProd] = useState<any>({});

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

  useEffect(() => {
    if (ability.can('GET', 'Product')) getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProducts(productList);
  }, [productList]);

  useEffect(() => {
    setProductData(selectedProduct);
  }, [selectedProduct]);

  const onItemSelected = (item: any): any => {
    dispatch(setSelectedProduct(item));
    toggleOpen(true);
  };

  const onDeleteConfirm = (item: any): any => {
    setDeleteProd(item);
    setShowDeleteConfirmDialog(true);
  };

  const productEditConfig: any = [
    {
      icon: ability.can('PUT', 'Product') ? <EditIcon /> : null,
      onClickHandler: onItemSelected,
    },
    {
      icon: ability.can('DELETE', 'Product') ? <DeleteIcon /> : null,
      onClickHandler: onDeleteConfirm,
    },
  ];

  const onEditProduct = () => {
    setEditLoader(true);
    ProductClient.editProduct(selectedProduct.id, {
      id: selectedProduct.id,
      name: productData.name,
      description: productData.description || null,
    })
      .then(({ data }) => {
        setEditLoader(false);
        dispatch(updateProducts(data));
        dispatch(setSelectedProduct({}));
        toggleOpen(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'editProductSuccess' }),
        });
      })
      .catch((err) => {
        setEditLoader(false);
        console.error(err);
      });
  };

  const onDeleteProduct = () => {
    setEditLoader(true);
    ProductClient.deleteProduct(deleteProd.id)
      .then(({ data }) => {
        setShowDeleteConfirmDialog(false);
        setEditLoader(false);
        dispatch(deleteProduct(data));
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'deleteProductSuccess' }),
        });
      })
      .catch((err) => {
        setEditLoader(false);
        setShowDeleteConfirmDialog(false);
        console.error(err);
      });
  };

  const handleClose = () => {
    dispatch(setSelectedProduct({}));
    toggleOpen(false);
  };

  const onAddProduct = (value: any) => {
    if (value?.name) {
      if (
        products?.findIndex((p: any) => p.name === value.name) === -1 &&
        ability.can('POST', 'Product')
      ) {
        dispatch(setIsProductLoading(true));
        ProductClient.addProduct({ name: value.name, description: null })
          .then(({ data }) => {
            dispatch(setIsProductLoading(false));
            dispatch(addProductToList(data));
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addProductSuccess' }),
            });
          })
          .catch((err) => {
            dispatch(setIsProductLoading(false));
            console.error(err);
          });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={() => {}}>
      <Box
        sx={{
          marginRight: '30px',
          marginLeft: '10px',
          height: '86vh',
          borderRadius: '6px',
        }}>
        <Grid container>
          <Grid item md={8}>
            <SearchAddCard
              caption="searchOrAddProduct"
              cardHeader="products"
              data={products}
              isDragDisabled
              setAddOption={onAddProduct}
              actionConfig={productEditConfig}
              showProgress={isProductLoading}
              loading={isProductLoading}
            />
          </Grid>
          <DialogBox
            dialogConfig={{
              name: 'editProduct',
              fields: getProductFields(productData, setProductData),
              open,
              loader: editLoader,
              handleClose,
              handleSave: onEditProduct,
              initialValues: {
                name: productData.name ?? '',
                description: productData.description ?? '',
              },
              schema: Yup.object({
                name: Yup.string()
                  .trim()
                  .required('Please enter product name')
                  .matches(
                    REGEX,
                    'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                  ),
                description: Yup.string(),
              }),
            }}
          />
        </Grid>
      </Box>
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
      {showDeleteConfirmDialog ? (
        <ConfirmDialog
          dialogConfig={{
            name: 'confirmDelete',
            text: 'confirmMessage',
            open: showDeleteConfirmDialog,
            loader: editLoader,
            handleConfirm: onDeleteProduct,
            handleCancel: () => {
              setDeleteProd({});
              setShowDeleteConfirmDialog(false);
            },
          }}
        />
      ) : null}
    </DragDropContext>
  );
};

export default injectIntl(Products);
