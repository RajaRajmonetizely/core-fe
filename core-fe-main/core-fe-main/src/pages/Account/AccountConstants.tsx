import * as Yup from 'yup';
import { REGEX } from '../../utils/helperService';

const schema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Please enter Account Name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  account_number: Yup.string().nullable(),
  contact_name: Yup.string()
    .trim()
    .required('Please enter Contact Name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  email: Yup.string().trim().required('Please enter Email').email('Please enter a valid email id'),
  description: Yup.string().nullable(),
  ownership: Yup.string().nullable(),
  upsell_opportunity: Yup.string().nullable(),
  type: Yup.string().nullable(),
  quote_to_name: Yup.string()
    .trim()
    .required('Please enter name')
    .matches(
      REGEX,
      'Name should have more than 1 character, start with an alphabet and can have special characters like .,-_&',
    ),
  quote_to_address: Yup.string().required('Please enter address'),
  shipping_country: Yup.string().nullable(),
  shipping_city: Yup.string().nullable(),
  shipping_street: Yup.string().nullable(),
  shipping_state: Yup.string().nullable(),
  shipping_postal_code: Yup.string().nullable(),
  ship_to_name: Yup.string().nullable(),
  billing_country: Yup.string().nullable(),
  billing_city: Yup.string().nullable(),
  billing_street: Yup.string().nullable(),
  billing_state: Yup.string().nullable(),
  billing_postal_code: Yup.string().nullable(),
  bill_to_name: Yup.string().nullable(),
  owner_id: Yup.string().nullable(),
  site: Yup.string().nullable(),
  annual_revenue: Yup.number().nullable(),
  number_of_employees: Yup.number().nullable(),
  website: Yup.string().nullable(),
  year_started: Yup.string().nullable(),
  funding_amount: Yup.number().nullable(),
  industry_type_id: Yup.string().nullable(),
});

export default schema;
