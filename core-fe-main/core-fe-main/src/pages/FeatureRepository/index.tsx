import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, FormControl, Grid, Paper } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import FeatureRepositoryClient from '../../api/FeatureRepository/FeatureRepositoryAPI';
import ProductClient from '../../api/Product/ProductAPIs';
import SearchAddAutocomplete from '../../components/Autocomplete/SearchAddAutocomplete';
import SaveInput from '../../components/SaveInput/SaveInput';
import SearchAddCard from '../../components/SearchAddCard/SearchAddCard';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import {
  ICreateRepository,
  IEditRepository,
  IFeature,
  IFeatureGroup,
  IRepository,
} from '../../models/repository';
import { showEditFeaturePopup } from '../../store/feature_repository/editFeature.slice';
import { showEditFeatureGroupPopup } from '../../store/feature_repository/editFeatureGroup.slice';
import {
  Feature,
  setRepositoriesList,
} from '../../store/feature_repository/featureRepository.slice';
import { setIsProductLoading, setProductList } from '../../store/products/products.slice';
import { REGEX } from '../../utils/helperService';
import EditFeature from './EditFeature';
import EditFeatureGroup from './EditFeatureGroup';

const FeatureRepository: React.FC<any> = ({ intl }) => {
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const [selectedProduct, setSelectedProduct] = useState<any>({});
  const [repositories, setRepositories] = useState<Array<IRepository>>([]);
  const [versionName, setVersionName] = useState('');
  const [loader, setLoader] = useState(false);
  const [featureLoader, setFeatureLoader] = useState(false);
  const [featureGroupLoader, setFeatureGroupLoader] = useState(false);
  const [repositoryLoader, setRepositoryLoader] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<IRepository>({} as IRepository);
  const [repositoryDetails, setRepositoryDetails] = useState<IRepository>({
    features: [] as Array<IFeature>,
    feature_groups: [] as Array<IFeatureGroup>,
  } as IRepository);
  const productList = useSelector((state: any) => state.products.products);
  const isProductLoading = useSelector((state: any) => state.products.isProductLoading);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);

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

  const getRepositories = () => {
    FeatureRepositoryClient.getFeatureRepository()
      .then((res: any) => {
        if (res.message === 'success') {
          dispatch(setRepositoriesList([...res.data]));
        }
      })
      .catch((e: any) => {
        console.error(e);
      });
  };

  useEffect(() => {
    if (ability.can('GET', 'Product')) getProducts();
    if (ability.can('GET', 'Feature Repository')) getRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEditFeatureClick = (feature: Feature, index: number) => {
    if (index !== undefined) {
      dispatch(showEditFeaturePopup({ isOpen: true, feature }));
    }
  };
  const onEditFeatureGroupClick = (featureGroup: Feature, index: number) => {
    if (index !== undefined) {
      dispatch(showEditFeatureGroupPopup({ isOpen: true, featureGroup }));
    }
  };

  const fetchProductRepository = async (productId: string) => {
    try {
      setRepositoriesLoading(true);
      setRepositories([]);
      const repository = await FeatureRepositoryClient.getFeatureRepository(productId);
      if (repository.data) {
        setRepositories([...repository.data]);
        if (repository.data.length === 1) {
          setSelectedRepository(repository.data[0]);
          getRepositoryById(repository.data[0].id, true);
          setSelectedRepository(repository.data[0]);
        }
      }
      setRepositoriesLoading(false);
    } catch (e) {
      setRepositoriesLoading(false);
      console.error(e);
    }
  };

  const onSelectProduct = async (value: any) => {
    if (value) {
      const productId = value.id;
      fetchProductRepository(productId);
    }
    clearData();
    setSelectedProduct(value);
  };

  const hideLoaders = () => {
    setLoader(false);
    setFeatureGroupLoader(false);
    setFeatureLoader(false);
  };

  const getRepositoryById = async (id: string, mainLoader: boolean) => {
    try {
      if (mainLoader) {
        setLoader(true);
      }
      const response = await FeatureRepositoryClient.getRepositoryById(id);
      if (response.message === 'success') {
        response.data.feature_groups.sort((a: any, b: any) => a.sort_order - b.sort_order);
        response.data.feature_groups.forEach((featureGroup: any) => {
          return featureGroup.features.sort((a: any, b: any) => a.sort_order - b.sort_order);
        });
        setRepositoryDetails(response.data);
      }
      hideLoaders();
    } catch (e) {
      hideLoaders();
    }
  };

  const addRepository = async (data: ICreateRepository, sourceId?: string) => {
    if (ability.can('POST', 'Feature Repository'))
      try {
        if (sourceId) {
          setRepositoryLoader(true);
        }
        const repository = await FeatureRepositoryClient.addFeatureRepository(data, sourceId);
        if (repository.message === 'success' && repository.data) {
          setRepositories([...repositories, ...[repository.data]]);
          setSelectedRepository(repository.data);
          getRepositoryById(repository.data.id, true);
          setSnackBarValues({
            display: true,
            type: 'success',
            message: intl.formatMessage({ id: 'addRepositorySuccess' }),
          });
          setVersionName('');
        }
        setRepositoryLoader(false);
      } catch (e) {
        setRepositoryLoader(false);
      }
    else {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'notAllowedMessage' }),
      });
      setRepositoryLoader(false);
    }
  };

  const editRepository = async (
    data: IEditRepository,
    mainLoader: boolean,
    fetchDetails: boolean = true,
    editedFeatureGroupIndex: null | number = null,
  ) => {
    try {
      if (mainLoader) {
        setLoader(true);
      }
      await FeatureRepositoryClient.editFeatureRepository(selectedRepository.id, data);
      setSnackBarValues({
        display: true,
        type: 'success',
        message:
          editedFeatureGroupIndex != null
            ? `"${data.feature_groups[editedFeatureGroupIndex].name}"  ${intl.formatMessage({
                id: 'addEditSuccess',
              })}`
            : intl.formatMessage({ id: 'addEditSuccess' }),
      });
      if (fetchDetails) {
        getRepositoryById(selectedRepository.id, mainLoader);
      }
    } catch (e) {
      hideLoaders();
    }
  };

  const addNewFeature = (feature: IFeature) => {
    if (ability.can('PUT', 'Feature')) {
      if (
        feature &&
        feature.name &&
        repositoryDetails.features.findIndex((item) => item.id === feature.id) === -1
      ) {
        setFeatureLoader(true);
        editRepository(
          {
            features: [{ name: feature.name } as IFeature],
            feature_groups: [],
          } as IEditRepository,
          false,
        );
      }
    } else {
      notAllowedMessage();
    }
  };

  const addNewFeatureGroup = (featureGroup: IFeatureGroup) => {
    if (ability.can('PUT', 'Feature Group')) {
      if (
        featureGroup &&
        featureGroup.name &&
        repositoryDetails.feature_groups.findIndex((item) => item.id === featureGroup.id) === -1
      ) {
        setFeatureGroupLoader(true);
        editRepository(
          {
            features: [],
            feature_groups: [
              {
                name: featureGroup.name,
                is_independent: false,
                features: [] as IFeature[],
              } as IFeatureGroup,
            ],
          } as IEditRepository,
          false,
        );
      }
    } else {
      notAllowedMessage();
    }
  };

  const notAllowedMessage = () => {
    setSnackBarValues({
      display: true,
      type: 'error',
      message: intl.formatMessage({ id: 'notAllowedMessage' }),
    });
  };

  const onSelectRepositories = (event: any) => {
    if (event) {
      if (event.name && repositories.findIndex((item) => item.id === event.id) === -1) {
        addRepository({ product_id: selectedProduct.id, name: event.name } as ICreateRepository);
      }
      if (event.product_id) {
        getRepositoryById(event.id, true);
        setSelectedRepository(event);
      }
    } else {
      clearData();
      setSelectedRepository(event);
    }
  };

  const deleteFeature = async (data: IFeature, index: number) => {
    if (index !== undefined) {
      try {
        setFeatureLoader(true);
        await FeatureRepositoryClient.deleteFeature(data.id);
        const tempObject = { ...repositoryDetails };
        const findIndex = repositoryDetails.features.findIndex((item) => item.id === data.id);
        if (findIndex > -1) {
          tempObject.features.splice(findIndex, 1);
        }
        setFeatureLoader(false);
        setRepositoryDetails(tempObject);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'deleteFeatureSuccess' }),
        });
      } catch (e) {
        setFeatureLoader(false);
      }
    }
  };

  const deleteFeatureGroup = async (data: IFeatureGroup, index: number) => {
    if (index !== undefined) {
      try {
        setFeatureGroupLoader(true);
        await FeatureRepositoryClient.deleteFeatureGroup(data.id);
        const tempObject = { ...repositoryDetails };
        const findIndex = repositoryDetails.feature_groups.findIndex((item) => item.id === data.id);
        if (findIndex > -1) {
          data.features.forEach((f: any) => tempObject.features.push(f));
          tempObject.feature_groups.splice(findIndex, 1);
        }
        setFeatureGroupLoader(false);
        setRepositoryDetails(tempObject);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'deleteFeatureGroupSuccess' }),
        });
      } catch (e) {
        setFeatureGroupLoader(false);
      }
    }
  };

  const deleteFeatureFromFeatureGroup = (feature: IFeatureGroup, i: number) => {
    if (i !== undefined) {
      const tempObject = { ...repositoryDetails };
      const findGroupIndex = tempObject.feature_groups.findIndex((item) => item.id === feature.id);
      if (findGroupIndex > -1) {
        tempObject.features.push(feature.features[i]);
        tempObject.feature_groups[findGroupIndex].features.splice(i, 1);
      }
      editRepository(tempObject, true, true);
    }
  };

  const featureEditConfig: any = [
    {
      icon: ability.can('PATCH', 'Feature') ? <EditIcon /> : null,
      onClickHandler: onEditFeatureClick,
    },
    {
      icon: ability.can('DELETE', 'Feature') ? <DeleteIcon /> : null,
      onClickHandler: deleteFeature,
    },
  ];

  const featureGroupEditConfig: any = [
    {
      icon: ability.can('PATCH', 'Feature Group') ? <EditIcon /> : null,
      onClickHandler: onEditFeatureGroupClick,
    },
    {
      icon: ability.can('DELETE', 'Feature Group') ? <DeleteIcon /> : null,
      onClickHandler: deleteFeatureGroup,
    },
  ];

  const featureGroupFeatureConfig: any = [
    {
      icon: ability.can('DELETE', 'Feature') ? <DeleteIcon /> : null,
      onClickHandler: deleteFeatureFromFeatureGroup,
    },
  ];

  const onDragEnd = (result: any) => {
    if (!result.destination && result.source.droppableId === 'Features') return;
    if (result.destination && result.source.droppableId === result.destination.droppableId) {
      moveFeatureWithinFeatureGroup(result);
      return;
    }
    if (!result.destination) {
      const tempFeatureGroups = [...repositoryDetails.feature_groups];
      // eslint-disable-next-line consistent-return, array-callback-return
      const tempFG = tempFeatureGroups.find((featureGroup) => {
        if (featureGroup.features.length) {
          return featureGroup.features.some((feature) => feature.id === result.draggableId);
        }
      });
      if (tempFG) {
        deleteFeatureFromFeatureGroup(tempFG, result.source.index);
      }
      return;
    }
    if (result.destination && result.source.droppableId !== 'Features') {
      moveFeatureAcrossFeatureGroup(result);
      return;
    }
    const featureGroupIndex = repositoryDetails.feature_groups.findIndex(
      (item: any) => item.id === result.destination.droppableId,
    );

    if (featureGroupIndex > -1) {
      const tempObject = { ...repositoryDetails };
      const tempFeatureGroups = repositoryDetails.feature_groups;
      const tempFeatures = [...repositoryDetails.features];
      const dropFeatureGroup = { ...tempFeatureGroups[featureGroupIndex] };
      const draggedFeature = tempFeatures.find((feature: IFeature) => {
        return feature.id === result.draggableId;
      });
      if (draggedFeature?.name) {
        dropFeatureGroup.features = [
          ...dropFeatureGroup.features,
          { name: draggedFeature?.name, id: draggedFeature?.id } as IFeature,
        ];
        tempObject.feature_groups[featureGroupIndex] = dropFeatureGroup;
        tempFeatures.splice(tempFeatures.indexOf(draggedFeature as IFeature), 1);
        tempObject.features = tempFeatures;
        editRepository(tempObject, false, false, featureGroupIndex);
        setRepositoryDetails(tempObject);
      }
    }
  };

  const moveFeatureWithinFeatureGroup = (result: any) => {
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const featureGroupIndex = repositoryDetails.feature_groups.findIndex(
      (item: any) => item.id === result.destination.droppableId,
    );
    if (featureGroupIndex > -1) {
      const tempObject = { ...repositoryDetails };
      const tempFeatureGroups = repositoryDetails.feature_groups;
      const dropFeatureGroup = { ...tempFeatureGroups[featureGroupIndex] };
      const dropFeatureGroupFeatures = dropFeatureGroup.features;
      const temp = dropFeatureGroupFeatures[sourceIndex];
      dropFeatureGroupFeatures[sourceIndex] = dropFeatureGroupFeatures[destinationIndex];
      dropFeatureGroupFeatures[destinationIndex] = temp;
      tempObject.feature_groups[featureGroupIndex].features = dropFeatureGroupFeatures;
      editRepository(tempObject, false, false, featureGroupIndex);
      setRepositoryDetails(tempObject);
    }
  };

  const moveFeatureAcrossFeatureGroup = (result: any) => {
    const featureGroupDropIndex = repositoryDetails.feature_groups.findIndex(
      (item: any) => item.id === result.destination.droppableId,
    );
    if (featureGroupDropIndex > -1) {
      const tempObject = { ...repositoryDetails };
      const tempFeatureGroups = repositoryDetails.feature_groups;
      const featureGroupDragIndex = repositoryDetails.feature_groups.findIndex(
        (item) => item.id === result.source.droppableId,
      );
      const dropFeatureGroup = { ...tempFeatureGroups[featureGroupDropIndex] };
      const dragFeatureGroupFeatures = tempFeatureGroups[featureGroupDragIndex].features;
      const draggedFeature = dragFeatureGroupFeatures?.find((feature: IFeature) => {
        return feature.id === result.draggableId;
      });
      if (draggedFeature?.name) {
        dropFeatureGroup.features = [
          ...dropFeatureGroup.features,
          { name: draggedFeature?.name, id: draggedFeature?.id } as IFeature,
        ];
        tempObject.feature_groups[featureGroupDropIndex] = dropFeatureGroup;
        dragFeatureGroupFeatures.splice(
          dragFeatureGroupFeatures.indexOf(draggedFeature as IFeature),
          1,
        );
        editRepository(tempObject, false, false, featureGroupDropIndex);
        setRepositoryDetails(tempObject);
      }
    }
  };

  const editFeature = (data: IFeature) => {
    const tempObject = { ...repositoryDetails };
    const findIndex = repositoryDetails.features.findIndex((item) => item.id === data.id);
    if (findIndex > -1) {
      tempObject.features[findIndex] = data;
    }
    setRepositoryDetails(tempObject);
  };

  const editFeatureGroup = (data: IFeatureGroup) => {
    const tempObject = { ...repositoryDetails };
    const findIndex = repositoryDetails.feature_groups.findIndex((item) => item.id === data.id);
    if (findIndex > -1) {
      tempObject.feature_groups[findIndex] = data;
    }
    setRepositoryDetails(tempObject);
  };

  const clearData = () => {
    setSelectedRepository({} as IRepository);
  };

  const cloneRepository = () => {
    if (validateSaveAsInput()) {
      addRepository({ name: versionName, product_id: selectedProduct.id }, selectedRepository.id);
      setSnackBarValues({
        display: true,
        type: 'success',
        message: intl.formatMessage({ id: 'addRepositorySuccess' }),
      });
    }
  };

  const validateSaveAsInput = () => {
    let isValid = true;
    if (versionName && !REGEX.test(versionName)) {
      isValid = false;
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'valueWithSpecialCharacters' }),
      });
      return isValid;
    }
    if (versionName.trim() === '') {
      isValid = false;
      setSnackBarValues({
        display: true,
        message: intl.formatMessage({ id: 'cloneNameMissing' }),
        type: 'error',
      });
      return isValid;
    }
    if (repositories.some((repository) => repository.name === versionName)) {
      isValid = false;
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'repositoryNameAlreadyExists' }),
      });
      return isValid;
    }
    return isValid;
  };

  const setRepositoryCaption = (defaultCaption: string, updatedCaption: string) => {
    if (selectedProduct?.id) {
      if (repositories.length) {
        return defaultCaption;
      }
      return updatedCaption;
    }
    return defaultCaption;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                  selectedItem={selectedProduct}
                  caption="selectProduct"
                  data={productList}
                  showSelectionValue
                  showAddOption={false}
                  loading={isProductLoading}
                  setSelectedData={onSelectProduct}
                />
              </FormControl>
              <FormControl sx={{ m: 1, width: 240 }}>
                <SearchAddAutocomplete
                  readOnly={!selectedProduct?.id}
                  selectedItem={selectedRepository}
                  caption={setRepositoryCaption('searchAddRepository', 'noRepositoryCreated')}
                  data={repositories}
                  showSelectionValue
                  loading={repositoriesLoading}
                  setSelectedData={onSelectRepositories}
                />
              </FormControl>
            </Paper>
          </Grid>
          {selectedRepository?.id ? (
            <Grid
              container
              spacing={3}
              sx={{
                marginTop: '30px',
              }}>
              <Grid item md={4}>
                <SearchAddCard
                  caption="searchAddFeatures"
                  cardHeader="features"
                  data={repositoryDetails.features}
                  setAddOption={addNewFeature}
                  onItemSelected={onEditFeatureClick}
                  actionConfig={featureEditConfig}
                  showProgress={loader || featureLoader}
                />
              </Grid>
              <Grid item md={4}>
                <SearchAddCard
                  caption="searchAddFeatureGroups"
                  cardHeader="featureGroups"
                  data={repositoryDetails.feature_groups}
                  setAddOption={addNewFeatureGroup}
                  onItemSelected={onEditFeatureGroupClick}
                  isAccordions
                  listActionConfig={featureGroupFeatureConfig}
                  actionConfig={featureGroupEditConfig}
                  showProgress={loader || featureGroupLoader}
                />
              </Grid>
            </Grid>
          ) : null}
        </Grid>
        <EditFeature setLoader={(value) => setFeatureLoader(value)} onEdit={editFeature} />
        <EditFeatureGroup
          onEdit={editFeatureGroup}
          setLoader={(value) => setFeatureGroupLoader(value)}
        />
        {selectedRepository?.id ? (
          <SaveInput
            showProgress={repositoryLoader}
            value={versionName}
            onClick={cloneRepository}
            onTextChange={(event) => {
              setVersionName(event.target.value);
            }}
            btnText="saveAs"
            placeholder="versionName"
          />
        ) : null}
      </Box>
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

export default injectIntl(FeatureRepository);
