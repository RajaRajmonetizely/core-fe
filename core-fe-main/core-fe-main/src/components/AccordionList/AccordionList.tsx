import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  ListItemIcon,
} from '@mui/material';
import React, { ReactElement } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import StrictModeDroppable from '../StrictModeDroppable/StrictModeDroppable';
import './AccordionList.scss';

const componentStyle = {
  iconContainer: {
    marginTop: 'auto',
    marginBottom: 'auto',
    marginLeft: 'auto',
    marginRight: '10px',
  },
};

export interface ListItemTypes {
  data: any;
  actionConfig?: [];
  listActionConfig?: [];
  isDropDisabled: boolean;
  isDragDisabled?: boolean;
}

const AccordionList: React.FC<ListItemTypes> = ({
  data,
  actionConfig,
  listActionConfig,
  isDropDisabled,
  isDragDisabled = false,
}): ReactElement | null => {
  const [expanded, setExpanded] = React.useState<number | false>(0);

  const handleChange = (panel: number) => (event: React.SyntheticEvent, newExpanded: boolean) => {
    setExpanded(newExpanded ? panel : false);
  };

  const groups = (item: any, index: number, feature: any): ReactElement => {
    return (
      <Box
        sx={{ display: 'flex' }}
        className={`item ${index === item.features.length - 1 ? '' : ''}`}
        key={feature.id}>
        <Box className="itemText">{feature.name}</Box>

        <Box sx={componentStyle.iconContainer} display="flex" justifyContent="flex-end">
          {listActionConfig &&
            listActionConfig.map((a: any) => {
              return <>{icons(a, index, item)}</>;
            })}
        </Box>
      </Box>
    );
  };

  const icons = (a: any, index: number, item: any) => {
    return (
      <ListItemIcon
        key={uuidv4()}
        sx={{
          marginTop: '0px',
          minWidth: '30px',
          ':hover': { cursor: 'pointer' },
        }}
        onClick={() => {
          a.onClickHandler(item, index);
        }}>
        {a.icon}
      </ListItemIcon>
    );
  };

  if (data) {
    return (
      // <StrictModeDroppable droppableId="ITEMS">
      //   {(dropProvided) => (
      //     <Box ref={dropProvided.innerRef}>
      <>
        {data.map((item: any, index: number) => {
          return (
            <StrictModeDroppable
              isDropDisabled={isDropDisabled}
              key={item.id}
              droppableId={item.id}>
              {(cProvided) => {
                return (
                  <Box
                    sx={{
                      marginBottom: '10px',
                      '& .Mui-expanded': {
                        minHeight: 'unset !important',
                        margin: '0px !important',
                        marginBottom: `${
                          // eslint-disable-next-line
                          index === data.length - 1 && item.features.length == 0 ? '50px' : '12px'
                        } !important`,
                      },
                      '& .MuiAccordionSummary-content': {
                        margin: '0px !important',
                      },
                    }}
                    ref={cProvided.innerRef}>
                    <Accordion
                      sx={{ boxShadow: 'unset' }}
                      expanded={expanded === index}
                      onChange={handleChange(index)}
                      key={item.id}>
                      <AccordionSummary
                        key={item.id}
                        className="accordionTitle"
                        sx={{
                          paddingTop: '16px',
                          paddingBottom: '16px',
                          marginBottom: `${index === data.length - 1 ? '50px' : '12px'} !important`,
                        }}
                        aria-controls="panel1a-content"
                        id="panel1a-header">
                        {expanded === index ? <RemoveIcon /> : <AddIcon />}

                        <Box className="accordionTitleText">{item.name}</Box>
                        <Grid item md={3} marginLeft="auto">
                          <Box display="flex" justifyContent="flex-end">
                            {actionConfig &&
                              actionConfig.map((a: any, i: number) => {
                                return <>{icons(a, i, item)}</>;
                              })}
                          </Box>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails sx={{ padding: '0px' }}>
                        {item.features?.map((feature: any, i: number) => {
                          return (
                            <Draggable
                              isDragDisabled={isDragDisabled}
                              key={feature.id}
                              draggableId={feature.id}
                              index={i}>
                              {(provided, snapshot) => {
                                return (
                                  // eslint-disable-next-line
                                  <Box sx={i == 0 ? { marginTop: '12px' } : {}}>
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}>
                                      {groups(item, i, feature)}
                                    </Box>
                                    {snapshot.isDragging ? groups(item, i, feature) : null}
                                  </Box>
                                );
                              }}
                            </Draggable>
                          );
                        })}
                      </AccordionDetails>
                    </Accordion>
                    {cProvided.placeholder}
                  </Box>
                );
              }}
            </StrictModeDroppable>
          );
        })}
        {/* //     </Box>
      //   )}
      // </StrictModeDroppable> */}
      </>
    );
  }
  return null;
};

export default AccordionList;
