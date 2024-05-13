import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().required('Email id is required').email('Please enter a valid email id'),
  password: Yup.string().required('Password is required'),
});

export default schema;
