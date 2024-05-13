import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box } from '@mui/material';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ReactComponent as UnlockIcon } from '../../assets/icons/unlock.svg';
// eslint-disable-next-line
import { default as lockIcon } from '../../assets/icons/lock.svg';
import commonStyle from '../../styles/commonStyle';
import styles from '../../styles/styles';
import AddLabel from '../AddLabel/AddLabel';
import PricingTableCell from '../PricingTableCell/PricingTableCell';

interface IProps {
  columns: Array<any>;
  rows: Array<any>;
  readOnly?: boolean;
  showBlock?: boolean;
  selectedPricingStructure: any;
  onAddRow?: () => void;
  onEdit: (item: any) => void;
  onDelete?: (item: any) => void;
  onDeleteRow?: (index: number) => void;
  onAddColumn?: () => void;
  onRowChecked?: (index: number) => void;
  onColumnChecked?: (index: number, subIndex: number | null) => void;
  onColumnLock?: (index: number, subIndex: number | null) => void;
  onTextChange?: (value: any, rowIndex: number, columnData: any, subKey?: string) => void;
}

const componentStyle = {
  tableContainer: {
    border: '1px solid rgba(0, 0, 0, 0.05)',
  },
  tableContainerScroll: {
    overflowX: 'scroll',
  },
  headerCell: {
    fontWeight: 700,
    color: '#000000',
    paddingTop: '24px',
    display: 'inline-table',
    ...styles.tableCell,
  },
  displayFlex: {
    display: 'flex',
  },
  subColumnCell: {
    display: 'flex',
    marginTop: '24px',
    color: 'rgba(59, 63, 77, 0.5)',
  },
  subColumnLabel: {
    flex: 1,
    paddingLeft: '32px',
    paddingRight: '32px',
  },
  addRowContainer: {
    background: 'white',
    padding: '32px 56px',
  },
  bodySubColumn: {
    display: 'flex',
    minWidth: '392px',
  },
  columnMinWidth: {
    minWidth: `300px`,
  },
  editIconStyle: {
    fontSize: '1.4rem',
    cursor: 'pointer',
  },
  box: (item: any) => {
    return {
      width: '16px',
      height: '16px',
      border: '1px solid #C4C4C4',
      borderRadius: '3px',
      marginRight: '12px',
      backgroundColor: item.is_selected ? '#C4C4C4' : 'white',
      marginTop: 'auto',
      marginBottom: 'auto',
    };
  },
  deleteIconStyle: {
    marginLeft: '12px',
  },
  unlockSpacing: {
    marginTop: '10px',
    marginBottom: '4px',
  },
  rowBox: {
    minWidth: '50px',
    marginTop: 'auto',
    marginBottom: 'auto',
    flex: 1,
  },
  checkboxLabel: {
    color: 'rgba(59, 63, 77, 0.5)',
    fontFamily: 'Helvetica',
    fontWeight: '700',
  },
  centerFormGroup: (marginTop: number) => {
    return { marginTop: `${marginTop}px` };
  },
  actionMargin: {
    marginTop: '24px',
  },
};

