export interface IPackage {
  name: string;
  id: string;
}
export interface IAddPackage {
  name: string;
  plan_id: string;
}

export interface ISuccessGetPackagePerPlan {
  message: string;
  data: IPackage[] | any[];
}

export interface ISuccessAddPackage {
  message: string;
  data: IPackage;
}
