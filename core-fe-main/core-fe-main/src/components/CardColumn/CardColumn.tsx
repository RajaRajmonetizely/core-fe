import { Box } from '@mui/material';
import React, { ReactElement } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FormattedMessage } from 'react-intl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IOSSwitch from '../Switch/Switch';
import './CardColumn.scss';

interface IProps {
  title: string;
  headerBgColor?: string;
  bodyBgColor?: string;
  emptyText: string;
  item: any;
  handleAddOnChange: any;
  onDeleteFeatureAndGroup: any;
}

const CardColumn: React.FC<IProps> = ({
  title,
  item,
  headerBgColor = '#865DDA',
  bodyBgColor = '#E0E1E2',
  emptyText,
  handleAddOnChange,
  onDeleteFeatureAndGroup,
}): ReactElement => {
  return (
    <Box sx={{ width: '300px', margin: '0 10px 10px 0', flexShrink: 0 }}>
      <Box
        className="cardHeader"
        sx={{ backgroundColor: headerBgColor, borderRadius: '10px 10px 0px 0px' }}>
        <Box className="cardHeaderTitle">{title}</Box>
      </Box>
      <Box
        sx={{
          backgroundColor: bodyBgColor,
          minHeight: '50vh',
          padding: '16px',
          borderRadius: '0px 0px 10px 10px',
        }}>
        {item.details.feature_groups && item.details.feature_groups.length > 0 ? (
          item.details.feature_groups.map((group: any, index: any) => {
            return (
              <Draggable
                key={group.feature_group_id}
                draggableId={group.feature_group_id + item.id}
                index={index}>
                {(provided) => {
                  return (
                    <>
                      <Box
                        sx={{
                          background: '#5D5FEF',
                          borderRadius: '5px',
                          display: 'flex',
                          padding: '14px',
                          marginBottom: '12px',
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}>
                        <Box
                          sx={{
                            fontFamily: 'Helvetica',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            marginTop: 'auto',
                            marginBottom: 'auto',
                            fontStyle: 'normal',
                          }}>
                          {group.name}
                        </Box>
                        <DeleteOutlineIcon
                          sx={{
                            color: 'white',
                            marginLeft: 'auto',
                            marginBottom: 'auto',
                            ':hover': { cursor: 'pointer' },
                          }}
                          onClick={() => onDeleteFeatureAndGroup(item, group)}
                        />
                      </Box>
                      {group.features.map((feature: any) => {
                        return (
                          <Box
                            key={feature.feature_id}
                            sx={{
                              background: 'white',
                              borderRadius: '5px',
                              display: 'flex',
                              padding: '2px 14px',
                              marginTop: '12px',
                              marginBottom: '12px',
                            }}>
                            <Box
                              sx={{
                                fontFamily: 'Helvetica',
                                color: '#3B3F4D',
                                fontSize: '0.9rem',
                                fontWeight: 400,
                                marginTop: 'auto',
                                marginBottom: 'auto',
                                fontStyle: 'normal',
                              }}>
                              {feature.name}
                            </Box>
                            <IOSSwitch
                              sx={{ m: 1, marginLeft: 'auto' }}
                              checked={feature.is_addon}
                              title="Toggle on to make this feature an addon."
                              onChange={() => handleAddOnChange(item, group, feature)}
                            />
                            <DeleteOutlineIcon
                              sx={{
                                color: 'red',
                                marginTop: 'auto',
                                marginBottom: 'auto',
                                ':hover': { cursor: 'pointer' },
                              }}
                              onClick={() => onDeleteFeatureAndGroup(item, group, feature)}
                            />
                          </Box>
                        );
                      })}
                    </>
                  );
                }}
              </Draggable>
            );
          })
        ) : (
          <Box className="cardEmptyText">
            <FormattedMessage id={emptyText} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CardColumn;
