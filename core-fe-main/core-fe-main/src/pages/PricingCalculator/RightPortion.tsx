import componentMapper from '@data-driven-forms/mui-component-mapper/component-mapper';
import { FormRenderer } from '@data-driven-forms/react-form-renderer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import ReplayIcon from '@mui/icons-material/Replay';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import _ from 'lodash';
import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import ContractClient from '../../api/Contract/ContractAPI';
import PricingCalculatorClient from '../../api/PricingCalculator/PricingCalculatorAPI';
import Snackbar from '../../components/Snackbar/Snackbar';
import { QuoteStatus, pricingColumnFields } from '../../constants/constants';
import { pricingTableColumn } from '../../mocks/pricingCalculator';
import { ISnackBar } from '../../models/common';
import {
  setPriceBookDetails,
  setSelectedQuoteDetails,
} from '../../store/pricing_calculator/pricingCalculator.slice';
import commonStyle from '../../styles/commonStyle';
import ConfigContract from './ConfigContract';
import NotesPopup from './NotesPopup';
import componentStyle from './PricingCalculatorStyle';
import './calculator.scss';
import FormTemplateComponent from './FormTemplateComponent';

interface IProps {
  intl: any;
  setDealTermsRef?: any;
  setDisableEscalation: (value: boolean) => void;
  disableEscalation: boolean;
}

