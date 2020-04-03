export const ORDER_TEST_STATUSES = [
  { name: 'All', status: 'all' },
  { name: 'Pending', status: 'pending' },
  { name: 'Completed', status: 'completed', languageSetting: 'diagnosticCompleted' },
  { name: 'Verified', status: 'verified', languageSetting: 'diagnosticVerified' },
  { name: 'Finalized', status: 'finalized', languageSetting: 'diagnosticFinalized' },
  { name: 'Sent Out', status: 'sent-out' },
  { name: 'Cancelled', status: 'cancelled' },
];

export const ORDER_TEST_ACTIONS = [
  { name: 'Complete', action: 'complete', languageSetting: 'diagnosticComplete' },
  { name: 'Verify', action: 'verify', languageSetting: 'diagnosticVerify' },
  { name: 'Finalize', action: 'finalize', languageSetting: 'diagnosticFinalize' },
];

export const STATUS_QUERY_MAP = {
  all: {},
  pending: {
    cancelledAt: { $exists: false },
    completedAt: { $exists: false },
    verifiedAt: { $exists: false },
    finalizedAt: { $exists: false },
    sentOutAt: { $exists: false },
  },
  completed: {
    cancelledAt: { $exists: false },
    completedAt: { $exists: true },
    verifiedAt: { $exists: false },
    finalizedAt: { $exists: false },
  },
  verified: {
    cancelledAt: { $exists: false },
    verifiedAt: { $exists: true },
    finalizedAt: { $exists: false },
  },
  finalized: {
    cancelledAt: { $exists: false },
    finalizedAt: { $exists: true },
  },
  'sent-out': {
    cancelledAt: { $exists: false },
    completedAt: { $exists: false },
    finalizedAt: { $exists: false },
    sentOutAt: { $exists: true },
  },
  cancelled: {
    cancelledAt: { $exists: true },
  },
};

export const STATUS_COLOR_MAP = {
  pending: '#ff4081',
  completed: '#0099cc',
  verified: '#0099cc',
  finalized: '#90b94e',
  sentOut: '',
  cancelled: 'error',
};

export const TAGS_COLOR_MAP = {
  vip: '#ff4081',
  seniorCitizen: '#0099cc',
};

export const LAB_ROLES = ['lab_tech', 'lab_qc', 'lab_head'];

export const PATHOLOGIST_ROLES = ['doctor_pathologist'];

export const LIS_COMPLETE_ROLES = [...LAB_ROLES, ...PATHOLOGIST_ROLES];

export const LIS_VERIFY_ROLES = ['lab_qc', 'lab_head', 'doctor_pathologist'];

export const LIS_FINALIZE_ROLES = LIS_VERIFY_ROLES;

export const LIS_CANCEL_ROLES = [...LAB_ROLES, ...PATHOLOGIST_ROLES];

export const LIS_ALLOWABLE_ROLES = [
  ...LAB_ROLES,
  ...PATHOLOGIST_ROLES,
  ...LIS_FINALIZE_ROLES,
];

export const LIS_ORDER_TEST_MODEL_MAPPINGS = [
  { from: 'specimen' },
  { from: 'specimenCollectedAt' },
  { from: 'specimenHarvestMethod' },
  { from: 'specimenNote' },
  { from: 'technician' },
  { from: 'pathologist' },
  { from: 'remarks' },
  { from: 'estimatedReleaseAt' },
];

export const LIS_MODEL_ORDER_TEST_MAPPINGS = [
  { from: 'specimen' },
  { from: 'specimenCollectedAt', skipEmpty: true },
  { from: 'specimenHarvestMethod' },
  { from: 'specimenNote' },
  { from: 'technician.uid', to: 'technician' },
  { from: 'pathologist.uid', to: 'pathologist' },
  { from: 'remarks' },
  { from: 'estimatedReleaseAt' },
];

export const IMAGING_ROLES = ['imaging_tech', 'imaging_qc', 'imaging_head'];

export const RADIOLOGIST_ROLES = ['doctor_radiologist'];
export const SONOLOGIST_ROLES = ['doctor_sonologist'];
export const CARDIOLOGIST_ROLES = ['doctor_cardiologist'];

export const IMAGING_DOCTOR_ROLES = [
  ...RADIOLOGIST_ROLES,
  ...SONOLOGIST_ROLES,
  ...CARDIOLOGIST_ROLES,
];

export const RIS_COMPLETE_ROLES = [...IMAGING_ROLES, ...IMAGING_DOCTOR_ROLES];

export const RIS_VERIFY_ROLES = [
  'imaging_qc',
  'imaging_head',
  ...IMAGING_DOCTOR_ROLES,
];

export const RIS_FINALIZE_ROLES = RIS_VERIFY_ROLES;

export const RIS_CANCEL_ROLES = [...IMAGING_ROLES, ...IMAGING_DOCTOR_ROLES];

export const RIS_ALLOWABLE_ROLES = [
  ...IMAGING_ROLES,
  ...RIS_VERIFY_ROLES,
];

export const RIS_ORDER_TEST_MODEL_MAPPINGS = [
  { from: 'specimen' },
  { from: 'specimenCollectedAt' },
  { from: 'specimenHarvestMethod' },
  { from: 'technician' },
  { from: 'radiologist' },
  { from: 'sonologist' },
  { from: 'cardiologist' },
  { from: 'remarks' },
  { from: 'estimatedReleaseAt' },
];

export const RIS_MODEL_ORDER_TEST_MAPPINGS = [
  { from: 'specimen' },
  { from: 'specimenCollectedAt', skipEmpty: true },
  { from: 'specimenHarvestMethod' },
  { from: 'technician.uid', to: 'technician' },
  { from: 'radiologist.uid', to: 'radiologist' },
  { from: 'sonologist.uid', to: 'sonologist' },
  { from: 'cardiologist.uid', to: 'cardiologist' },
  { from: 'remarks' },
  { from: 'estimatedReleaseAt' },
];

export const BREAKDOWN_ERROR = 0.0001;
