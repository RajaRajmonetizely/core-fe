import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, FormControl, Grid, Paper } from '@mui/material';
import React, { ReactElement, useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import FeatureRepositoryClient from '../../api/FeatureRepository/FeatureRepositoryAPI';
import PackageClient from '../../api/Package/PackageAPIs';
import PlanClient from '../../api/Plan/PlanAPIs';
import PricingModelClient from '../../api/PricingModel/PricingModelAPIs';
import ProductClient from '../../api/Product/ProductAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import Breadcrumbs from '../../components/BreadCrumbs/BreadCrumbs';
import DialogBox from '../../components/DialogBox/DialogBox';
import SearchAddCard from '../../components/SearchAddCard/SearchAddCard';
import Snackbar from '../../components/Snackbar/Snackbar';
import { getPlanFields } from '../../constants/dialogBoxConstants';
import { ISnackBar } from '../../models/common';
import { IPackage } from '../../models/package';
import { IPricingModel } from '../../models/pricing-model';
import { setRepositoriesList } from '../../store/feature_repository/featureRepository.slice';
import { setCurrentPackage, setCurrentPackageList } from '../../store/package/package.slice';
import {
  setCurrentPlan,
  setCurrentSelectedProduct,
  setCurrentTierList,
  setPlans,
  updatePlans,
} from '../../store/plans/plans.slice';
import {
  clearData,
  setPricingModel,
  setSelectedPricingModel,
  updatePricingModel,
} from '../../store/pricing_model/pricingModel.slice';
import { setIsProductLoading, setProductList } from '../../store/products/products.slice';
import { setSection } from '../../store/user_sections/userSections.slice';
import { REGEX } from '../../utils/helperService';
import './Plans.scss';
import VersionEdit from './VersionEdit';

interface IProps {
  intl: any;
}

const Plans: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ability = useSelector((state: any) => state.auth.ability);
  const products = useSelector((state: any) => state.products.products);
  const plans = useSelector((state: any) => state.plans.plans);
  const repositories = useSelector((state: any) => state.featureRepository.repositories);
  const selectedPricingModel = useSelector((state: any) => state.pricingModel.selectedPricingModel);
  const pricingModels = useSelector((state: any) => state.pricingModel.pricingModels);
  const currentPlan = useSelector((state: any) => state.plans.currentPlan);
  const currentSelectedProduct = useSelector((state: any) => state.plans.currentSelectedProduct);
  const currentPackage = useSelector((state: any) => state.package.currentPackage);
  const currentPackageList = useSelector((state: any) => state.package.currentPackageList);
  const currentTierList = useSelector((state: any) => state.plans.currentTierList);
  const isProductLoading = useSelector((state: any) => state.products.isProductLoading);
  const [selectedRepo, setSelectedRepo] = useState<any>({});
  const [filteredRepos, setFilteredRepos] = useState<any>(repositories);
  const [filteredPlans, setFilteredPlans] = useState<any>([]);
  const [selectedTier, setSelectedTier] = useState<any>({});
  const [tierValue, setTierValue] = useState<any>(null);
  const [open, toggleOpen] = useState(false);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [modelVersionLoader, setModelVersionLoader] = useState(false);
  const [packageLoader, setPackageLoader] = useState(false);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  const getProducts = () => {
    dispatch(setIsProductLoading(true));
    ProductClient.getProducts()
      .then(({ data }) => {
        dispatch(setProductList([...data]));
        dispatch(setIsProductLoading(false));
        dispatch(
          setCurrentSelectedProduct(data.find((r: any) => r.id === currentPlan?.product_id)),
        );
        if (ability.can('GET', 'Feature Repository')) getRepositories();
      })
      .catch((e: any) => {
        console.error(e);
        dispatch(setIsProductLoading(false));
      });
  };

  const getRepositories = () => {
    setRepositoriesLoading(true);
    FeatureRepositoryClient.getFeatureRepository()
      .then((res: any) => {
        if (res.message === 'success') {
          dispatch(setRepositoriesList([...res.data]));
          setFilteredRepos(() =>
            res.data.filter((r: any) => r.product_id === currentSelectedProduct?.id),
          );
          setSelectedRepo(res.data.find((r: any) => r.id === currentPlan?.repository_id));
          if (ability.can('GET', 'Plan')) getPlans();
        }
        setRepositoriesLoading(false);
      })
      .catch(() => {
        setRepositoriesLoading(false);
      });
  };

  const getPlans = () => {
    setPlanLoading(true);
    PlanClient.getPlans()
      .then(({ data }) => {
        setPlanLoading(false);
        dispatch(setPlans(data));
        setFilteredPlans(() =>
          plans?.filter((p: any) => p.repository_id === currentPlan?.repository_id),
        );
      })
      .catch(() => {
        setPlanLoading(false);
      });
  };

  useEffect(() => {
    dispatch(setSection({ id: 3, name: 'plans', route: '/plans' }));
    if (ability.can('GET', 'Product')) getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setTierValue({
      name: '',
      id: '',
    });
    toggleOpen(false);
  };

  const handleTierEdit = () => {
    // API call for updating tier name
    PlanClient.editTier(currentPlan.id, {
      name: tierValue.name,
      tier_id: tierValue.id,
    })
      .then(() => {
        const tierList = currentTierList.map((p: any) =>
          p.id === tierValue.id ? { ...p, name: tierValue.name } : p,
        );
        dispatch(
          setCurrentPlan({
            ...currentPlan,
            ...{ tiers: tierList },
          }),
        );
        dispatch(setCurrentTierList(tierList));
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'updatePlanSuccess' }),
        });
      })
      .catch((er) => {
        console.error(er);
      });

    handleClose();
  };

  const onEditTier = (tier: any) => {
    setTierValue(tier);
    toggleOpen(true);
  };

  const onDeleteTier = (tier: any) => {
    // API call to delete tier
    PlanClient.deleteTier(currentPlan.id, {
      tier_id: tier.id,
    })
      .then(() => {
        dispatch(setCurrentTierList(currentTierList.filter((t: any) => t.id !== tier.id)));
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'deleteTierSuccess' }),
        });
      })
      .catch((er) => {
        console.error(er);
      });
  };

  const tierEditConfig: any = [
    {
      icon: ability.can('PATCH', 'Plan') ? <EditIcon /> : null,
      onClickHandler: onEditTier,
    },
    {
      icon: ability.can('DELETE', 'Plan') ? <DeleteIcon /> : null,
      onClickHandler: onDeleteTier,
    },
  ];

  const notAllowedMessage = () => {
    setSnackBarValues({
      display: true,
      type: 'error',
      message: intl.formatMessage({ id: 'notAllowedMessage' }),
    });
  };

  const onSelectPlan = (plan: any, plansList: any[]) => {
    if (plan?.name && plansList?.findIndex((p: any) => p.name === plan.name) !== -1) {
      setIsLoadingTiers(true);
      PlanClient.getPlansByRepositoryId(plan?.repository_id)
        .then(({ data }) => {
          const planDetails = data.filter((p: any) => p.id === plan?.id)[0];
          getPackageForPlan(planDetails.id);
          dispatch(updatePlans(planDetails));
          dispatch(setCurrentPlan(planDetails));
          dispatch(setCurrentTierList(planDetails.tiers));
          setIsLoadingTiers(false);
        })
        .catch((er) => {
          console.error(er);
          setIsLoadingTiers(false);
        });
    } else if (plan?.name && selectedRepo?.id) {
      if (ability.can('POST', 'Plan'))
        PlanClient.addPlan({
          name: plan.name,
          feature_repository_id: selectedRepo.id,
        })
          .then(({ data }) => {
            const planData = {
              ...data,
              tiers: [],
            };
            dispatch(updatePlans(planData));
            dispatch(setCurrentPlan(planData));
            setFilteredPlans((prev: any) => [...prev, planData]);
            dispatch(setCurrentTierList([]));
            dispatch(setCurrentPackageList([]));
            dispatch(setCurrentPackage({}));
            dispatch(setSelectedPricingModel({}));
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addPlanSuccess' }),
            });
          })
          .catch((er) => {
            console.error(er);
          });
      else {
        notAllowedMessage();
      }
    }
  };

  const getPackageForPlan = (id: string) => {
    if (ability.can('GET', 'Package')) {
      setPackageLoader(true);
      PackageClient.getPackagePerPlan(id)
        .then(({ data }) => {
          if (data.length === 1) {
            dispatch(setCurrentPackage(data[0]));
            getPricingModel(data[0].id);
          } else {
            dispatch(setCurrentPackage({}));
          }
          setPackageLoader(false);
          dispatch(setCurrentPackageList(data));
        })
        .catch(() => {
          setPackageLoader(false);
        });
    }
  };

  useEffect(() => {
    if (
      selectedTier?.name &&
      (!currentSelectedProduct?.id || !selectedRepo.id || !currentPlan.id)
    ) {
      setSnackBarValues({
        display: true,
        type: 'info',
        message: intl.formatMessage({ id: 'planPageInfo' }),
      });
      setSelectedTier({});
    } else if (selectedTier && selectedTier.name) {
      if (
        currentTierList?.findIndex((t: any) => t.name === selectedTier.name) === -1 &&
        ability.can('POST', 'Plan')
      ) {
        setIsLoadingTiers(true);
        // API call for saving added tier according to the plan id
        PlanClient.addTiersForPlan({
          plan_id: currentPlan.id,
          tier_names: [selectedTier.name],
        })
          .then(({ data }) => {
            const addedTier = data.map((t: any) => {
              return { id: t.id, name: t.name };
            });
            dispatch(
              setCurrentPlan({
                ...currentPlan,
                ...{ tiers: [...currentPlan.tiers, ...addedTier] },
              }),
            );
            dispatch(setCurrentTierList([...currentTierList, ...addedTier]));
            setIsLoadingTiers(false);
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addTierSuccess' }),
            });
          })
          .catch((er) => {
            console.error(er);
            setIsLoadingTiers(false);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTier]);

  const onSelectPackage = (value: IPackage) => {
    if (value?.name && (!currentSelectedProduct?.id || !selectedRepo.id || !currentPlan.id)) {
      setSnackBarValues({
        display: true,
        type: 'info',
        message: intl.formatMessage({ id: 'planPageInfo' }),
      });
      dispatch(setCurrentPackage({}));
    } else if (
      value?.name &&
      currentPackageList?.findIndex((p: any) => p.name === value.name) === -1
    ) {
      dispatch(setSelectedPricingModel({}));
      if (currentPlan.id) {
        addPackage(value);
      }
    } else if (value?.id) {
      dispatch(setPricingModel([]));
      dispatch(setSelectedPricingModel({}));
      dispatch(setCurrentPackage(value));
      getPricingModel(value?.id);
    }
  };

  const onSelectPricingModel = (value: IPricingModel) => {
    if (!currentPackage || (currentPackage && !currentPackage.name)) {
      setSnackBarValues({
        display: true,
        type: 'info',
        message: intl.formatMessage({ id: 'pleaseSelectPackage' }),
      });
    } else {
      const findIndex = pricingModels?.findIndex((item: IPricingModel) => item?.id === value?.id);

      if (findIndex > -1) {
        dispatch(setSelectedPricingModel(pricingModels[findIndex]));
      }
      if (findIndex === -1) {
        createPricingModel(value);
      }
    }
  };

  const createPricingModel = async (value: IPricingModel) => {
    if (ability.can('POST', 'Pricing Model')) {
      try {
        setModelVersionLoader(true);
        const response = await PricingModelClient.createPricingModel({
          name: value.name,
          package_id: currentPackage.id,
        });
        if (response.message === 'success') {
          dispatch(setSelectedPricingModel(response.data));
          dispatch(updatePricingModel(response.data));
          getPricingModel(currentPackage.id, response.data);
          setSnackBarValues({
            display: true,
            type: 'success',
            message: intl.formatMessage({ id: 'addPricingModelSuccess' }),
          });
        }
        setModelVersionLoader(false);
      } catch (e) {
        setModelVersionLoader(false);
      }
    } else {
      notAllowedMessage();
    }
  };

  const addPackage = (value: any) => {
    if (ability.can('GET', 'Package')) {
      setPackageLoader(true);
      PackageClient.addPackage({
        name: value.name,
        plan_id: currentPlan.id,
      })
        .then(({ data }) => {
          if (data.id) {
            setPackageLoader(false);
            dispatch(setCurrentPackage({ name: value.name, id: data.id }));
            dispatch(
              setCurrentPackageList([...currentPackageList, { name: value.name, id: data.id }]),
            );
            getPricingModel(data.id);
            setSnackBarValues({
              display: true,
              type: 'success',
              message: intl.formatMessage({ id: 'addPackageSuccess' }),
            });
          }
        })
        .catch((er) => {
          setPackageLoader(false);
          console.error(er);
        });
    } else {
      notAllowedMessage();
    }
  };

  const getPricingModel = async (packageId: string, data?: IPricingModel) => {
    if (ability.can('GET', 'Pricing Model')) {
      try {
        setModelVersionLoader(true);
        const response = await PricingModelClient.getPricingModel(packageId);
        if (response.message === 'success') {
          if (data) {
            const findIndex = response.data.findIndex((item) => item.id === data.id);
            if (findIndex > -1) {
              dispatch(setSelectedPricingModel(response.data[findIndex]));
            }
          } else if (response.data.length === 1) {
            dispatch(setSelectedPricingModel(response.data[0]));
          }
          dispatch(setPricingModel(response.data));
        }
        setModelVersionLoader(false);
      } catch (e) {
        setModelVersionLoader(false);
      }
    }
  };

  const onDragEnd = () => {};
  const setRepositoryCaption = (defaultCaption: string, updatedCaption: string) => {
    if (currentSelectedProduct) {
      if (filteredRepos.length) {
        return defaultCaption;
      }
      return updatedCaption;
    }
    return defaultCaption;
  };

  const setPlanCaption = (defaultCaption: string, updatedCaption: string) => {
    if (currentSelectedProduct) {
      if (filteredRepos.length) {
        if (filteredPlans.length) {
          return defaultCaption;
        }
        return updatedCaption;
      }
      return updatedCaption;
    }
    return defaultCaption;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Breadcrumbs />
      <Box
        sx={{
          marginRight: '20px',
          marginLeft: '10px',
          height: '86vh',
          borderRadius: '6px',
        }}>
        <Grid container>
          <Grid item md={12}>
            <Paper>
              <FormControl sx={{ m: 1, width: 240 }}>
                <SearchAddAutocomplete
                  selectedItem={currentSelectedProduct}
                  caption="selectProduct"
                  data={isProductLoading || repositoriesLoading || planLoading ? [] : products}
                  showSelectionValue
                  showAddOption={false}
                  loading={isProductLoading || repositoriesLoading || planLoading}
                  setSelectedData={(value: any) => {
                    if (value) {
                      dispatch(setCurrentSelectedProduct(value));
                      const filterRep = repositories.filter((r: any) => r.product_id === value.id);
                      setFilteredRepos(() => filterRep);
                      if (filterRep.length === 1) {
                        setSelectedRepo({ ...filterRep[0] });
                        const filterPlan = plans.filter(
                          (p: any) => p.repository_id === filterRep[0].id,
                        );
                        setFilteredPlans(() => filterPlan);
                        if (filterPlan.length === 1) {
                          dispatch(setCurrentPlan(filterPlan[0]));
                          onSelectPlan(filterPlan[0], filterPlan);
                        } else dispatch(setCurrentPlan({}));
                      } else setSelectedRepo({});
                    } else {
                      dispatch(setCurrentSelectedProduct(value));
                      setSelectedRepo({});
                      dispatch(setCurrentPlan({}));
                    }
                    dispatch(setSelectedPricingModel({}));
                    dispatch(setPricingModel([]));
                    dispatch(setCurrentPackage({}));
                    dispatch(setCurrentPackageList([]));
                    dispatch(setCurrentTierList([]));
                  }}
                />
              </FormControl>
              <FormControl sx={{ m: 1, width: 240 }}>
                <SearchAddAutocomplete
                  selectedItem={selectedRepo}
                  caption={setRepositoryCaption('selectRepository', 'noRepositoryCreated')}
                  data={filteredRepos}
                  showSelectionValue
                  loading={repositoriesLoading}
                  showAddOption={false}
                  setSelectedData={(value: any) => {
                    if (value) {
                      setSelectedRepo(value);
                      const filterPlan = plans.filter((p: any) => p.repository_id === value.id);
                      setFilteredPlans(() => filterPlan);
                      if (filterPlan.length === 1) {
                        dispatch(setCurrentPlan(filterPlan[0]));
                        onSelectPlan(filterPlan[0], filterPlan);
                      } else dispatch(setCurrentPlan({}));
                    } else {
                      setSelectedRepo(value);
                      dispatch(setCurrentPlan({}));
                    }
                    dispatch(setCurrentPackage({}));
                    dispatch(setCurrentPackageList([]));
                    dispatch(setCurrentTierList([]));
                    dispatch(setSelectedPricingModel({}));
                    dispatch(setPricingModel([]));
                  }}
                />
              </FormControl>
              <FormControl sx={{ m: 1, width: 240 }}>
                <SearchAddAutocomplete
                  readOnly={!selectedRepo?.id || !currentSelectedProduct?.id}
                  caption={setPlanCaption('searchOrAddPlan', 'noPlanCreated')}
                  data={filteredPlans}
                  selectedItem={currentPlan}
                  setSelectedData={(value: any) => {
                    if (value) {
                      dispatch(setCurrentPlan(value));
                      onSelectPlan(value, filteredPlans);
                    } else {
                      dispatch(setCurrentPlan(value));
                    }
                    dispatch(setCurrentPackage({}));
                    dispatch(setCurrentPackageList([]));
                    dispatch(setCurrentTierList([]));
                    dispatch(setSelectedPricingModel({}));
                    dispatch(setPricingModel([]));
                  }}
                  showSelectionValue
                />
              </FormControl>
            </Paper>
          </Grid>
          <Grid
            container
            spacing={3}
            sx={{
              marginTop: '30px',
            }}>
            <Grid item>
              <SearchAddCard
                caption="searchOrAddTiers"
                cardHeader="tiers"
                data={currentTierList}
                setAddOption={setSelectedTier}
                actionConfig={tierEditConfig}
                showProgress={isLoadingTiers}
              />
            </Grid>
            <Grid item md={6} xs={4} sm={4} sx={{ paddingTop: '100px !important' }}>
              <VersionEdit
                data={currentPackageList}
                loader={packageLoader}
                selectedValue={currentPackage}
                setSelectedValue={(value: IPackage) => {
                  onSelectPackage(value);
                }}
                buttonLabel="editPackageVersion"
                inputLabel="packageVersion"
                onButtonClick={() => {
                  navigate(`/plans/package-designer/${currentPackage.id}`, {
                    state: {
                      packageName: currentPackage.name,
                    },
                  });
                  dispatch(
                    setSection({
                      id: 3,
                      name: 'packageDesigner',
                      route: '/plans/package-designer',
                    }),
                  );
                }}
              />
              <br />
              <VersionEdit
                data={pricingModels}
                selectedValue={selectedPricingModel}
                loader={modelVersionLoader}
                setSelectedValue={(value: IPricingModel) => {
                  if (!packageLoader) {
                    onSelectPricingModel(value);
                  }
                }}
                disabled={modelVersionLoader || packageLoader}
                buttonLabel="editPricingModel"
                inputLabel="pricingModel"
                onButtonClick={() => {
                  dispatch(clearData());
                  navigate(`/plans/pricing-model/${selectedPricingModel.id}`, {
                    state: { modelName: selectedPricingModel.name },
                  });
                  dispatch(
                    setSection({ id: 3, name: 'pricingModel', route: '/plans/pricing-model' }),
                  );
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {open && (
        <DialogBox
          dialogConfig={{
            name: 'editTier',
            fields: getPlanFields(tierValue, setTierValue),
            open,
            handleClose,
            handleSave: handleTierEdit,
            initialValues: {
              name: tierValue.name ?? '',
            },
            schema: Yup.object({
              name: Yup.string()
                .trim()
                .required('Please enter tier name')
                .matches(
                  REGEX,
                  'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
                ),
            }),
          }}
        />
      )}
      {snackbarValues.message ? (
        <Snackbar
          display={snackbarValues.display}
          type={snackbarValues.type}
          message={snackbarValues.message}
          onClose={() => setSnackBarValues({ display: false } as ISnackBar)}
        />
      ) : null}
    </DragDropContext>
  );
};

export default injectIntl(Plans);
