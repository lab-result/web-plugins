import _ from 'lodash';

export const FILTER_QUERY_BUILDER_MAP = {
  all: () => ({}),
  male: () => ({ sex: 'male' }),
  female: () => ({ sex: 'female' }),
  tag: ({ tag }) => ({ tags: tag }),
};

export const IMPORT_HEADERS = [
  'firstName',
  'lastName',
  'middleName',
  'dateOfBirth',
  'sex',
  'mobileNo',
  'street1',
];

const fuzzySexMatch = sex => {
  switch (_.lowerCase(sex)) {
    case 'male':
      // fall through
    case 'm':
      return 'male';
    case 'female':
      // fall through
    case 'f':
      return 'female';
    default:
      return null;
  }
};
export const IMPORT_PATIENT_MAPPINGS = [
  { from: 'firstName', to: 'name.firstName' },
  { from: 'middleName', to: 'name.middleName' },
  { from: 'lastName', to: 'name.lastName' },
  { from: 'dateOfBirth' },
  { from: 'sex', format: fuzzySexMatch },
  { from: 'mobileNo', format: m => `${m}` },
  { from: 'street1', to: 'address.street1' },
];

export const PATIENT_FIELDS = {
  last_name: { edittable: false, enabled: true, required: true },
  first_name: { edittable: false, enabled: true, required: true },
  middle_name: { enabled: true },
  suffix: { enabled: true },
  sex: { enabled: true, required: true, edittable: false },
  date_of_birth: { enabled: true, required: true },
  blood_type: { enabled: true },
  marital_status: { enabled: true },
  mobile_num: { enabled: true },
  add_line_1: { enabled: true },
  add_line_2: { enabled: true },
  add_city: { enabled: true },
  add_province: { enabled: true },
  add_country: { enabled: true },
  tagging: { enabled: true },
  hmo: { enabled: true },
  company_partners: { enabled: true },
  cont_home_num: { enabled: true },
  cont_work_num: { enabled: true },
  cont_emergency_num: { enabled: true },
  work_company: { enabled: true },
  work_position: { enabled: true },
  work_address: { enabled: true },
  emergency_person: { enabled: true },
  emergency_contact_num: { enabled: true },
  emergency_relationship: { enabled: true },
  fathers_name: { enabled: true },
  fathers_contact_num: { enabled: true },
  fathers_religion: { enabled: true },
  fathers_nationality: { enabled: true },
  mothers_name: { enabled: true },
  mothers_contact_num: { enabled: true },
  mothers_religion: { enabled: true },
  mothers_nationality: { enabled: true },
  additional_note: { enabled: true },
};

export const ACTIVE_ENCOUNTER_STATUSES = [
  { text: 'All', value: '' },
  { text: 'Not Paid', value: 'not paid' },
  { text: 'Fully Paid', value: 'fully paid' },
  { text: 'Partially Paid', value: 'partially paid' },
  { text: 'Covered', value: 'covered' },
];

export const STAFF_ROLES = [
  'nurse',
  'nurse_head',
  'therapist',
  'lab_tech',
  'lab_head',
  'imaging_tech',
  'imaging_qc',
  'imaging_head',
];

export const DOCTOR_ROLES = [
  'doctor',
  'doctor_pathologist',
  'doctor_radiologist',
  'doctor_sonologist',
  'doctor_cardiologist',
  'doctor_pme',
];
