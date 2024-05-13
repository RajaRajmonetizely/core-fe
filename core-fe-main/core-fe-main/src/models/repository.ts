export interface ICreateRepository {
  name: string;
  product_id: string;
}

export interface IRepository {
  created_on: string;
  id: string;
  is_deleted: boolean;
  name: string;
  product_id: string;
  updated_on: string;
  features: Array<IFeature>;
  feature_groups: Array<IFeatureGroup>;
}

export interface ISuccessRepository {
  message: string;
  data: IRepository[];
}

export interface IAddRepository {
  message: string;
  data: IRepository;
}

export interface IFeature {
  name: string;
  id: string;
  external_name: string;
  external_description: string;
}

export interface IFeatureGroup {
  name: string;
  id: string;
  is_independent: boolean;
  external_name: string;
  external_description: string;
  features: IFeature[];
}

export interface IEditRepository {
  features: Array<IFeature>;
  feature_groups: Array<IFeatureGroup>;
}

export interface IMessage {
  message: string;
}

export interface IRepositoryDetails {
  data: IRepository;
  message: string;
}

export interface IEditFeature {
  data: IFeature;
  message: string;
}

export interface IEditFeatureGroup {
  data: IFeatureGroup;
  message: string;
}
