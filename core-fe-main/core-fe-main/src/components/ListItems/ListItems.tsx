import { Box, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import React from 'react';
import './ListItems.scss';
import { Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import StrictModeDroppable from '../StrictModeDroppable/StrictModeDroppable';

export interface ListItemTypes {
  data: any;
  onClickItem?: (item: any) => {};
  isDragDisabled?: boolean;
  actionConfig?: [];
}

const ListItems: React.FC<ListItemTypes> = ({
  data,
  isDragDisabled = false,
  actionConfig,
  onClickItem,
}) => {
  const onItemClick = (item: any) => {
    if (onClickItem) onClickItem(item);
  };

  return (
    <StrictModeDroppable droppableId="Features" isDropDisabled>
      {(dropProvided) => (
        <List ref={dropProvided.innerRef}>
          {dropProvided.placeholder}
          {data.map((p: any, i: any) => {
            return (
              <Draggable isDragDisabled={isDragDisabled} key={p.id} draggableId={p.id} index={i}>
                {(provided, snapshot) => {
                  return (
                    <>
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}>
                        {/* eslint-disable-next-line react/no-array-index-key */}
                        <ListItemText className="item" onClick={() => onItemClick(p)} key={p.id}>
                          <Grid container>
                            <Grid item md={8}>
                              <Typography className="itemText">{p.name}</Typography>
                            </Grid>
                            <Grid item md={3} marginLeft="auto">
                              <Box display="flex" justifyContent="flex-end">
                                {actionConfig &&
                                  actionConfig.map((a: any, index: number) => {
                                    return (
                                      <ListItemIcon
                                        key={uuidv4()}
                                        sx={{
                                          marginTop: '14px',
                                          minWidth: '30px',
                                          ':hover': { cursor: 'pointer' },
                                        }}
                                        onClick={() => {
                                          a.onClickHandler(p, index);
                                        }}>
                                        {a.icon}
                                      </ListItemIcon>
                                    );
                                  })}
                              </Box>
                            </Grid>
                          </Grid>
                        </ListItemText>
                      </ListItem>
                      {snapshot.isDragging ? <Box /> : null}
                    </>
                  );
                }}
              </Draggable>
            );
          })}
        </List>
      )}
    </StrictModeDroppable>
  );
};

export default ListItems;
