import * as Yup from 'yup';

const schema = Yup.object({
  email: Yup.string().trim().required('Email is required'),
  temp_password: Yup.string().required('Temporary password is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Please enter atleast 8 characters')
    .matches(/[a-z]/, 'Should contain at least one lowercase char')
    .matches(/[A-Z]/, 'Should contain at least one uppercase char')
    .matches(/\d+/, 'Should contain at least one digit')
    .matches(/[!@#$%^&*()-+=_|'{}]+/, 'Should contain at least one special char'),
  confirm_password: Yup.string()
    .required('Confirm password is required')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export default schema;
