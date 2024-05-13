import { Box, CircularProgress, Stack } from '@mui/material';
import React from 'react';
import AccordionList from '../AccordionList/AccordionList';
import SearchAddAutocomplete from '../Autocomplete/SearchAddAutocomplete';
import CardHeaderText from '../CardHeaderText/CardHeaderText';
import ListCard from '../ListCard/ListCard';
import ListItems from '../ListItems/ListItems';
import './SearchAddCard.scss';

export interface SearchAddCardTypes {
  caption: string;
  cardHeader: string;
  data: any;
  setAddOption: any;
  onItemSelected?: any;
  actionConfig?: [];
  isAccordions?: boolean;
  isDropDisabled?: boolean;
  isDragDisabled?: boolean;
  showProgress?: boolean;
  showAutocomplete?: boolean;
  loading?: boolean;
  listActionConfig?: [];
}

const SearchAddCard: React.FC<SearchAddCardTypes> = ({
  caption,
  cardHeader,
  data,
  setAddOption,
  onItemSelected,
  actionConfig,
  isAccordions = false,
  isDropDisabled = false,
  showProgress = false,
  showAutocomplete = true,
  isDragDisabled = false,
  loading = false,
  listActionConfig,
}) => {
  return (
    <ListCard>
      <CardHeaderText cardHeader={cardHeader} />
      <Box sx={{ padding: '0px 18px', paddingBottom: '18px', minHeight: '50vh' }}>
        {showAutocomplete ? (
          <Box sx={{ marginTop: '20px' }}>
            <SearchAddAutocomplete
              loading={loading}
              showSelectionValue
              caption={caption}
              data={data}
              setSelectedData={setAddOption}
            />
          </Box>
        ) : null}
        {showProgress ? (
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="center"
            sx={{ height: '50vh' }}>
            <CircularProgress color="secondary" />
          </Stack>
        ) : (
          <Box sx={{ overflowY: 'auto', marginTop: '20px', maxHeight: '500px' }}>
            {isAccordions ? (
              <AccordionList
                isDragDisabled={isDragDisabled}
                isDropDisabled={isDropDisabled}
                data={data}
                actionConfig={actionConfig}
                listActionConfig={listActionConfig}
              />
            ) : (
              <ListItems
                isDragDisabled={isDragDisabled}
                data={data}
                onClickItem={onItemSelected}
                actionConfig={actionConfig}
              />
            )}
          </Box>
        )}
      </Box>
    </ListCard>
  );
};

export default SearchAddCard;
