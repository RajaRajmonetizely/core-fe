import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import _ from 'lodash';

type Actions = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Subjects =
  | 'Product'
  | 'Feature'
  | 'Feature Repository'
  | 'Feature Group'
  | 'Plan'
  | 'Package'
  | 'Pricing Model'
  | 'Price Book'
  | 'Price Book Rule'
  | 'Price Book Discount'
  | 'Pricing Calculator';

export type AppAbilityType = Ability<[Actions, Subjects]>;
export const AppAbility = Ability as AbilityClass<AppAbilityType>;

export const defineRulesFor = (operations: any) => {
  const { can, rules } = new AbilityBuilder(AppAbility);
  _.keys(operations).forEach((op: any) => {
    can(operations[op], op);
  });

  return rules;
};

export const buildAbilityFor = (operations: any): AppAbilityType => {
  return new AppAbility(defineRulesFor(operations), {
    // https://casl.js.org/v5/en/guide/subject-type-detection
    detectSubjectType: (object: any) => object.type,
  });
};