const PricingStructureTable: React.FC<IProps> = ({
  columns,
  rows,
  readOnly,
  showBlock,
  selectedPricingStructure,
  onTextChange,
  onAddRow,
  onAddColumn,
  onEdit,
  onDelete,
  onDeleteRow,
  onRowChecked,
  onColumnChecked,
  onColumnLock,
}) => {
  const columnCheckBox = (item: any, colIndex: any, subColIndex?: any) => {
    return (
      <>
        <Box
          onClick={() => onColumnChecked && onColumnChecked(colIndex, subColIndex)}
          sx={[componentStyle.box(item), commonStyle.horizontalCenter]}
        />
        <Box
          onClick={() => onColumnLock && onColumnLock(colIndex, subColIndex)}
          sx={componentStyle.unlockSpacing}>
          {item.is_locked ? <img alt="lock" src={lockIcon} /> : <UnlockIcon />}
        </Box>
      </>
    );
  };

  const columnHeaderCell = (item: any, children: any, index?: number) => {
    return (
      <Box
        sx={{
          ...componentStyle.headerCell,
          padding: item.sub_columns && item.sub_columns.length > 0 ? '16px 0px' : '16px 0px',
          minWidth: `${
            item.sub_columns && item.sub_columns.length > 0 ? 392 : item.width ?? 300
          }px`,
          flex: item.sub_columns && item.sub_columns.length > 0 ? 0 : 1,
        }}
        key={uuidv4()}>
        {showBlock ? (
          <Box>
            {item?.sub_columns?.length > 0 ? (
              <Box sx={{ display: 'flex' }}>
                {item.sub_columns.map((subData: any, subIndex: number) => {
                  return (
                    <Box sx={{ flex: 1 }} key={uuidv4()}>
                      {columnCheckBox({ ...subData, is_locked: item.is_locked }, index, subIndex)}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              columnCheckBox(item, index)
            )}
          </Box>
        ) : null}

        {children}
      </Box>
    );
  };

  const columnHeaderLabel = (item: any) => {
    return (
      <>
        <Box>{item.name}</Box>
        {item?.sub_columns.length > 0 ? (
          <Box sx={componentStyle.subColumnCell}>
            {item.sub_columns &&
              item.sub_columns.length > 0 &&
              item.sub_columns.map((subData: any) => {
                return (
                  <Box sx={componentStyle.subColumnLabel} key={uuidv4()}>
                    {subData.name}
                  </Box>
                );
              })}
          </Box>
        ) : null}
        {((!readOnly && item.custom && !item.metric_id) || item.has_formula) && onDelete ? (
          <Box sx={componentStyle.actionMargin}>
            <EditIcon onClick={() => onEdit(item)} sx={componentStyle.editIconStyle} />
            {(selectedPricingStructure.name === 'custom' && item.is_output_column) ||
            !item.is_output_column ? (
              <DeleteIcon
                onClick={() => onDelete(item)}
                sx={{ ...componentStyle.editIconStyle, ...componentStyle.deleteIconStyle }}
              />
            ) : null}

            {/* ) : null} */}
          </Box>
        ) : null}
      </>
    );
  };

  return (
    <Box sx={componentStyle.tableContainer}>
      <Box sx={componentStyle.tableContainerScroll}>
        <Box sx={componentStyle.displayFlex}>
          {showBlock ? <Box sx={componentStyle.rowBox} /> : null}
          {columns.map((item, i) => {
            return (
              <React.Fragment key={uuidv4()}>
                {columnHeaderCell(item, columnHeaderLabel(item), i)}
              </React.Fragment>
            );
          })}
          {!readOnly && onAddColumn
            ? columnHeaderCell(
                { id: uuidv4(), width: 150 },
                <AddLabel onClick={onAddColumn} label="addColumn" />,
              )
            : null}
        </Box>
        {rows.map((data: any, i: number) => {
          return (
            /* eslint-disable react/no-array-index-key */
            <Box key={i} sx={componentStyle.displayFlex}>
              {showBlock ? (
                <Box onClick={() => onRowChecked && onRowChecked(i)} sx={componentStyle.rowBox}>
                  <Box sx={[componentStyle.box(data), commonStyle.horizontalCenter]} />
                </Box>
              ) : null}
              {columns.map((item: any) => {
                if (item.sub_columns && item.sub_columns.length > 0) {
                  return (
                    <Box key={item.key} sx={componentStyle.bodySubColumn}>
                      {item.sub_columns.map((col: any) => {
                        return (
                          <PricingTableCell
                            item={col}
                            readOnly={item.is_locked || readOnly}
                            sx={{ flex: 1 }}
                            key={col.key}
                            value={data[item.key] ? data[item.key][col.key] : ''}
                            onTextChange={(event) => {
                              if (onTextChange) {
                                onTextChange(Number(event.target.value), i, item, col.key);
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                }
                return (
                  <PricingTableCell
                    onTextChange={(event) => {
                      if (onTextChange) {
                        onTextChange(Number(event.target.value), i, item);
                      }
                    }}
                    readOnly={item.is_locked || readOnly}
                    item={item}
                    value={data[item.key] ?? ''}
                    sx={{ minWidth: `${item.width ?? 300}px`, flex: 1 }}
                    key={item.key}
                  />
                );
              })}
              {!readOnly && onDeleteRow ? (
                <PricingTableCell
                  onDelete={() => onDeleteRow(i)}
                  isDelete
                  readOnly={readOnly}
                  sx={{ minWidth: '150px', flex: 1 }}
                  type="view"
                />
              ) : null}

              {/* <PricingTableCell sx={componentStyle.columnMinWidth} type="view" /> */}
            </Box>
          );
        })}
      </Box>
      {rows.length < 100 && !readOnly && onAddRow ? (
        <Box sx={componentStyle.addRowContainer}>
          <AddLabel onClick={onAddRow} label="addNewRow" />
        </Box>
      ) : null}
    </Box>
  );
};

export default PricingStructureTable;
