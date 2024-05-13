import { Box, CircularProgress, Stack } from '@mui/material';
import { useWindowSize } from '@uidotdev/usehooks';
import _ from 'lodash';
import React, { ReactElement, useEffect, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import FeatureRepositoryClient from '../../api/FeatureRepository/FeatureRepositoryAPI';
import PackageClient from '../../api/Package/PackageAPIs';
import Breadcrumbs from '../../components/BreadCrumbs/BreadCrumbs';
import CardColumn from '../../components/CardColumn/CardColumn';
import SaveInput from '../../components/SaveInput/SaveInput';
import SearchAddCard from '../../components/SearchAddCard/SearchAddCard';
import Snackbar from '../../components/Snackbar/Snackbar';
import StrictModeDroppable from '../../components/StrictModeDroppable/StrictModeDroppable';
import { ISnackBar } from '../../models/common';
import { setCurrentPackageList } from '../../store/package/package.slice';
import { REGEX, generateRandomColor } from '../../utils/helperService';

interface IProps {
  readonly intl: any;
}

const componentStyle = {
  loader: {
    height: '50vh',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};
const PackageDesigner: React.FC<IProps> = ({ intl }): ReactElement => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const size = useWindowSize();
  const { packageId } = useParams();
  const ability = useSelector((state: any) => state.auth.ability);
  const currentPlan = useSelector((state: any) => state.plans.currentPlan);
  const currentPackage = useSelector((state: any) => state.package.currentPackage);
  const currentPackageList = useSelector((state: any) => state.package.currentPackageList);
  const [repositoryDetails, setRepositorydetails] = useState<any>({});
  const [tiersList, setTiersList] = useState<any>([]);
  const [versionName, setVersionName] = useState('');
  const [versionLoader, setVersionLoader] = useState(false);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);
  const [packageLoader, setPackageLoader] = useState(false);
  const [repoLoader, setRepoLoader] = useState(false);

  useEffect(() => {
    getPackageById();
    // eslint-disable-next-line
  }, [packageId]);

  const getPackageById = () => {
    if (packageId && ability.can('GET', 'Package')) {
      setPackageLoader(true);
      PackageClient.getPackageById(packageId)
        .then(({ data }) => {
          if (data.length) {
            getRepositoryById(data[0].repository_id);
          }
          setTiersList(
            data.map((d: any) => {
              return {
                ...d,
                headerBgColor: generateRandomColor(),
                name: d.tier_name,
                id: d.tier_id,
              };
            }),
          );
          setPackageLoader(false);
        })
        .catch((e) => {
          console.error(e);
          setPackageLoader(false);
        });
    }
  };

  const getRepositoryById = (repositoryId: string) => {
    setRepoLoader(true);
    FeatureRepositoryClient.getRepositoryById(repositoryId)
      .then(({ data }) => {
        setRepositorydetails(data);
        setRepoLoader(false);
      })
      .catch((e) => {
        console.error(e);
        setRepoLoader(false);
      });
  };

  const notAllowedMessage = () => {
    setSnackBarValues({
      display: true,
      type: 'error',
      message: intl.formatMessage({ id: 'notAllowedMessage' }),
    });
  };

  const onDragEnd = (result: any) => {
    if (ability.can('PUT', 'Package')) {
      if (!result.destination) return;
      if (
        result.source.droppableId === result.destination.droppableId &&
        result.source.index === result.destination.index
      ) {
        return;
      }
      const destinationTierIndex = tiersList.findIndex(
        (item: any) => item.id === result.destination.droppableId,
      );
      if (destinationTierIndex > -1) {
        const tempData = [...tiersList];
        const tierData = tempData[destinationTierIndex];
        let tierDetails = tierData.details;
        if (_.isEmpty(tierDetails)) {
          tierDetails = { features: [], feature_groups: [] };
        }
        repositoryDetails.feature_groups.map((fgr: any) => {
          return fgr.features.map((feature: any) => {
            if (feature.id === result.draggableId) {
              const findGroup = tierDetails?.feature_groups.findIndex(
                (feat: any) => feat?.feature_group_id === fgr.id,
              );
              if (findGroup === -1) {
                tierDetails.feature_groups.push({
                  feature_group_id: fgr.id,
                  name: fgr.name,
                  features: [{ feature_id: feature.id, name: feature.name, is_addon: false }],
                });
              } else {
                const isExist = tierDetails.feature_groups[findGroup].features.findIndex(
                  (f: any) => f.feature_id === feature.id,
                );
                if (isExist === -1) {
                  tierDetails.feature_groups[findGroup].features.push({
                    feature_id: feature.id,
                    name: feature.name,
                    is_addon: false,
                  });
                }
              }
              tierData.details = tierDetails;
            }
            return null;
          });
        });
        updatePackage(
          {
            ...tierDetails,
            package_detail_id: tierData.package_detail_id,
          },
          tempData,
        );
      }
    } else {
      notAllowedMessage();
    }
  };

  const handleAddOnChange = (item: any, group: any, feature: any) => {
    if (ability.can('PUT', 'Package')) {
      const destinationTierIndex = tiersList.findIndex((t: any) => item.id === t.id);
      if (destinationTierIndex > -1) {
        const tempData = [...tiersList];
        const tierData = tempData[destinationTierIndex];
        const tierDetails = tierData.details;

        const findGroup = tierDetails?.feature_groups.findIndex(
          (feat: any) => feat?.feature_group_id === group.feature_group_id,
        );
        tierDetails.feature_groups[findGroup].features = tierDetails.feature_groups[
          findGroup
        ].features.map((f: any) =>
          f.feature_id === feature.feature_id ? { ...f, is_addon: !feature.is_addon } : f,
        );

        tierData.details = tierDetails;
        updatePackage(
          {
            ...tierDetails,
            package_detail_id: tierData.package_detail_id,
          },
          tempData,
        );
      }
    } else {
      notAllowedMessage();
    }
  };

  const onDeleteFeatureAndGroup = (item: any, group: any, feature?: any) => {
    if (ability.can('PUT', 'Package')) {
      const destinationTierIndex = tiersList.findIndex((t: any) => item.id === t.id);
      if (destinationTierIndex > -1) {
        const tempData = [...tiersList];
        const tierData = tempData[destinationTierIndex];
        const tierDetails = tierData.details;

        const findGroup = tierDetails?.feature_groups.findIndex(
          (feat: any) => feat?.feature_group_id === group.feature_group_id,
        );
        if (feature) {
          tierDetails.feature_groups[findGroup].features = group.features.filter(
            (f: any) => f.feature_id !== feature.feature_id,
          );
        } else {
          tierDetails.feature_groups[findGroup].features = [];
        }
        if (tierDetails.feature_groups[findGroup].features.length === 0) {
          tierDetails.feature_groups.splice(findGroup, 1);
        }
        tierData.details = tierDetails;
        updatePackage(
          {
            ...tierDetails,
            package_detail_id: tierData.package_detail_id,
          },
          tempData,
        );
      }
    } else {
      notAllowedMessage();
    }
  };

  const updatePackage = (updatedPackage: any, tempData: any) => {
    PackageClient.editPackage(currentPackage.id, [updatedPackage])
      .then(() => {
        setTiersList(tempData);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'updatePackageSuccess' }),
        });
      })
      .catch((e) => {
        console.error(e);
      });
  };
  const isValidData = () => {
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
    if (versionName.trim().length === 0) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'cloneNameMissing' }),
      });
      isValid = false;
      return isValid;
    }
    if (currentPackageList.some((n: any) => n.name === versionName)) {
      setSnackBarValues({
        display: true,
        type: 'error',
        message: intl.formatMessage({ id: 'packageExistsMessage' }),
      });
      isValid = false;
    }
    return isValid;
  };

  const clonePackage = async () => {
    if (isValidData()) {
      try {
        setVersionLoader(true);
        const response = await PackageClient.addPackage(
          { name: versionName, plan_id: currentPlan.id },
          currentPackage.id,
        );
        if (response.data) {
          dispatch(setCurrentPackageList([...currentPackageList, response.data]));
          navigate(`/plans/package-designer/${response.data.id}`, {
            state: {
              packageName: response.data.name,
            },
          });
        }
        setVersionLoader(false);
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'clonePackageSuccess' }),
        });
      } catch (e) {
        setVersionLoader(false);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Breadcrumbs />
      <Box
        sx={{
          marginRight: '20px',
          marginLeft: '10px',
          borderRadius: '6px',
          display: 'flex',
        }}>
        <Box
          sx={{
            width: size?.width && size?.width < 900 ? '100%' : 'auto',
            marginRight: '40px',
            marginBottom: '24px',
          }}>
          <SearchAddCard
            showAutocomplete={false}
            isDropDisabled
            cardHeader="featureRepository"
            caption="searchOrAddFeature"
            isAccordions
            data={repositoryDetails.feature_groups}
            setAddOption={() => {}}
            onItemSelected={() => {}}
            showProgress={repoLoader || packageLoader}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
          {!packageLoader && tiersList.length
            ? tiersList.map((item: any) => {
                return (
                  <StrictModeDroppable key={item.id} droppableId={item.id}>
                    {(cProvided) => (
                      <Box {...cProvided.droppableProps} ref={cProvided.innerRef}>
                        <CardColumn
                          item={item}
                          title={item.name}
                          emptyText="addFeature"
                          handleAddOnChange={handleAddOnChange}
                          onDeleteFeatureAndGroup={onDeleteFeatureAndGroup}
                        />

                        {cProvided.placeholder}
                      </Box>
                    )}
                  </StrictModeDroppable>
                );
              })
            : null}

          {packageLoader && (
            <Stack
              direction="column"
              justifyContent="center"
              alignItems="center"
              sx={componentStyle.loader}>
              <CircularProgress color="secondary" />
            </Stack>
          )}
        </Box>
      </Box>

      {ability.can('POST', 'Package') ? (
        <SaveInput
          showProgress={versionLoader}
          onTextChange={(event) => {
            setVersionName(event.target.value);
          }}
          onClick={clonePackage}
          value={versionName}
          btnText="saveAs"
          placeholder="versionName"
        />
      ) : null}
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
export default injectIntl(PackageDesigner);
