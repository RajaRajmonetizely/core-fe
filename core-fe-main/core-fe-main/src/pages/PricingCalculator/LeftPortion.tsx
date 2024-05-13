import { Box, CircularProgress } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PricingCalculatorClient from '../../api/PricingCalculator/PricingCalculatorAPI';
import CheckBoxSelection from '../../components/CheckBoxSelection/CheckBoxSelection';
import { columnsKeys } from '../../mocks/pricingCalculator';
import {
  setPriceBookDetails,
  setSelectedPricingProducts,
} from '../../store/pricing_calculator/pricingCalculator.slice';

const tierRGBA = ['rgba(88, 181, 219, 0.3)', 'rgba(239, 93, 168, 0.3)'];

const componentStyle = {
  checkboxContainer: {
    padding: '28px 26px',
    paddingBottom: '15px',
  },
  loaderStyle: {
    textAlign: 'center',
    padding: '28px 26px',
  },
  blueBg: (bgColor: string) => {
    return { background: bgColor ?? 'rgba(239, 93, 168, 0.3)' };
  },
};

interface IProps {
  priceBookLoader: boolean;
}

const LeftPortion: React.FC<IProps> = ({ priceBookLoader }): ReactElement => {
  const dispatch = useDispatch();
  const priceBookDetails = useSelector((state: any) => state.pricingCalculator.priceBookDetails);
  const [loader, setLoader] = useState(false);
  const selectedPricingProducts = useSelector(
    (state: any) => state.pricingCalculator.selectedPricingProducts,
  );

  useEffect(() => {
    if (priceBookDetails?.id) {
      const filterData = JSON.parse(
        JSON.stringify(priceBookDetails.products.filter((item: any) => item.checked)),
      );
      filterData.map((item: any, i: number) => {
        const [color1, color2] = tierRGBA;
        // eslint-disable-next-line
        if (i % 2 == 0) {
          filterData[i].bgColor = color1;
        } else {
          filterData[i].bgColor = color2;
        }
        return null;
      });
      dispatch(setSelectedPricingProducts(filterData));
    }
    // eslint-disable-next-line
  }, [priceBookDetails]);

  const onSelectProducts = (i: number) => {
    const tempDetails = JSON.parse(JSON.stringify(priceBookDetails));
    tempDetails.products[i].checked = !tempDetails.products[i].checked;
    dispatch(setPriceBookDetails(tempDetails));
  };

  const onSelectTiers = (item: any, tierData: any, tierIndex: number) => {
    const tempDetails = JSON.parse(JSON.stringify(priceBookDetails));
    const findIndex = tempDetails.products.findIndex((product: any) => product.id === item.id);
    if (findIndex > -1) {
      tempDetails.products[findIndex].tier_details.map((tier: any, j: number) => {
        if (tier.tier_id === tierData.tier_id) {
          tempDetails.products[findIndex].tierData = tier;
        }
        tempDetails.products[findIndex].tier_details[j].checked = tier.tier_id === tierData.tier_id;
        return true;
      });
      tempDetails.products[findIndex].tiers = tempDetails.products[findIndex].tier_details.filter(
        (tier: any) => tier.checked,
      );
      if (tempDetails.products[findIndex].tiers.length > 0) {
        if (!tempDetails.products[findIndex]?.tier_details[tierIndex].details) {
          getTablesDetails(JSON.parse(JSON.stringify(tempDetails)), tierIndex, findIndex);
        }
      }
    }
    dispatch(setPriceBookDetails(tempDetails));
  };

  const onSelectAddons = (item: any, tierData: any, addonIndex: number) => {
    const tempDetails = JSON.parse(JSON.stringify(priceBookDetails));
    const findIndex = tempDetails.products.findIndex((product: any) => product.id === item.id);
    if (findIndex > -1) {
      const tierIndex = tempDetails.products[findIndex].tier_details.findIndex(
        (tier: any) => tier.tier_id === tierData.tier_id,
      );
      if (tierIndex > -1) {
        if (tempDetails.products[findIndex].tier_details[tierIndex].addons) {
          tempDetails.products[findIndex].tier_details[tierIndex].addons[addonIndex].checked =
            !tempDetails.products[findIndex].tier_details[tierIndex].addons[addonIndex].checked;
        }
      }
      if (
        tempDetails.products[findIndex].tierData &&
        tempDetails.products[findIndex].tier_details[tierIndex].details
      ) {
        tempDetails.products[findIndex].tierData.addons =
          tempDetails.products[findIndex].tier_details[tierIndex].addons;
        const filterAddons = tempDetails.products[findIndex].tier_details[tierIndex].addons.filter(
          (addon: any) => addon.checked,
        );
        const addons: any = [];
        filterAddons.map((a: any) => {
          if (a.config) {
            addons.push({ customAddonMetric: true, ...a, values: [] });
            a.config.map((aCustom: any) => {
              const addOnIndex = tempDetails.products[findIndex].tier_details[
                tierIndex
              ].details.addons.rows.findIndex((adb: any) => {
                if (aCustom.metric_column && adb.metric_column) {
                  return aCustom.metric_column.key === adb.metric_column.key;
                }
                return false;
              });
              if (
                addOnIndex > -1 &&
                tempDetails.products[findIndex].tier_details[tierIndex].details.addons.rows[
                  addOnIndex
                ].addon_id === a.id
              ) {
                addons.push(
                  tempDetails.products[findIndex].tier_details[tierIndex].details.addons.rows[
                    addOnIndex
                  ],
                );
              } else {
                addons.push({
                  ...aCustom,
                  addonRow: true,
                  addon_id: a.addon_id ?? a.id,
                  values: a.values ?? [...columnsKeys],
                });
              }
              return null;
            });
          } else {
            const addOnIndex = tempDetails.products[findIndex].tier_details[
              tierIndex
            ].details.addons.rows.findIndex((adb: any) => {
              const addonA = a.addon_id ?? a.id;
              const addonB = adb.addon_id ?? adb.id;
              return addonA === addonB;
            });
            if (addOnIndex > -1) {
              addons.push(
                tempDetails.products[findIndex].tier_details[tierIndex].details.addons.rows[
                  addOnIndex
                ],
              );
            } else {
              addons.push(a);
            }
          }
          return null;
        });
        addons.map((a: any, i: number) => {
          addons[i].addon_id = a.addon_id ?? a.id;
          addons[i].values = a.values ? [...a.values] : [...columnsKeys];
          return null;
        });
        tempDetails.products[findIndex].tier_details[tierIndex].details.addons.rows = addons;
      }
      tempDetails.products[findIndex].tiers = tempDetails.products[findIndex].tier_details.filter(
        (tier: any) => tier.checked,
      );
    }
    dispatch(setPriceBookDetails(tempDetails));
  };

  const getTablesDetails = async (productData: any, tierIndex: number, index: number) => {
    try {
      setLoader(true);
      const product = productData.products[index];
      const response = await PricingCalculatorClient.getModelDetails(
        product.pricing_model_id,
        product.tiers[0].tier_id,
      );
      if (response.message === 'success') {
        if (!productData.products[index].tier_details[tierIndex].details) {
          productData.products[index].tier_details[tierIndex].details = {
            core: { rows: [] },
            addons: { rows: [] },
          };
        }
        const rowsData: any = [];
        response?.data?.core.map((item: any) => {
          rowsData.push({ ...item, values: [...columnsKeys] });
          return null;
        });

        productData.products[index].tier_details[tierIndex].details.core.rows = rowsData;

        if (response?.data?.addon.length) {
          response?.data?.addon.map((ad: any) => {
            const adIndex = productData.products[index].tier_details[tierIndex].addons.findIndex(
              (i: any) => Object.keys(ad)[0] === i.id,
            );
            if (adIndex > -1) {
              // eslint-disable-next-line prefer-destructuring
              productData.products[index].tier_details[tierIndex].addons[adIndex].fields =
                Object.values(ad)[0];
            }
            return null;
          });
        }

        productData.products[index].tiers = productData.products[index].tier_details.filter(
          (tier: any) => tier.checked,
        );
      }
      dispatch(setPriceBookDetails(productData));
      setLoader(false);
    } catch (e) {
      setLoader(false);
      console.error(e);
    }
  };

  return (
    <Box>
      {!priceBookLoader ? (
        <Box sx={[componentStyle.checkboxContainer]}>
          <CheckBoxSelection
            fieldKey="product_name"
            idField="id"
            customTitle={false}
            onChange={onSelectProducts}
            lists={priceBookDetails.products ?? []}
            title="selectProducts"
          />
        </Box>
      ) : null}

      {selectedPricingProducts.map((item: any) => {
        return (
          <Box key={item.id}>
            <Box sx={[componentStyle.checkboxContainer, componentStyle.blueBg(item.bgColor)]}>
              <CheckBoxSelection
                fieldKey="tier_name"
                idField="tier_id"
                customTitle
                onChange={(j: number, tierData: any) => {
                  onSelectTiers(item, tierData, j);
                }}
                lists={item.tier_details ?? []}
                title={item.product_name}
              />
            </Box>
            {item.tierData && !loader && item.tierData.addons?.length > 0 ? (
              <Box sx={componentStyle.checkboxContainer}>
                <CheckBoxSelection
                  customTitle={false}
                  idField="id"
                  key={item.id}
                  fieldKey="name"
                  onChange={(j: number) => {
                    onSelectAddons(item, item.tierData, j);
                  }}
                  lists={item.tierData.addons}
                  title="addOnPlans"
                />
              </Box>
            ) : null}
          </Box>
        );
      })}
      {loader || priceBookLoader ? (
        <Box sx={componentStyle.loaderStyle}>
          <CircularProgress size={24} />
        </Box>
      ) : null}
    </Box>
  );
};
export default LeftPortion;
