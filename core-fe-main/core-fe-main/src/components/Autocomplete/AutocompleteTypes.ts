export interface AutocompleteTypes {
  intl: any;
  caption: string;
  data: any[];
  setSelectedData: any;
  selectedItem?: any;
  readOnly?: any;
  showSelectionValue?: boolean;
  multiselect?: boolean;
  showAddOption?: boolean;
  loading?: boolean;
}

export interface ObjectKeys {
  [key: string]: any;
}
export interface OptionType extends ObjectKeys {
  inputValue?: string;
  name: string;
}
