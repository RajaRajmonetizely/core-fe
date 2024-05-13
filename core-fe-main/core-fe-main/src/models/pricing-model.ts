import { ITier } from './plan';

export interface IPricingStructure {
  id: string;
  name: string;
  pricing_model_id: string;
  custom_formula: string;
  details: Array<IPricingColumn>;
}

export interface IPricingColumn {
  formula: string;
  advance_formula: string;
  outputFormula: string;
  outputFormulaValue?: string;
  has_formula: boolean;
  is_input_column: boolean;
  is_metric_column: boolean;
  is_output_column: boolean;
  is_code_editor?: boolean;
  key: string;
  metric_id: string;
  name: string;
  pastHighValue?: number;
  columnType: string;
  sub_columns: Array<{ key: string; name: string }>;
}

export interface ICreateMetrics {
  name: string;
}

export interface IMetrics {
  created_on: string;
  id: string;
  is_deleted: boolean;
  name: string;
  updated_on: string;
  inputValue: string;
}

export interface ICreateMetricsSuccess {
  message: string;
  data: IMetrics;
}

export interface IGetMetrics {
  message: string;
  data: IMetrics[];
}

export interface ICreatePricingModel {
  name: string;
  package_id: string;
}

export interface ICreatePricingModelSuccess {
  message: string;
  data: IPricingModel;
}

export interface IPricingModel {
  name: string;
  id: string;
  package_id: string;
  details: ITier[];
  metric_details: any[];
  pricing_structure_id: string;
}

export interface IGetPricingModel {
  message: string;
  data: IPricingModel[];
}

export interface ICoreDetails {
  pricing_model_detail_id: string;
  core: IColumnValues;
  addons?: IAddOnDetails[];
}

export interface IColumnValues {
  columns: Array<IPricingColumn>;
  values: any;
}

export interface ICoreData {
  metric_details: Array<string>;
  pricing_structure_id: string;
  details: ICoreDetails[];
}

export interface IUpdateCoreData {
  data: string;
  message: string;
}

export interface IAddOnData {
  model: string;
  fee: string;
  min: number;
  max: number;
  sell_multiple: boolean;
}
export interface IAddOnDetails {
  id: string;
  is_custom_metric: boolean;
  metric_name?: string;
  details?: IAddOnData;
  columns?: any;
  values?: any;
  metric_details?: any[];
  pricing_structure_id?: string;
}
