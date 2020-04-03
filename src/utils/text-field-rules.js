const PASS_LENGTH = 6;

// generic "This field is required."

export const genericFieldRules = [
  v => {
    return !!v || 'This field is required.';
  },
];

export const emailRules = [
  v => {
    return !!v || 'E-mail is required';
  },
  v => /.+@.+/.test(v) || 'Email address must be valid',
];

export const validEmailRules = [
  v => {
    if (!v) {
      return true;
    }
    return /.+@.+/.test(v) || 'Email address must be valid';
  },
];

export const passwordRules = [
  v => !!v || 'Password is required',
];

export const passwordExtRules = [
  v => !!v || 'Password is required',
  v => !!v && v.length >= PASS_LENGTH ? true : 'Password length must be at least 6 characters in length.',
];

export const fnameRules = [
  v => {
    return !!v || 'First name is required';
  },
];

export const lnameRules = [
  v => {
    return !!v || 'Last name is required';
  },
];

export const mobileRules = [
  v => {
    return !!v || 'Mobile No. is required';
  },
  v => /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v) || 'Mobile No. must be valid',
];

export const prcLicenseRules = [
  v => {
    return !!v || 'PRC License No. is required';
  },
];

export const ptrNumberRules = [
  v => {
    return !!v || 'PTR No. is required';
  },
];

export const professionsRules = [
  v => {
    return !!v || 'Please indicate your profession(s)';
  },
];

export const specialtiesRules = [
  v => {
    return !!v || 'Please indicate your specialty(ies)';
  },
];

export const numberRules = [
  v => {
    return v >= 0 || 'Please input a valid number';
  },
];

export const percentageRules = [
  v => {
    return v <= 100 || 'Percentage should not exceed 100';
  },
  v => {
    return v > 0 || 'Percentage should be greater than 0';
  },
];

export default {
  genericFieldRules,
  emailRules,
  passwordRules,
  passwordExtRules,
  fnameRules,
  lnameRules,
  mobileRules,
  prcLicenseRules,
  ptrNumberRules,
  professionsRules,
  specialtiesRules,
  numberRules,
  validEmailRules,
  percentageRules,
};
