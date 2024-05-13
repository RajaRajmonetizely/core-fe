import { Box, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { arrayToTree } from 'performant-array-to-tree';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { alpha, styled } from '@mui/material/styles';
import TreeView from '@mui/lab/TreeView';
import TreeItem, { TreeItemProps, treeItemClasses } from '@mui/lab/TreeItem';
import Collapse from '@mui/material/Collapse';
import { useSpring, animated } from '@react-spring/web';
import { TransitionProps } from '@mui/material/transitions';
import DownloadIcon from '@mui/icons-material/Download';
import OrgHierarchyClient from '../../api/UserOrg/UserOrg';
import commonStyle from '../../styles/commonStyle';
import PageLoader from '../../components/PageLoader/PageLoader';
import styles from '../../styles/styles';
import Snackbar from '../../components/Snackbar/Snackbar';
import { ISnackBar } from '../../models/common';
import { ORG_HIERARCHY_FILE_LINK } from '../../constants/constants';

const pageStyle = {
  titleLabel: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: '1rem',
    display: 'flex',
  },
  userName: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 400,
    fontSize: '1rem',
  },
  dragIcon: {
    color: 'rgba(113, 128, 150, 1)',
    fontSize: '2rem',
    marginRight: '14px',
  },
  container: {
    backgroundColor: 'rgba(244, 246, 254, 1)',
    padding: '36px',
  },
  headerTitle: {
    color: 'rgba(59, 63, 77, 1)',
    fontFamily: 'Helvetica',
    fontWeight: 700,
    fontSize: '1.3rem',
    marginBottom: '32px',
  },
  treeViewStyle: {
    minHeight: 264,
    overflowY: 'auto',
  },
  treeSpacingLeft: {
    marginLeft: '20px',
  },
  hideFileInput: {
    display: 'none',
  },
  titleContainer: {
    display: 'flex',
  },
  importBtn: {
    marginLeft: 'auto',
  },
  exportBtn: {
    marginLeft: '12px',
    borderRadius: '4px',
  },
};

interface IProps {
  intl?: any;
}

const TransitionComponent = (props: TransitionProps) => {
  const style = useSpring({
    from: {
      opacity: 0,
      transform: 'translate3d(20px,0,0)',
    },
    to: {
      // eslint-disable-next-line
      opacity: props.in ? 1 : 0,
      // eslint-disable-next-line
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
    },
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
};

const StyledTreeItem = styled((props: TreeItemProps) => (
  <TreeItem {...props} TransitionComponent={TransitionComponent} />
))(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': {
      opacity: 0.3,
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 36,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  [`& .MuiTreeItem-content.Mui-selected`]: {
    backgroundColor: 'transparent !important',
  },
  [`& .MuiTreeItem-content:hover`]: {
    backgroundColor: 'transparent !important',
  },
  [`& .MuiTreeItem-iconContainer`]: {
    display: 'none !important',
  },
  [`& .MuiTreeItem-content`]: {
    paddingLeft: '0px',
  },
  [`& .${treeItemClasses.label}`]: {
    background: 'white',
    padding: '14px 26px',
    paddingLeft: '26px !important',
    maxWidth: '400px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
}));

const CompanyHierarchy: React.FC<IProps> = ({ intl }): ReactElement => {
  // eslint-disable-next-line
  const dispatch = useDispatch();
  const ability = useSelector((state: any) => state.auth.ability);
  const [treeData, setTreeData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loader, setLoader] = useState(false);
  const inputRef = useRef<any>(null);
  const [snackbarValues, setSnackBarValues] = useState<ISnackBar>({} as ISnackBar);

  useEffect(() => {
    getCompanyHierarchy();
    // eslint-disable-next-line
  }, []);

  const getCompanyHierarchy = async () => {
    if (ability.can('GET', 'Organizational Hierarchy')) {
      try {
        setLoader(true);
        const response = await OrgHierarchyClient.getOrgHierarchyStructure(true);
        if (response.data) {
          const tree = arrayToTree(response.data, { parentId: 'parent_id' });
          setTreeData(tree as any);
        }
        setLoader(false);
      } catch (e) {
        setLoader(false);
      }
    }
  };

  const renderTree = (nodes: any) => (
    <StyledTreeItem
      key={nodes.data.id}
      nodeId={nodes.data.id}
      sx={nodes.data.parent_id ? pageStyle.treeSpacingLeft : {}}
      label={
        <Box sx={pageStyle.titleLabel}>
          <DragHandleIcon
            sx={[
              pageStyle.dragIcon,
              commonStyle.verticalCenter,
              // eslint-disable-next-line
              nodes.children.length == 0 && nodes.data.users.length == 0 ? { opacity: 0.5 } : {},
            ]}
          />
          <Box sx={commonStyle.verticalCenter}>{nodes.data.name}</Box>
        </Box>
      }>
      {nodes.data.users.map((user: any) => {
        return (
          <StyledTreeItem
            key={user.id}
            nodeId={user.id}
            sx={pageStyle.treeSpacingLeft}
            label={<Box sx={pageStyle.userName}>{user.name}</Box>}
          />
        );
      })}
      {Array.isArray(nodes.children) ? nodes.children.map((data: any) => renderTree(data)) : null}
    </StyledTreeItem>
  );

  const handleFileChange = async (event: any) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) {
      return;
    }
    event.target.value = null;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', fileObj);
      const response = await OrgHierarchyClient.uploadOrgCSV(formData);
      if (response.message === 'success') {
        getCompanyHierarchy();
        setSnackBarValues({
          display: true,
          type: 'success',
          message: intl.formatMessage({ id: 'orgUploaded' }),
        });
      }
      setIsUploading(false);
    } catch (e) {
      setIsUploading(false);
    }

    // 👇️ reset file input
  };

  const handleImportClick = () => {
    if (inputRef) {
      // 👇️ open file input box on click of another element
      inputRef?.current?.click();
    }
  };

  const handleClick = async () => {
    try {
      const tempLink = document.createElement('a');
      tempLink.href = ORG_HIERARCHY_FILE_LINK;
      tempLink.click();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box sx={commonStyle.bodyContainer}>
      {loader ? (
        <PageLoader />
      ) : (
        <Box sx={pageStyle.container}>
          <Box sx={pageStyle.titleContainer}>
            <Box sx={pageStyle.headerTitle}>{intl.formatMessage({ id: 'companyHierarchy' })}</Box>
            <input
              onChange={handleFileChange}
              style={pageStyle.hideFileInput}
              type="file"
              ref={inputRef}
              accept=".csv"
            />
            <Button
              onClick={handleImportClick}
              disabled={isUploading}
              sx={{ ...styles.dialogButton, ...pageStyle.importBtn }}>
              {isUploading ? (
                <CircularProgress color="inherit" size={24} />
              ) : (
                <FormattedMessage id="importOrgHierarchy" />
              )}
            </Button>
            <Tooltip title={<FormattedMessage id="exportOrgHierarchyFormat" />}>
              <IconButton
                onClick={handleClick}
                disabled={isUploading}
                sx={{ ...styles.dialogButton, ...pageStyle.exportBtn }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <TreeView aria-label="customized" defaultExpanded={['1']} sx={pageStyle.treeViewStyle}>
            {treeData.map((item) => {
              return renderTree(item);
            })}
          </TreeView>
        </Box>
      )}
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

export default injectIntl(CompanyHierarchy);