const RightPortion: React.FC<IProps> = ({
  intl,
  setDealTermsRef,
  disableEscalation,
  setDisableEscalation,
}): ReactElement => {
  const dispatch = useDispatch();
  const userOperations = useSelector((state: any) => state.auth.userOperations);
  const selectedPricingProducts = useSelector(
    (state: any) => state.pricingCalculator.selectedPricingProducts,
  );
  const priceBookDiscounts = useSelector(
    (state: any) => state.pricingCalculator.priceBookDiscounts,
  );
  const priceBookDetails = useSelector((state: any) => state.pricingCalculator.priceBookDetails);
  const [openNote, setOpenNote] = useState(false);
  const [configPopup, setConfigPopup] = useState(false);
  const [changedCoreRowIndex, setChangeCoreRowIndex] = useState<any>(null);
  const [changedAddonsRowIndex, setChangeAddonRowIndex] = useState<any>(null);
  const selectedQuoteDetails = useSelector(
    (state: any) => state.pricingCalculator.selectedQuoteDetails,
  );
  const userId = useSelector((state: any) => state.auth.userId);
  const [apiLoader, setLoader] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [forwardToDealDeskLoader, setForwardToDealDeskLoader] = useState<boolean>(false);
  const [escalateLoader, setEscalateLoader] = useState<boolean>(false);
  const [contractSpecificLoader, setContractSpecificLoader] = useState<boolean>(false);
  const [resendToAeLoader, setResendToAeLoader] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [isApprovalRequired, setIsApprovalRequired] = useState<boolean>(false);
  const dealTermsSchema = useSelector((state: any) => state.pricingCalculator.dealTermsSchema);
  const dealTerms = useSelector((state: any) => state.pricingCalculator.dealTerms);
  const [grandTotal, setGrandTotal] = useState([]);
  const [calcBody, setCalcBody] = useState<any>({});

  useEffect(() => {
    if (priceBookDetails && priceBookDetails.id) {
      calCulateTotal(priceBookDetails);
    }
    // eslint-disable-next-line
  }, [priceBookDetails]);

  useEffect(() => {
    setIsApprovalRequired(false);
    selectedPricingProducts.forEach((item: any) => {
      item?.tiers?.forEach((tier: any) => {
        tier.details?.core?.rows?.forEach((core: any) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          core.values &&
            core.values.forEach((coreData: any) => {
              if (
                coreData.key === 'discount' &&
                coreData.error &&
                coreData.maxDiscount &&
                coreData.maxDiscount < coreData.value
              ) {
                setIsApprovalRequired(true);
              }
            });
        });
      });
    });
  }, [selectedPricingProducts]);

  useEffect(() => {
    const total: any = [];
    selectedPricingProducts.forEach((pr: any, i: number) => {
      pr.total.forEach((t: any) => {
        if (i === 0) {
          total.push(t);
        } else {
          const index = total.findIndex((v: any) => v.key === t.key);
          if (index !== -1 && total[index].value && t.value) {
            total[index] = { ...total[index], ...{ value: t.value + total[index].value } };
          }
        }
      });
    });
    if (total.length) {
      const discountIndex = total.findIndex((k: any) => k.key === 'discount');
      const listTotalIndex = total.findIndex(
        (k: any) => k.key === 'list_total_price' && k.value !== null && k.value !== 0,
      );
      const discountTotalIndex = total.findIndex(
        (k: any) => k.key === 'discounted_total_price' && k.value !== null && k.value !== 0,
      );
      if (
        discountIndex > -1 &&
        listTotalIndex > -1 &&
        discountTotalIndex > -1 &&
        total[listTotalIndex].value > total[discountTotalIndex].value
      ) {
        const discount = (
          ((total[listTotalIndex].value - total[discountTotalIndex].value) /
            total[listTotalIndex].value) *
          100
        ).toFixed(2);
        total[discountIndex] = { ...total[discountIndex], value: discount };
      }
    }
    setGrandTotal(total);
  }, [selectedPricingProducts]);

  // eslint-disable-next-line
  const openConfigPopup = () => {
    setConfigPopup(true);
  };

  const onInputChange = useCallback(
    (
      details: any,
      productId: string,
      tierId: string,
      rowIndex: number,
      colIndex: number,
      value: any,
      type: string,
      key: string,
      payloadOb: any,
    ) => {
      const tempData = JSON.parse(JSON.stringify(details));
      let productIndex = -1;
      let tierIndex = -1;
      productIndex = tempData.products.findIndex((item: any) => item.product_id === productId);
      if (productIndex > -1) {
        tierIndex = tempData.products[productIndex].tier_details.findIndex(
          (item: any) => item.tier_id === tierId,
        );
      }
      tempData.products[productIndex].tier_details[tierIndex].details[type].rows[rowIndex].values[
        colIndex
      ].value = Number(value);
      tempData.products[productIndex].tiers = tempData.products[productIndex].tier_details.filter(
        (tier: any) => tier.checked,
      );
      loadColumnData(
        productId,
        productIndex,
        tierIndex,
        rowIndex,
        value,
        type,
        key,
        tempData,
        payloadOb,
      );
      dispatch(setPriceBookDetails(tempData));
    },
    // eslint-disable-next-line
    [],
  );

  const loadColumnData = _.debounce(
    (
      productId,
      productIndex: number,
      tierIndex: number,
      rowIndex: number,
      value: any,
      type: string,
      key: string,
      tempData: any,
      payloadOb: any,
    ) => {
      if (key === 'qty' || key === 'discounted_unit_price' || key === 'discounted_total_price') {
        getTableData(productId, productIndex, tierIndex, rowIndex, tempData, type, key, payloadOb);
      }
    },
    1000,
  );

  const onResetRow = (
    details: any,
    productId: string,
    tierId: string,
    rowIndex: number,
    rowData: any,
    type: string,
    payloadOb: any,
  ) => {
    const payLoadTemp = payloadOb[productId] || {};
    const colIndex = rowData.values?.findIndex((c: any) => c.key === 'qty');
    if (colIndex > -1 && _.isNumber(rowData.values[colIndex].value)) {
      if (type === 'core') {
        if (_.has(payLoadTemp, ['discounted_total_price_dict', rowData.metric_column.key])) {
          delete payLoadTemp.discounted_total_price_dict[rowData.metric_column.key];
        }
        if (_.has(payLoadTemp, ['discounted_list_unit_price_dict', rowData.metric_column.key])) {
          delete payLoadTemp.discounted_list_unit_price_dict[rowData.metric_column.key];
        }
      }
      if (type === 'addons') {
        const addonIndex = payLoadTemp?.addons?.findIndex(
          (d: any) => d.id === rowData.id || d.id === rowData.addon_id,
        );
        if (addonIndex > -1 && rowData.addonRow) {
          if (
            _.has(payLoadTemp.addons[addonIndex], [
              'discounted_total_price_dict',
              rowData.metric_column.key,
            ])
          ) {
            delete payLoadTemp.addons[addonIndex].discounted_total_price_dict[
              rowData.metric_column.key
            ];
          }
          if (
            _.has(payLoadTemp.addons[addonIndex], [
              'discounted_list_unit_price_dict',
              rowData.metric_column.key,
            ])
          ) {
            delete payLoadTemp.addons[addonIndex].discounted_list_unit_price_dict[
              rowData.metric_column.key
            ];
          }
        } else if (addonIndex > -1) {
          if (_.has(payLoadTemp.addons[addonIndex], 'discounted_total_price_dict')) {
            delete payLoadTemp.addons[addonIndex].discounted_total_price_dict;
          }
        }
      }

      onInputChange(
        details,
        productId,
        tierId,
        rowIndex,
        colIndex,
        rowData.values[colIndex].value,
        type,
        'qty',
        { ...payloadOb, [productId]: payLoadTemp },
      );
    }
  };

  const getTableData = async (
    productId: string,
    productIndex: number,
    tierIndex: number,
    rowIndex: number,
    productArray: any,
    type: string,
    valueKey: string,
    payloadOb: any,
  ) => {
    try {
      const tempArray = JSON.parse(JSON.stringify(productArray));
      if (type === 'core') {
        setChangeCoreRowIndex(rowIndex);
      }
      if (type === 'addons') {
        setChangeAddonRowIndex(rowIndex);
      }

      const body = getApiBody(
        productId,
        tempArray.products[productIndex].tier_details[tierIndex].details,
        type,
        valueKey,
        rowIndex,
        payloadOb,
      );
      const response = await PricingCalculatorClient.pricingModelCalculation(
        tempArray.products[productIndex].pricing_model_id,
        tempArray.products[productIndex].tier_details[tierIndex].tier_id,
        body,
      );
      if (response.message === 'success') {
        setIsApprovalRequired(false);
        setDisableEscalation(true);
        if (response.data.addon_output) {
          response.data.addon_output.map((item: any) => {
            Object.keys(item).map((parentKey) => {
              Object.keys(item[parentKey]).map((subKey) => {
                if (pricingColumnFields.includes(subKey)) {
                  const addonIndex = tempArray.products[productIndex].tier_details[
                    tierIndex
                  ].details.addons.rows.findIndex((adb: any) => {
                    return adb.id === parentKey || adb.addon_id === parentKey;
                  });
                  if (addonIndex > -1) {
                    const findIndex = tempArray.products[productIndex].tier_details[
                      tierIndex
                    ].details.addons.rows[addonIndex].values.findIndex(
                      (field: any) => field.key === subKey,
                    );
                    if (findIndex > -1) {
                      tempArray.products[productIndex].tier_details[tierIndex].details.addons.rows[
                        addonIndex
                      ].values[findIndex].value = item[parentKey][subKey];
                    }
                  }
                } else {
                  const addonIndex = tempArray.products[productIndex].tier_details[
                    tierIndex
                  ].details.addons.rows.findIndex((adb: any) => {
                    if (adb.metric_column && adb.addon_id === parentKey) {
                      return adb.metric_column.key === subKey;
                    }
                    return false;
                  });
                  if (addonIndex > -1) {
                    Object.keys(item[parentKey][subKey]).map((key) => {
                      const findIndex = tempArray.products[productIndex].tier_details[
                        tierIndex
                      ].details.addons.rows[addonIndex].values.findIndex(
                        (field: any) => field.key === key,
                      );
                      if (findIndex > -1) {
                        tempArray.products[productIndex].tier_details[
                          tierIndex
                        ].details.addons.rows[addonIndex].values[findIndex].value =
                          item[parentKey][subKey][key];
                      }
                      return null;
                    });
                  }
                }
                return null;
              });
              return null;
            });
            return null;
          });
        }
        Object.keys(response.data).map((key) => {
          const findValuesColIndex = tempArray.products[productIndex].tier_details[
            tierIndex
          ].details.core.rows.findIndex((row: any) => row.metric_column.key === key);
          if (findValuesColIndex > -1) {
            Object.keys(response.data[key]).forEach((parentKey) => {
              const findIndex = tempArray.products[productIndex].tier_details[
                tierIndex
              ].details.core.rows[findValuesColIndex].values.findIndex(
                (field: any) => field.key === parentKey,
              );
              if (findIndex > -1) {
                tempArray.products[productIndex].tier_details[tierIndex].details.core.rows[
                  findValuesColIndex
                ].values[findIndex].value = response.data[key][parentKey];
              }
            });
          }
          return null;
        });
        dispatch(setPriceBookDetails(tempArray));
      }
      setChangeCoreRowIndex(null);
      setChangeAddonRowIndex(null);
    } catch (e) {
      setChangeCoreRowIndex(null);
      setChangeAddonRowIndex(null);
    }
  };

  const getApiBody = (
    productId: string,
    details: any,
    type: string,
    valueKey: string,
    rowIndex: number,
    payloadOb: any,
  ) => {
    const prevPostBody = payloadOb[productId] ?? {};
    let body: any = {
      output_keys: {} as any,
      quantity_dict: {} as any,
      addons: [] as any,
    };
    if (type === 'core') {
      body = { ...body, addons: prevPostBody.addons ?? [] };
      const discountedListUnitPrice = {} as any;
      const discountedTotalPrice = {} as any;
      details?.core?.rows.map((item: any, i: number) => {
        const qty = item.values.find((value: any) => value.key === 'qty');
        if (qty?.key && qty.value !== undefined && qty.value !== null) {
          body.output_keys[item?.metric_column?.key] = item.output_column.key;
          body.quantity_dict[item?.metric_column?.key] = qty.value;
        }
        if (valueKey === 'discounted_unit_price' && rowIndex === i) {
          const discountUnit = item.values.find(
            (value: any) => value.key === 'discounted_unit_price',
          );
          if (
            (discountUnit?.key &&
              discountUnit.value !== undefined &&
              discountUnit.value !== null) ||
            (_.isObject(discountUnit.value) && !_.isEmpty(discountUnit.value))
          ) {
            const ob = {} as any;
            if (item.unit_columns.length) {
              item.unit_columns.map((u: any) => {
                ob[u.key] =
                  _.isObject(discountUnit.value) && Object.keys(discountUnit.value).includes(u.key)
                    ? discountUnit.value[u.key]
                    : discountUnit.value;
                return null;
              });
            }
            discountedListUnitPrice[item?.metric_column?.key] = ob;
            if (
              prevPostBody?.discounted_total_price_dict &&
              Object.keys(prevPostBody?.discounted_total_price_dict).includes(
                item?.metric_column?.key,
              )
            ) {
              delete prevPostBody.discounted_total_price_dict[item?.metric_column?.key];
            }
          }
        }
        if (valueKey === 'discounted_total_price' && rowIndex === i) {
          const discountedTotal = item.values.find(
            (value: any) => value.key === 'discounted_total_price',
          );
          if (
            discountedTotal?.key &&
            discountedTotal.value !== undefined &&
            discountedTotal.value !== null
          ) {
            discountedTotalPrice[item?.metric_column?.key] = discountedTotal.value;
            if (
              prevPostBody?.discounted_list_unit_price_dict &&
              Object.keys(prevPostBody?.discounted_list_unit_price_dict).includes(
                item?.metric_column?.key,
              )
            ) {
              delete prevPostBody.discounted_list_unit_price_dict[item?.metric_column?.key];
            }
          }
        }
        return null;
      });

      body.discounted_list_unit_price_dict = {
        ...prevPostBody?.discounted_list_unit_price_dict,
        ...discountedListUnitPrice,
      };
      body.discounted_total_price_dict = {
        ...prevPostBody?.discounted_total_price_dict,
        ...discountedTotalPrice,
      };
      if (_.isEmpty(body.discounted_list_unit_price_dict)) {
        body = _.omit(body, 'discounted_list_unit_price_dict');
      }
      if (_.isEmpty(body.discounted_total_price_dict)) {
        body = _.omit(body, 'discounted_total_price_dict');
      }
    }
    if (type === 'addons') {
      body = _.isEmpty(prevPostBody) ? body : { ..._.omit(prevPostBody, ['addons']), addons: [] };
      details?.addons?.rows.map((item: any, index: number) => {
        if (index === rowIndex) {
          if (item.values.length) {
            const findAddon = body.addons.findIndex(
              (adb: any) => adb.id === item.id || adb.id === item.addon_id,
            );
            const discountedListUnitPrice = {} as any;
            const discountedTotalPrice = {} as any;
            const qty = item.values.find((value: any) => value.key === 'qty');
            if (qty?.key && qty.value !== undefined && qty.value !== null) {
              if (item?.metric_column?.key) {
                if (findAddon > -1) {
                  body.addons[findAddon].units[item.metric_column.key] = qty.value;
                  body.addons[findAddon].addon_output_keys[item.metric_column.key] =
                    item.output_column.key;
                } else {
                  body.addons.push({
                    id: item.addon_id ?? item.id,
                    units: {
                      [item.metric_column.key]: qty.value,
                    },
                    addon_output_keys: {
                      [item.metric_column.key]: item.output_column.key,
                    },
                  });
                }
              } else {
                body.addons.push({ id: item.addon_id ?? item.id, units: qty.value });
              }
            }
            if (valueKey === 'discounted_unit_price') {
              const discountUnit: any = item.values.find(
                (value: any) => value.key === 'discounted_unit_price',
              );
              if (
                (discountUnit?.key &&
                  discountUnit.value !== undefined &&
                  discountUnit.value !== null) ||
                (_.isObject(discountUnit.value) && !_.isEmpty(discountUnit.value))
              ) {
                if (item?.metric_column?.key) {
                  if (findAddon > -1) {
                    const rowInd = details.addons.rows.findIndex(
                      (r: any) => r?.customAddonMetric === true,
                    );
                    const configIndex = details.addons.rows[rowInd].fields.findIndex(
                      (fi: any) => fi.metric_column.key === item.metric_column.key,
                    );
                    const ob = {} as any;
                    if (details.addons.rows[rowInd].fields[configIndex].unit_columns.length) {
                      details.addons.rows[rowInd].fields[configIndex].unit_columns.map((u: any) => {
                        ob[u.key] = discountUnit.value;
                        return null;
                      });
                    }
                    discountedListUnitPrice[item.metric_column.key] = ob;
                    if (
                      prevPostBody?.addons[findAddon]?.discounted_total_price_dict &&
                      Object.keys(
                        prevPostBody?.addons[findAddon]?.discounted_total_price_dict,
                      ).includes(item?.metric_column?.key)
                    ) {
                      delete prevPostBody?.addons[findAddon].discounted_total_price_dict[
                        item?.metric_column?.key
                      ];
                    }
                  }
                }
              }
            }
            if (valueKey === 'discounted_total_price') {
              const discountTotal: any = item.values.find(
                (value: any) => value.key === 'discounted_total_price',
              );
              if (
                (discountTotal?.key &&
                  discountTotal.value !== undefined &&
                  discountTotal.value !== null) ||
                (_.isObject(discountTotal.value) && !_.isEmpty(discountTotal.value))
              ) {
                if (item?.metric_column?.key) {
                  if (findAddon > -1) {
                    discountedTotalPrice[item.metric_column.key] = discountTotal.value;
                    if (
                      prevPostBody?.addons[findAddon]?.discounted_list_unit_price_dict &&
                      Object.keys(
                        prevPostBody?.addons[findAddon]?.discounted_list_unit_price_dict,
                      ).includes(item?.metric_column?.key)
                    ) {
                      delete prevPostBody?.addons[findAddon].discounted_list_unit_price_dict[
                        item?.metric_column?.key
                      ];
                    }
                  }
                } else {
                  const addon = body.addons.findIndex(
                    (adb: any) => adb.id === item.id || adb.id === item.addon_id,
                  );
                  if (addon > -1) {
                    body.addons[addon].discounted_total_price_dict = discountTotal.value;
                  }
                }
              }
            }
            if (findAddon > -1 && body.addons[findAddon]) {
              body.addons[findAddon].discounted_list_unit_price_dict = {
                ...prevPostBody.addons[findAddon]?.discounted_list_unit_price_dict,
                ...discountedListUnitPrice,
              };
              body.addons[findAddon].discounted_total_price_dict = {
                ...prevPostBody?.addons[findAddon].discounted_total_price_dict,
                ...discountedTotalPrice,
              };
            }
            if (valueKey === 'qty') {
              if (findAddon <= -1) {
                const addon = body.addons.findIndex(
                  (adb: any) => adb.id === item.id || adb.id === item.addon_id,
                );
                if (
                  addon > -1 &&
                  Object.keys(body.addons[addon]).includes('discounted_total_price_dict')
                ) {
                  body.addons[addon] = _.omit(body.addons[addon], 'discounted_total_price_dict');
                }
              }
            }
            if (
              findAddon > -1 &&
              _.isEmpty(body.addons[findAddon]?.discounted_list_unit_price_dict)
            ) {
              body.addons[findAddon] = _.omit(
                body.addons[findAddon],
                'discounted_list_unit_price_dict',
              );
            }
            if (findAddon > -1 && _.isEmpty(body.addons[findAddon]?.discounted_total_price_dict)) {
              body.addons[findAddon] = _.omit(
                body.addons[findAddon],
                'discounted_total_price_dict',
              );
            }
          }
        } else if (Object.keys(prevPostBody).length) {
          const prevData = prevPostBody?.addons.findIndex(
            (ad: any) => details.addons.rows[index].id === ad.id,
          );
          if (prevData > -1) {
            body.addons.push(prevPostBody.addons[prevData]);
          }
        }
        return null;
      });
    }
    setCalcBody({ ...payloadOb, [productId]: body });
    return body;
  };

  // const calculateDiscount = (
  //   // to be changed
  //   productIndex: number,
  //   tierIndex: number,
  //   rowIndex: number,
  //   value: any,
  //   type: any,
  //   productArray: any,
  //   listUnitPriceData: any,
  // ) => {
  //   let priceDiff =
  //     // eslint-disable-next-line
  //     value == 0
  //       ? 0
  //       : ((Number(listUnitPriceData.value) - Number(value)) * 100) /
  //         Number(listUnitPriceData.value);
  //   if (priceDiff > 100) {
  //     priceDiff = 0;
  //   }
  //   if (isFloat(priceDiff)) {
  //     priceDiff = Number(priceDiff.toFixed(2));
  //   }
  //   const tempArray = JSON.parse(JSON.stringify(productArray));
  //   let qty = 0;
  //   let listUnitPrice = 0;
  //   tempArray.products[productIndex].tier_details[tierIndex].details[type].rows[
  //     rowIndex
  //   ].values.map((item: any) => {
  //     if (item.key === 'qty' && item.value !== null) {
  //       qty = item.value;
  //     }
  //     if (item.key === 'list_unit_price' && item.value !== null) {
  //       listUnitPrice = item.value;
  //     }
  //     if (item.key === 'discount') {
  //       item.value = priceDiff;
  //     }
  //     if (item.key === 'discounted_total_price') {
  //       if (value === '0' || value === '') {
  //         item.value = listUnitPrice * qty;
  //       } else {
  //         item.value = value * qty;
  //       }
  //     }
  //     return null;
  //   });
  //   dispatch(setPriceBookDetails(tempArray));
  // };

  const isFloat = (n: number) => {
    return Number(n) === n && n % 1 !== 0;
  };

  const calCulateTotal = (array: any) => {
    const tempArray = JSON.parse(JSON.stringify(array));
    tempArray.products.map((product: any) => {
      product.total.map((productTotal: any) => {
        if (product.tiers && product.tiers.length > 0) {
          productTotal.value = 0;
          product.tiers.map((tier: any) => {
            const tierIndex = product.tier_details.findIndex(
              (xy: any) => xy.tier_id === tier.tier_id,
            );
            if (tier && tier.details && tier.details.core && tier.details.core.rows) {
              tier.details.core.rows.map((rowData: any, k: number) => {
                const findIndex = rowData.values.findIndex(
                  (rowValue: any) => rowValue.key === productTotal.key,
                );
                if (findIndex > -1 && !rowData.metric && rowData.values[findIndex].value !== null) {
                  if (product.discount) {
                    if (
                      productTotal.key === 'discount' &&
                      product.discount < rowData.values[findIndex].value
                    ) {
                      rowData.values[findIndex].error = true;
                      rowData.values[findIndex].maxDiscount = product.discount;
                      product.tier_details[tierIndex].details.core.rows[k].values[findIndex].error =
                        true;
                      product.tier_details[tierIndex].details.core.rows[k].values[
                        findIndex
                      ].maxDiscount = product.discount;
                    } else {
                      rowData.values[findIndex].error = false;
                      product.tier_details[tierIndex].details.core.rows[k].values[findIndex].error =
                        false;
                    }
                    if (productTotal.key === 'discounted_total_price') {
                      const filerData = rowData.values.filter(
                        (fields: any) => fields.key === 'discount',
                      );
                      if (filerData && filerData.length > 0) {
                        product.tier_details[tierIndex].details.core.rows[k].values[
                          findIndex
                        ].error = filerData[0].error;
                        product.tier_details[tierIndex].details.core.rows[k].values[
                          findIndex
                        ].maxDiscount = filerData[0].maxDiscount;
                      }
                    }
                  }
                  productTotal.value += rowData.values[findIndex].value;
                }
                return null;
              });
              tier.details.addons.rows.map((rowData: any, k: number) => {
                const findIndex = rowData.values?.findIndex(
                  (rowValue: any) => rowValue.key === productTotal.key,
                );
                if (findIndex > -1 && rowData.values[findIndex].value !== null) {
                  if (product.discount) {
                    if (
                      productTotal.key === 'discount' &&
                      product.discount < rowData.values[findIndex].value
                    ) {
                      rowData.values[findIndex].error = true;
                      rowData.values[findIndex].maxDiscount = product.discount;
                      product.tier_details[tierIndex].details.addons.rows[k].values[
                        findIndex
                      ].error = true;
                      product.tier_details[tierIndex].details.addons.rows[k].values[
                        findIndex
                      ].maxDiscount = product.discount;
                    } else {
                      rowData.values[findIndex].error = false;
                      product.tier_details[tierIndex].details.addons.rows[k].values[
                        findIndex
                      ].error = false;
                    }
                    if (productTotal.key === 'discounted_total_price') {
                      const filerData = rowData.values.filter(
                        (fields: any) => fields.key === 'discount',
                      );
                      if (filerData && filerData.length > 0) {
                        product.tier_details[tierIndex].details.addons.rows[k].values[
                          findIndex
                        ].error = filerData[0].error;
                        product.tier_details[tierIndex].details.addons.rows[k].values[
                          findIndex
                        ].maxDiscount = filerData[0].maxDiscount;
                      }
                    }
                  }
                  productTotal.value += rowData.values[findIndex].value;
                }
                return null;
              });
            }

            return null;
          });
        }
        return null;
      });
      if (product.total) {
        const listTotalIndex = product.total.findIndex((x: any) => x.key === 'list_total_price');
        const discountIndex = product.total.findIndex((x: any) => x.key === 'discount');
        const discountTotalIndex = product.total.findIndex(
          (x: any) => x.key === 'discounted_total_price',
        );
        if (
          listTotalIndex > -1 &&
          discountIndex > -1 &&
          discountTotalIndex > -1 &&
          product.total[listTotalIndex].value != null &&
          product.total[discountTotalIndex].value != null
        ) {
          let discountDiff =
            product.total[listTotalIndex].value - product.total[discountTotalIndex].value;
          if (discountDiff < 0) {
            discountDiff = 0;
          }
          let totalDiscount = (discountDiff * 100) / product.total[listTotalIndex].value;
          if (totalDiscount === 100) {
            totalDiscount = 0;
          }
          if (isFloat(totalDiscount)) {
            totalDiscount = Number(totalDiscount.toFixed(2));
          }
          product.total[discountIndex].value = totalDiscount;
          if (totalDiscount > product.discount) {
            product.total[discountIndex].error = true;
          } else {
            product.total[discountIndex].error = false;
          }
        }
      }
      if (product?.tiers?.length > 0) {
        product.tiers = product.tier_details.filter((tier: any) => tier.checked);
      }
      return null;
    });
    if (JSON.stringify(priceBookDetails) !== JSON.stringify(tempArray)) {
      dispatch(setPriceBookDetails(tempArray));
    }
  };

  const filterColumncell = (coreData: any, showError = true) => {
    if (['qty', 'list_unit_price', 'discounted_unit_price'].includes(coreData.key)) return null;
    return columnsCell(coreData, showError);
  };

  const columnsCell = (coreData: any, showError = true) => {
    return (
      <Tooltip
        componentsProps={{
          tooltip: {
            sx: componentStyle.tooltipStyle,
          },
        }}
        title={
          coreData.error ? (
            <FormattedMessage
              id="maxEscalateDiscount"
              values={{ discount: coreData.maxDiscount }}
            />
          ) : (
            ''
          )
        }>
        <Box sx={componentStyle.cellContainer}>
          <Box sx={componentStyle.cellText(coreData.error)}>
            {
              // eslint-disable-next-line no-nested-ternary
              _.isObject(coreData.value)
                ? Object.keys(coreData.value).length
                  ? Object.values(coreData.value)[0]
                  : null
                : coreData.value
            }
          </Box>
          {showError && coreData.error ? <InfoIcon sx={componentStyle.infoIcon} /> : null}
        </Box>
      </Tooltip>
    );
  };

  const saveComments = async (comment: string) => {
    try {
      setLoader(true);
      const response = await PricingCalculatorClient.addComment(selectedQuoteDetails.id, {
        comment,
      });
      if (response.message === 'success') {
        setOpenNote(false);
        setLoader(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: selectedOption }),
        });
        setSelectedOption('');
      }
    } catch (e) {
      setLoader(false);
      console.error(e);
    }
  };

  const forwardToDealDesk = async () => {
    try {
      setForwardToDealDeskLoader(true);
      const response = await PricingCalculatorClient.forwardToDealDesk(selectedQuoteDetails.id);
      if (response.message === 'success') {
        setSelectedOption('quoteForwarded');
        setOpenNote(true);
        const tempObject = JSON.parse(JSON.stringify(selectedQuoteDetails));
        dispatch(
          setSelectedQuoteDetails({
            ...tempObject,
            assigned_to_id: response.data?.assigned_to ?? '',
            status: QuoteStatus.FORWARD_TO_DD,
          }),
        );
      }
      setForwardToDealDeskLoader(false);
    } catch (e) {
      setForwardToDealDeskLoader(false);
      console.error(e);
    }
  };

  const resendToAE = async () => {
    try {
      setResendToAeLoader(true);
      const response = await PricingCalculatorClient.resendToAe(selectedQuoteDetails.id);
      if (response.message === 'success') {
        setSelectedOption('quoteResent');
        setOpenNote(true);
        const tempObject = JSON.parse(JSON.stringify(selectedQuoteDetails));
        dispatch(
          setSelectedQuoteDetails({
            ...tempObject,
            assigned_to_id: response.data?.assigned_to ?? '',
            status: QuoteStatus.DRAFT,
          }),
        );
      }
      setResendToAeLoader(false);
    } catch (e) {
      setResendToAeLoader(false);
      console.error(e);
    }
  };

  const selfApproval = async (status: string) => {
    try {
      setEscalateLoader(true);
      const response = await PricingCalculatorClient.selfApproval(selectedQuoteDetails.id, status);
      if (response.message === 'success') {
        const tempObject = JSON.parse(JSON.stringify(selectedQuoteDetails));
        dispatch(
          setSelectedQuoteDetails({
            ...tempObject,
            status,
          }),
        );
      }
      setEscalateLoader(false);
    } catch (e) {
      setEscalateLoader(false);
      console.error(e);
    }
  };

  const escalateToManager = async (status: string) => {
    try {
      const body = { status } as any;
      body.details = [];
      selectedQuoteDetails.quote_details.map((item: any) => {
        const product = { product_id: item.product_id } as any;
        item.tiers.map((tier: any) => {
          const filterDiscount = tier.total.filter((column: any) => column.key === 'discount');
          if (filterDiscount && filterDiscount.length > 0) {
            product.discount = filterDiscount[0].value.toString();
          }
          return null;
        });
        body.details.push(product);
        return null;
      });
      setEscalateLoader(true);
      const response = await PricingCalculatorClient.escalateForApproval(
        selectedQuoteDetails.id,
        body,
      );
      if (response.message === 'success') {
        setOpenNote(true);
        const tempObject = JSON.parse(JSON.stringify(selectedQuoteDetails));
        dispatch(
          setSelectedQuoteDetails({
            ...tempObject,
            assigned_to_id: response.data?.assigned_to ?? '',
            status,
          }),
        );
        setEscalateLoader(false);
      }
    } catch (e) {
      setEscalateLoader(false);
      console.error(e);
    }
  };

  const getPlaceHolder = (key: string, isDisabledColumn: boolean) => {
    if (key === 'discounted_unit_price' && isDisabledColumn) return '';
    if (key === 'discounted_unit_price' || key === 'discounted_total_price')
      return intl.formatMessage({
        id: 'price',
      });

    if (key === 'qty')
      return intl.formatMessage({
        id: 'quantity',
      });
    return '';
  };

  const getButtonLabel = () => {
    if (isApprovalRequired) {
      return intl.formatMessage({ id: 'escalateForApproval' });
    }
    return intl.formatMessage({ id: 'finalise' });
  };

  const updateContractSpecificData = (configSpecificData: any) => {
    setContractSpecificLoader(true);
    ContractClient.saveContractSpecificConfig(selectedQuoteDetails.id, configSpecificData)
      .then(() => {
        setConfigPopup(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: 'Config updated successfully',
        });
        setContractSpecificLoader(false);
      })
      .catch((e) => {
        console.error(e);
        setContractSpecificLoader(false);
      });
  };

  return (
    <Box>
      {!priceBookDiscounts.length || !priceBookDiscounts.some((p: any) => _.has(p, 'discount')) ? (
        <Box sx={{ color: 'red', fontSize: 15, pb: 1 }}>
          <Typography>*No discounting policy assigned to this user</Typography>
        </Box>
      ) : (
        ''
      )}
      <Table sx={componentStyle.tableContainer}>
        <TableHead>
          <TableRow sx={componentStyle.tableHeaderRow}>
            <TableCell sx={componentStyle.tableSpace}>
              {intl.formatMessage({ id: 'granular_quote' })}
            </TableCell>
            {pricingTableColumn.map((item, index) => {
              return (
                <TableCell
                  sx={[
                    componentStyle.tableCell,
                    index === pricingTableColumn.length - 1 ? componentStyle.lastItem : {},
                  ]}
                  key={item.key}>
                  {item.name}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedPricingProducts.length > 0 &&
            selectedPricingProducts.map((item: any) => {
              return (
                <React.Fragment key={item.product_id}>
                  <TableRow sx={componentStyle.productRow}>
                    <TableCell colSpan={7} sx={componentStyle.productLabel}>
                      {item.product_name}
                      <Box
                        sx={{ color: 'red', fontSize: 15, pb: 1, display: 'inline-block', ml: 2 }}>
                        <Typography sx={{ fontSize: '14px' }}>
                          {
                            // eslint-disable-next-line no-nested-ternary
                            !priceBookDiscounts.length ||
                            !priceBookDiscounts.some((p: any) => _.has(p, 'discount'))
                              ? ''
                              : priceBookDiscounts.find(
                                  (d: any) => d.product_id === item.product_id,
                                )?.discount
                              ? ` *Maximum discount allowed for this user: ${
                                  priceBookDiscounts.find(
                                    (d: any) => d.product_id === item.product_id,
                                  )?.discount
                                }%`
                              : ` *No discount policy available for this product`
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {item.tiers &&
                    item.tiers.map((tier: any) => {
                      return (
                        <React.Fragment key={tier.tier_id}>
                          <TableRow>
                            <TableCell colSpan={1} sx={componentStyle.tierLabel}>
                              <Box sx={componentStyle.displayFlex}>
                                <Box>{tier.tier_name}</Box>
                                <Box sx={componentStyle.rightContainer}>
                                  {intl.formatMessage({ id: 'driving_fields' })}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell colSpan={6} />
                          </TableRow>
                          {tier.details
                            ? tier.details.core.rows.map((core: any, coreRowIndex: number) => {
                                return (
                                  <TableRow key={core.output_column.key}>
                                    <TableCell
                                      sx={[
                                        componentStyle.tierSubData,
                                        componentStyle.tierSubPaddingLeft,
                                      ]}>
                                      <Box sx={componentStyle.displayFlex}>
                                        {/* <Box>{core.metric ? core?.metric_name : ''}</Box> */}
                                        <Box sx={componentStyle.rightContainer}>
                                          {core.output_column?.name}
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    {core.values &&
                                      core.values.map((coreData: any, colIndex: number) => {
                                        if (
                                          changedCoreRowIndex !== coreRowIndex ||
                                          (changedCoreRowIndex === coreRowIndex &&
                                            coreData.key === 'qty')
                                        ) {
                                          // const valueBody = {} as any;
                                          // if (coreData.key === 'qty' && !coreData.metric) {
                                          //   valueBody.value = coreData.value ?? '';
                                          // }
                                          return (
                                            <TableCell
                                              key={coreData.key}
                                              sx={[
                                                componentStyle.tierSubData,
                                                componentStyle.textCenter,
                                                coreData.error
                                                  ? { ...componentStyle.alertMessage }
                                                  : {},
                                              ]}>
                                              {coreData.key === 'qty' ? (
                                                <IconButton
                                                  aria-label="reset"
                                                  sx={componentStyle.resetIconPosition}
                                                  onClick={() =>
                                                    onResetRow(
                                                      priceBookDetails,
                                                      item.product_id,
                                                      tier.tier_id,
                                                      coreRowIndex,
                                                      core,
                                                      'core',
                                                      calcBody,
                                                    )
                                                  }>
                                                  <ReplayIcon sx={{ width: '0.85em' }} />
                                                </IconButton>
                                              ) : null}
                                              {coreData.key === 'qty' ||
                                              coreData.key === 'discounted_unit_price' ||
                                              coreData.key === 'discounted_total_price' ? (
                                                <Tooltip
                                                  title={
                                                    coreData.key === 'qty'
                                                      ? core.metric_column.name
                                                      : ''
                                                  }>
                                                  <TextField
                                                    type="number"
                                                    disabled={
                                                      coreData.key === 'discounted_unit_price' &&
                                                      core.unit_columns?.length === 0
                                                    }
                                                    defaultValue={
                                                      // eslint-disable-next-line no-nested-ternary
                                                      _.isObject(coreData.value)
                                                        ? Object.keys(coreData.value).length
                                                          ? Object.values(coreData.value)[0]
                                                          : ''
                                                        : coreData.value
                                                    }
                                                    value={
                                                      // eslint-disable-next-line no-nested-ternary
                                                      _.isObject(coreData.value)
                                                        ? Object.keys(coreData.value).length
                                                          ? Object.values(coreData.value)[0]
                                                          : ''
                                                        : coreData.value
                                                    }
                                                    onChange={(e) => {
                                                      onInputChange(
                                                        priceBookDetails,
                                                        item.product_id,
                                                        tier.tier_id,
                                                        coreRowIndex,
                                                        colIndex,
                                                        e.target.value,
                                                        'core',
                                                        coreData.key,
                                                        calcBody,
                                                      );
                                                    }}
                                                    placeholder={getPlaceHolder(
                                                      coreData.key,
                                                      core.unit_columns?.length === 0,
                                                    )}
                                                    InputProps={{
                                                      inputProps: {
                                                        min: 0,
                                                        style: {
                                                          textAlign: 'center',
                                                          padding: '0px',
                                                        },
                                                        step: 0.1,
                                                        readOnly:
                                                          (changedCoreRowIndex !== null &&
                                                            changedCoreRowIndex !== coreRowIndex) ||
                                                          (coreData.key ===
                                                            'discounted_unit_price' &&
                                                            priceBookDiscounts?.length === 0),
                                                      },
                                                    }}
                                                    sx={componentStyle.inputField}
                                                  />
                                                </Tooltip>
                                              ) : (
                                                columnsCell(coreData)
                                              )}
                                            </TableCell>
                                          );
                                        }
                                        return null;
                                      })}
                                    {changedCoreRowIndex !== null &&
                                    changedCoreRowIndex === coreRowIndex ? (
                                      <TableCell
                                        sx={componentStyle.centerLoader}
                                        key={uuidv4()}
                                        colSpan={5}>
                                        <CircularProgress size={20} />
                                      </TableCell>
                                    ) : null}
                                  </TableRow>
                                );
                              })
                            : null}
                          {tier.details
                            ? tier.details.addons.rows.map((adb: any, addonRowIndex: number) => {
                                return (
                                  <TableRow
                                    key={
                                      adb.output_column
                                        ? adb.output_column.key
                                        : adb.addon_id || adb.id
                                    }>
                                    <TableCell
                                      colSpan={adb.customAddonMetric ? 7 : 1}
                                      sx={componentStyle.tierLabel}>
                                      {adb.addonRow ? (
                                        <Box sx={componentStyle.displayFlex}>
                                          {/* <Box>{core.metric ? core?.metric_name : ''}</Box> */}
                                          <Box sx={componentStyle.rightContainer}>
                                            {adb.output_column.name}
                                          </Box>
                                        </Box>
                                      ) : (
                                        adb.name
                                      )}
                                    </TableCell>
                                    {adb.values &&
                                      adb.values.map((coreData: any, colIndex: number) => {
                                        if (
                                          changedAddonsRowIndex !== addonRowIndex ||
                                          (changedAddonsRowIndex === addonRowIndex &&
                                            coreData.key === 'qty')
                                        ) {
                                          return (
                                            <TableCell
                                              key={coreData.key}
                                              sx={[
                                                componentStyle.tierSubData,
                                                componentStyle.textCenter,
                                                coreData.error
                                                  ? { ...componentStyle.alertMessage }
                                                  : {},
                                              ]}>
                                              {coreData.key === 'qty' ? (
                                                <IconButton
                                                  aria-label="reset"
                                                  sx={componentStyle.resetIconPosition}
                                                  onClick={() =>
                                                    onResetRow(
                                                      priceBookDetails,
                                                      item.product_id,
                                                      tier.tier_id,
                                                      addonRowIndex,
                                                      adb,
                                                      'addons',
                                                      calcBody,
                                                    )
                                                  }>
                                                  <ReplayIcon sx={{ width: '0.85em' }} />
                                                </IconButton>
                                              ) : null}
                                              {coreData.key === 'qty' ||
                                              coreData.key === 'discounted_unit_price' ||
                                              coreData.key === 'discounted_total_price' ? (
                                                <Tooltip
                                                  title={
                                                    coreData.key === 'qty' && adb.metric_column
                                                      ? adb.metric_column.name
                                                      : ''
                                                  }>
                                                  {!adb.sell_multiple &&
                                                  !adb.metric_column &&
                                                  coreData.key === 'qty' ? (
                                                    <Select
                                                      displayEmpty
                                                      value={coreData.value ?? ''}
                                                      onChange={(e) => {
                                                        onInputChange(
                                                          priceBookDetails,
                                                          item.product_id,
                                                          tier.tier_id,
                                                          addonRowIndex,
                                                          colIndex,
                                                          e.target.value,
                                                          'addons',
                                                          coreData.key,
                                                          calcBody,
                                                        );
                                                      }}
                                                      inputProps={{
                                                        style: {
                                                          textAlign: 'center',
                                                          padding: '0px',
                                                        },
                                                        readOnly:
                                                          (changedAddonsRowIndex !== null &&
                                                            changedAddonsRowIndex !==
                                                              addonRowIndex) ||
                                                          (coreData.key ===
                                                            'discounted_unit_price' &&
                                                            priceBookDiscounts?.length === 0),
                                                      }}
                                                      sx={{
                                                        ...componentStyle.inputField,
                                                        '& .MuiSelect-select': {
                                                          textAlign: 'center',
                                                        },
                                                        // margin: '10px',
                                                        width: '135px',
                                                        height: '30px',
                                                      }}>
                                                      <MenuItem key={0} value="0">
                                                        0
                                                      </MenuItem>
                                                      <MenuItem key={1} value="1">
                                                        1
                                                      </MenuItem>
                                                    </Select>
                                                  ) : (
                                                    <TextField
                                                      type="number"
                                                      defaultValue={
                                                        // eslint-disable-next-line no-nested-ternary
                                                        _.isObject(coreData.value)
                                                          ? Object.keys(coreData.value).length
                                                            ? Object.values(coreData.value)[0]
                                                            : ''
                                                          : coreData.value
                                                      }
                                                      value={
                                                        // eslint-disable-next-line no-nested-ternary
                                                        _.isObject(coreData.value)
                                                          ? Object.keys(coreData.value).length
                                                            ? Object.values(coreData.value)[0]
                                                            : ''
                                                          : coreData.value
                                                      }
                                                      disabled={
                                                        coreData.key === 'discounted_unit_price' &&
                                                        !adb.metric_column
                                                      }
                                                      placeholder={getPlaceHolder(
                                                        coreData.key,
                                                        !adb.metric_column,
                                                      )}
                                                      onChange={(e) => {
                                                        onInputChange(
                                                          priceBookDetails,
                                                          item.product_id,
                                                          tier.tier_id,
                                                          addonRowIndex,
                                                          colIndex,
                                                          e.target.value,
                                                          'addons',
                                                          coreData.key,
                                                          calcBody,
                                                        );
                                                      }}
                                                      InputProps={{
                                                        inputProps: {
                                                          min: 0,
                                                          style: {
                                                            textAlign: 'center',
                                                            padding: '0px',
                                                          },
                                                          step: 0.1,
                                                          readOnly:
                                                            (changedAddonsRowIndex !== null &&
                                                              changedAddonsRowIndex !==
                                                                addonRowIndex) ||
                                                            (coreData.key ===
                                                              'discounted_unit_price' &&
                                                              priceBookDiscounts?.length === 0),
                                                        },
                                                      }}
                                                      sx={componentStyle.inputField}
                                                    />
                                                  )}
                                                  {/* <TextField
                                                    type="number"
                                                    defaultValue={coreData.value ?? ''}
                                                    placeholder={intl.formatMessage({
                                                      id:
                                                        coreData.key === 'discounted_unit_price'
                                                          ? 'price'
                                                          : 'quantity',
                                                    })}
                                                    onChange={(e) => {
                                                      onInputChange(
                                                        priceBookDetails,
                                                        item.product_id,
                                                        tier.tier_id,
                                                        addonRowIndex,
                                                        colIndex,
                                                        e.target.value,
                                                        'addons',
                                                        coreData.key,
                                                      );
                                                    }}
                                                    InputProps={{
                                                      inputProps: {
                                                        min: 0,
                                                        max: adb.sell_multiple ? '' : 1,
                                                        style: {
                                                          textAlign: 'center',
                                                          padding: '0px',
                                                        },
                                                        readOnly:
                                                          (changedAddonsRowIndex !== null &&
                                                            changedAddonsRowIndex !==
                                                              addonRowIndex) ||
                                                          (coreData.key ===
                                                            'discounted_unit_price' &&
                                                            priceBookDiscounts?.length === 0),
                                                      },
                                                    }}
                                                    sx={componentStyle.inputField}
                                                  /> */}
                                                </Tooltip>
                                              ) : (
                                                columnsCell(coreData)
                                              )}
                                            </TableCell>
                                          );
                                        }
                                        return null;
                                      })}
                                    {changedAddonsRowIndex !== null &&
                                    changedAddonsRowIndex === addonRowIndex ? (
                                      <TableCell
                                        sx={componentStyle.centerLoader}
                                        key={uuidv4()}
                                        colSpan={5}>
                                        <CircularProgress size={24} />
                                      </TableCell>
                                    ) : null}
                                  </TableRow>
                                );
                              })
                            : null}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          <TableRow sx={componentStyle.tableHeaderRow}>
            <TableCell colSpan={7} sx={componentStyle.productLabel}>
              {intl.formatMessage({ id: 'total' })}
            </TableCell>
          </TableRow>
          {selectedPricingProducts.length > 0 &&
            selectedPricingProducts.map((item: any) => {
              return (
                <React.Fragment key={item.product_id}>
                  <TableRow sx={componentStyle.productRow}>
                    <TableCell sx={componentStyle.productLabel}>{item.product_name}</TableCell>
                    {item.total &&
                      item.total.map((totalData: any) => {
                        return (
                          <TableCell
                            sx={[
                              componentStyle.tierSubData,
                              componentStyle.textCenter,
                              totalData.error ? { ...componentStyle.alertMessage } : {},
                            ]}
                            key={totalData.key}>
                            {filterColumncell({ ...totalData, maxDiscount: item.discount })}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                </React.Fragment>
              );
            })}
          {selectedPricingProducts.length > 1 && (
            <TableRow sx={componentStyle.productRow}>
              <TableCell sx={componentStyle.productLabel}>
                {intl.formatMessage({ id: 'grandTotal' })}
              </TableCell>
              {grandTotal.length &&
                grandTotal.map((totalData: any) => {
                  return (
                    <TableCell sx={[componentStyle.tierSubData, componentStyle.textCenter]}>
                      {filterColumncell(totalData, false)}
                    </TableCell>
                  );
                })}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {dealTermsSchema && selectedPricingProducts.length > 0 ? (
        <Box>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper sx={{ ...componentStyle.purpleBox }}>
              <FormRenderer
                schema={dealTermsSchema}
                initialValues={{ ...dealTerms }}
                debug={({ values }) => {
                  setDealTermsRef.current = values;
                }}
                FormTemplate={FormTemplateComponent}
                componentMapper={componentMapper}
                onSubmit={() => {}}
              />
            </Paper>
          </LocalizationProvider>
          <Button
            startIcon={<SettingsIcon />}
            onClick={() => openConfigPopup()}
            sx={[commonStyle.customButton('#4168E1', null, '4px', null), componentStyle.configBtn]}>
            {intl.formatMessage({ id: 'contractSpecificConfig' })}
          </Button>
        </Box>
      ) : null}
      {(selectedQuoteDetails.status === QuoteStatus.FORWARD_TO_DD ||
        selectedQuoteDetails.status === QuoteStatus.ESCALATE_FOR_APPROVAL) &&
      (selectedQuoteDetails.assigned_to_id === userId ||
        _.keys(userOperations).includes('Deal Hub')) ? (
        <Box sx={[componentStyle.policyContainer, componentStyle.boxMargin]}>
          {/* {selectField('escalate_to', [{ name: 'Monthly', value: 'monthly' }], false)}
          <HelpIcon sx={componentStyle.helpIcon} />
          {selectField('over_ride_policy', [{ name: 'Monthly', value: 'monthly' }], false)}

          <HelpIcon sx={componentStyle.helpIcon} /> */}
          {QuoteStatus.FORWARD_TO_DD === selectedQuoteDetails.status ? (
            <Button
              onClick={() => {
                setSelectedOption('quoteEscalated');
                escalateToManager(QuoteStatus.ESCALATE_FOR_APPROVAL);
              }}
              sx={[
                commonStyle.customButton('#4168E1', null, '4px', null),
                componentStyle.btnRight,
              ]}>
              {escalateLoader ? (
                <CircularProgress sx={componentStyle.loaderStyle} size={24} />
              ) : (
                intl.formatMessage({ id: 'escalateForApproval' })
              )}
            </Button>
          ) : null}
          {QuoteStatus.ESCALATE_FOR_APPROVAL === selectedQuoteDetails.status ? (
            <Button
              onClick={() => {
                setSelectedOption('quoteApproved');
                escalateToManager(QuoteStatus.APPROVED);
              }}
              sx={[
                commonStyle.customButton('#4168E1', null, '4px', null),
                componentStyle.btnRight,
              ]}>
              {escalateLoader ? (
                <CircularProgress sx={componentStyle.loaderStyle} size={24} />
              ) : (
                intl.formatMessage({ id: 'approve' })
              )}
            </Button>
          ) : null}

          <Button
            onClick={resendToAE}
            sx={[commonStyle.customButton('#865DDA', null, '4px', null), componentStyle.btnRight]}>
            {resendToAeLoader ? (
              <CircularProgress sx={componentStyle.loaderStyle} size={24} />
            ) : (
              intl.formatMessage({ id: 'resend_to_ae' })
            )}
          </Button>
          {/* <Box sx={componentStyle.settingsContainer}> */}
          {/* <Box sx={componentStyle.iconStyle}>
              <SettingsIcon />
            </Box> */}
          {/* <Button sx={componentStyle.settingsConfigText} onClick={() => openConfigPopup()}>
              {intl.formatMessage({ id: 'field_config' })}
            </Button> */}
          {/* </Box> */}
        </Box>
      ) : null}
      {/* {
        selectedQuoteDetails.status === QuoteStatus.ESCALATE_FOR_APPROVAL
      } */}
      {selectedQuoteDetails.status === QuoteStatus.DRAFT &&
      selectedQuoteDetails.owner_id === userId ? (
        <Box sx={[componentStyle.policyContainer, componentStyle.boxMargin]}>
          <Button
            onClick={() => {
              setSelectedOption('quoteEscalated');
              escalateToManager(QuoteStatus.ESCALATE_FOR_APPROVAL);
            }}
            sx={[
              commonStyle.customButton('#4168E1', null, '4px', '12px 0px'),
              componentStyle.btnRight,
            ]}>
            <ArrowUpwardIcon />
          </Button>
          <Button
            onClick={() => {
              setSelectedOption('quoteEscalated');
              if (isApprovalRequired) {
                escalateToManager(QuoteStatus.ESCALATE_FOR_APPROVAL);
              } else {
                selfApproval(QuoteStatus.APPROVED);
              }
            }}
            disabled={disableEscalation}
            sx={[commonStyle.customButton('#4168E1', null, '4px', null), componentStyle.btnRight]}>
            {escalateLoader ? (
              <CircularProgress sx={componentStyle.loaderStyle} size={24} />
            ) : (
              getButtonLabel()
            )}
          </Button>
          <Button
            onClick={forwardToDealDesk}
            sx={[
              commonStyle.customButton('#865DDA', null, '4px', '12px 0px'),
              componentStyle.btnRight,
            ]}>
            <ArrowForwardIcon />
          </Button>
          <Button
            onClick={forwardToDealDesk}
            sx={[commonStyle.customButton('#865DDA', null, '4px', null), componentStyle.btnRight]}>
            {forwardToDealDeskLoader ? (
              <CircularProgress sx={componentStyle.loaderStyle} size={24} />
            ) : (
              intl.formatMessage({ id: 'forwardDealDesk' })
            )}
          </Button>
        </Box>
      ) : null}
      {selectedQuoteDetails.id && (
        <ConfigContract
          open={configPopup}
          onClose={() => setConfigPopup(false)}
          selectedQuote={selectedQuoteDetails}
          loader={contractSpecificLoader}
          selectedProductIds={selectedPricingProducts.map((product: any) => product.product_id)}
          updateContractSpecificData={updateContractSpecificData}
        />
      )}
      <NotesPopup
        loader={apiLoader}
        onSave={(value) => {
          if (value) {
            saveComments(value);
            return true;
          }
          setOpenNote(false);
          return null;
        }}
        open={openNote}
      />
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
export default injectIntl(RightPortion);
