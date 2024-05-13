export interface IAddPlan {
  name: string;
  feature_repository_id: string;
}

export interface IAddTier {
  plan_id: string;
  tier_names: any[];
}

export interface IUpdateTier {
  name: string;
  tier_id: string;
}

export interface IDeleteTier {
  tier_id: string;
}

export interface Plan {
  id?: string;
  name?: string;
  repository_id?: string;
  tiers?: any[];
}
export interface IAllPlans {
  message: string;
  data: Plan[];
}

export interface ITier {
  pricing_model_detail_id: string;
  tier_id: string;
  tier_name: string;
  checked: boolean;
  color: string;
}
