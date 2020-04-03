import { format } from 'date-fns';
import { isEmpty, uniqBy } from './collection';
import {
  guard,
  prettifyNameFirst,
  middleInitalInjector,
  prettifyAddress,
} from './string';
import {
  getAttendingDoctor,
  formatAttendingDoctorName,
  formatAttendingDoctorPRCNo,
  formatAttendingDoctorPTRNo,
  formatAttendingDoctorESig,
  fuzzySexMatch,
  fuzzyMaritalStatusMatch,
  calculateAge,
  getRecords,
  formatPatientHMO,
  formatPatientHMOCardNo,
  formatPatientHMOValidityDate,
  formatPatientHMOExpiryDate,
  formatPatientHMOStatus,
  formatPatientCompanies,
  formatPatientCompaniesCardNo,
  formatPatientDisplayPicture,
  formatSocialHistory,
  formatSocialHxPackYears,
  formatBirthHistory,
  formatGynecologicHistory,
  formatHospitalizationHistory,
  formatMenstrualHistory,
  formatObstestricHistory,
  formatSurgicalHistory,
  formatDentalHistory,
  formatROS,
  formatPE,
  calcBMI,
  getLbUtil,
  getFtUtil,
  formatVitals,
  formatENTNote,
  formatOBNote,
  formatPrescription,
  formatDiagnosticOrder,
  formatDentalNote,
  formatClinicLogo,
  formatClinicBanner,
  formatDentalNoteTable,
} from './fusion.mappers';

const DOCTOR_ROLES = [
  'doctor',
  'doctor_pathologist',
  'doctor_radiologist',
  'doctor_sonologist',
  'doctor_cardiologist',
  'doctor_pme',
];

export const VERSION = '2.0.0';

export const getWordsBetweenCurlies = (str) => {
  const results = [];
  const re = /{([^}]+)}/g;
  let text;
  do {
    text = re.exec(str);
    if (text) results.push(text[1]);
  } while (text);

  return results;
};

export const mapPrefillData = ({ patient, encounter, medRecords, currentUser, doctors, clinic }) => {
  return { patient, encounter, medRecords, currentUser, doctors, clinic };
};

export const prefillData = ({ orgMembers, patient, encounter, medRecords, currentUser, clinic }) => {
  const members = orgMembers;
  const recordCreators = [
    ...new Set((medRecords || [])
      .map(r => r.createdBy)
      .filter(Boolean)),
  ];
  const allDoctors = recordCreators
    .map(r => members?.find(m => m.uid === r || m.id === r))
    .filter(Boolean)
    .filter(m => m.roles && DOCTOR_ROLES.some(dr => m.roles.some(mr => mr === dr)));
  const uniqAllDoctors = uniqBy(allDoctors, 'uid');

  const recordCreatorMemberships = (medRecords || [])
    .map(r => r?.$populated?.createdByMembership || r?.createdByMembership)
    .filter(Boolean)
    .filter(m => m.roles && DOCTOR_ROLES.some(dr => m.roles.some(mr => mr === dr)));
  const uniqRecordCreatorMemberships = uniqBy(recordCreatorMemberships, 'uid');

  const doctors = [
    ...(uniqAllDoctors || []),
    ...(uniqRecordCreatorMemberships || []),
  ].filter(Boolean);

  const data = { patient, encounter, medRecords, currentUser, clinic, doctors };
  return mapPrefillData(data);
};

/**
 * Data used for storing prefilled answers to the tokens.
 * @typedef {Object} PrefillData
 * @property {Object[]} orgMembers - Array of OrganizationMembers
 * @property {Object} patient - Patient's PersonalDetails
 * @property {Object} encounter - Patient's MedicalEncounter
 * @property {Object[]} medRecords - Patient's MedicalRecord
 * @property {Object} currentUser - Logged In User PersonalDetails
 * @property {Object} clinic - Organization
 */

/**
 * A callback on how a token prefill answer.
 * @callback format
 * @param {PrefillData} d
 */

/**
 * A callback on how anonymized token prefill answer
 * @callback anonymityRefAnswerFormatter
 * @param {PrefillData} d
 */

/**
 * A callback on how anonymized token prefill anonymizedAnswer
 * @callback anonymityDisplayFormatter
 * @param {PrefillData} d
 */

/**
 * Fusion token schema
 * @typedef {Object} Token
 * @property {string} name - display name of the token
 * @property {string} val - token value
 * @property {string} suggestion - suggested value derrived from format()
 * @property {string} answer - token's formatted answer
 * @property {string} anonymizedDisplay - anonymized token formatted answer
 * @property {boolean} anonymized - flag for enabling protection of PII by embedding reference only.
 * @property {boolean} editableAnonymizedAnswer - flag for enabling editing of anonymized answer.
 * @property {format} format
 * @property {function} anonymityRefAnswerFormatter
 * @property {function} anonymityDisplayFormatter
 */

export const TEMPLATE_PREFILLS = [
  {
    name: 'Clinic Name',
    val: 'clinic_name',
    format: (d) => d?.clinic?.name,
  },
  {
    name: 'Clinic Address',
    val: 'clinic_address',
    format: (d) => prettifyAddress(d?.clinic?.address),
  },
  {
    name: 'Clinic Email',
    val: 'clinic_email',
    format: (d) => {
      const emails = [
        ...d?.clinic?.emails || [],
        ...[d?.clinic?.email],
      ];
      return emails.filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Clinic Phone',
    val: 'clinic_phone',
    format: (d) => {
      const phones = [
        ...d?.clinic?.phones || [],
        ...[d?.clinic?.phone],
      ];
      return phones.filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Clinic Website',
    val: 'clinic_website',
    format: (d) => d?.clinic?.website,
  },
  {
    name: 'Clinic Logo',
    val: 'clinic_logo',
    format: (d) => formatClinicLogo(d?.clinic),
  },
  {
    name: 'Clinic Logo - Large',
    val: 'clinic_lg_logo',
    format: (d) => formatClinicLogo(d?.clinic, '100', '100'),
  },
  {
    name: 'Clinic Logo - X-Large',
    val: 'clinic_xl_logo',
    format: (d) => formatClinicLogo(d?.clinic, '125', '125'),
  },
  {
    name: 'Clinic Logo - Full-Width',
    val: 'clinic_full_width_logo',
    format: (d) => formatClinicLogo(d?.clinic, '100%', 'na'),
  },
  {
    name: 'Clinic Banner',
    val: 'clinic_banner',
    format: (d) => formatClinicBanner(d?.clinic, '100%', 'na'),
  },
  {
    name: 'Logged In User - Name',
    val: 'doctor_name',
    anonymized: true,
    format: (d) => prettifyNameFirst(middleInitalInjector(d?.currentUser?.name)),
    anonymityRefAnswerFormatter: (d) => d?.currentUser?.uid || d?.currentUser?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous && prettifyNameFirst(middleInitalInjector(anonymous?.name));
    },
  },
  {
    name: 'Logged In User - PRC License No.',
    val: 'doctor_doc_prc',
    anonymized: true,
    format: (d) => d?.currentUser?.['doc_PRCLicenseNo'] || d?.currentUser?.PRCLicenseNo,
    anonymityRefAnswerFormatter: (d) => d?.currentUser?.uid || d?.currentUser?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.['doc_PRCLicenseNo'] || anonymous?.PRCLicenseNo;
    },
  },
  {
    name: 'Logged In User - PTR No.',
    val: 'doctor_doc_ptr',
    anonymized: true,
    format: (d) => d?.currentUser?.['doc_PTRNumber'],
    anonymityRefAnswerFormatter: (d) => d?.currentUser?.uid || d?.currentUser?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.['doc_PTRNumber'];
    },
  },
  {
    name: 'Logged In User - E Signature',
    val: 'doctor_doc_esig',
    anonymized: true,
    format: (d) => {
      const base64 = d?.doctor?.['doc_eSignatureDataURI'];
      const url = base64 || d?.doctor?.['doc_eSignatureURL'];
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.setAttribute('height', '75');
        return img.outerHTML;
      }
      return null;
    },
    anonymityRefAnswerFormatter: (d) => d?.currentUser?.uid || d?.currentUser?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      const url = anonymous?.['doc_eSignatureURL'];
      if (!url) return null;
      const img = document.createElement('img');
      img.src = url;
      img.setAttribute('height', '75');
      return img.outerHTML;
    },
  },
  {
    name: 'Attending Doctor',
    val: 'attending_doc_name',
    anonymized: true,
    editableAnonymizedAnswer: true,
    format: (d) => formatAttendingDoctorName(d?.doctors),
    anonymityRefAnswerFormatter: (d) => {
      const doctor = getAttendingDoctor(d?.doctors);
      return doctor?.uid || doctor?.id;
    },
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous && prettifyNameFirst(middleInitalInjector(anonymous?.name));
    },
  },
  {
    name: 'Attending Doctor - PRC License No.',
    val: 'attending_doc_prc',
    anonymized: true,
    editableAnonymizedAnswer: true,
    format: (d) => formatAttendingDoctorPRCNo(d?.doctors),
    anonymityRefAnswerFormatter: (d) => {
      const doctor = getAttendingDoctor(d?.doctors);
      return doctor?.uid || doctor?.id;
    },
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.['doc_PRCLicenseNo'] || anonymous?.PRCLicenseNo;
    },
  },
  {
    name: 'Attending Doctor - PTR No.',
    val: 'attending_doc_ptr',
    anonymized: true,
    editableAnonymizedAnswer: true,
    format: (d) => formatAttendingDoctorPTRNo(d?.doctors),
    anonymityRefAnswerFormatter: (d) => {
      const doctor = getAttendingDoctor(d?.doctors);
      return doctor?.uid || doctor?.id;
    },
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.['doc_PTRNumber'];
    },
  },
  {
    name: 'Attending Doctor - E Signature.',
    val: 'attending_doc_esig',
    anonymized: true,
    editableAnonymizedAnswer: true,
    format: (d) => formatAttendingDoctorESig(d?.doctors),
    anonymityRefAnswerFormatter: (d) => {
      const doctor = getAttendingDoctor(d?.doctors);
      return doctor?.uid || doctor?.id;
    },
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      const url = anonymous?.['doc_eSignatureURL'];
      if (!url) return null;
      const img = document.createElement('img');
      img.src = url;
      img.setAttribute('height', '75');
      return img.outerHTML;
    },
  },
  {
    name: 'Date Today',
    val: 'today',
    format: (d) => { return format(new Date(), 'MMMM DD, YYYY'); },
  },
  {
    name: 'Date Today Plus',
    val: 'now_plus',
    format: (d) => { return format(new Date(), 'MMMM DD, YYYY'); },
  },
  { name: 'Date', val: 'date' },
  {
    name: 'Patient Full Name (First Name Middle Initial Last Name)',
    val: 'patient_name',
    anonymized: true,
    format: (d) => prettifyNameFirst(middleInitalInjector(d?.patient?.name)),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous && prettifyNameFirst(middleInitalInjector(anonymous?.name));
    },
  },
  {
    name: 'Patient Full Name (First Name Middle Name Last Name)',
    val: 'patient_full_name_mid_name',
    anonymized: true,
    format: (d) => prettifyNameFirst(middleInitalInjector(d?.patient?.name, false)),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous && prettifyNameFirst(middleInitalInjector(anonymous?.name, false));
    },
  },
  {
    name: 'Patient First Name',
    val: 'patient_first_name',
    anonymized: true,
    format: (d) => d?.patient?.name?.firstName,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.firstName;
    },
  },
  {
    name: 'Patient Middle Name',
    val: 'patient_middle_name',
    anonymized: true,
    format: (d) => d?.patient?.name?.middleName,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.middleName;
    },
  },
  {
    name: 'Patient Last Name',
    val: 'patient_last_name',
    anonymized: true,
    format: (d) => d?.patient?.name?.lastName,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.lastName;
    },
  },
  {
    name: 'Patient Sex',
    val: 'patient_sex',
    anonymized: true,
    format: (d) => fuzzySexMatch(d?.patient?.sex),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return fuzzySexMatch(anonymous?.sex);
    },
  },
  {
    name: 'Patient Date of Birth',
    val: 'patient_dob',
    anonymized: true,
    format: (d) => d?.patient?.dateOfBirth
      ? format(d?.patient?.dateOfBirth, 'MMMM D, YYYY')
      : null,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.dateOfBirth
        ? format(anonymous?.dateOfBirth, 'MMMM D, YYYY')
        : null;
    },
  },
  {
    name: 'Patient Age',
    val: 'patient_age',
    anonymized: true,
    format: (d) => d?.patient?.dateOfBirth
      ? (calculateAge(d?.patient?.dateOfBirth, d?.encounter?.createdAt || new Date()) + '')
      : null,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token, dateOfRecord = new Date()) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.dateOfBirth
        ? calculateAge(anonymous?.dateOfBirth, dateOfRecord) + ''
        : null;
    },
  },
  {
    name: 'Patient Blood Type',
    val: 'patient_blood_type',
    anonymized: true,
    format: (d) => d?.patient?.bloodType,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.bloodType;
    },
  },
  {
    name: 'Patient Mobile No.',
    val: 'patient_mobile_no',
    anonymized: true,
    format: (d) => d?.patient?.mobileNo,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.mobileNo;
    },
  },
  {
    name: 'Patient Marital Status',
    val: 'patient_marital_status',
    anonymized: true,
    format: (d) => fuzzyMaritalStatusMatch(d?.patient?.maritalStatus),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.maritalStatus;
    },
  },
  {
    name: 'Patient Address',
    val: 'patient_full_address',
    anonymized: true,
    format: (d) => prettifyAddress(d?.patient?.address),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return prettifyAddress(anonymous?.address);
    },
  },
  {
    name: 'Patient OSCA Id',
    val: 'patient_osca_id',
    anonymized: true,
    format: (d) => d?.patient?.OSCASeniorCitizenId,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.OSCASeniorCitizenId;
    },
  },
  {
    name: 'Patient PWD Id',
    val: 'patient_pwd_id',
    anonymized: true,
    format: (d) => d?.patient?.PWDId,
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return anonymous?.PWDId;
    },
  },
  {
    name: 'Patient HMO',
    val: 'patient_hmos',
    anonymized: true,
    format: (d) => formatPatientHMO(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientHMO(anonymous);
    },
  },
  {
    name: 'Patient HMO Account No.',
    val: 'patient_hmo_accountno',
    anonymized: true,
    format: (d) => formatPatientHMOCardNo(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientHMOCardNo(anonymous);
    },
  },
  {
    name: 'Patient HMO Account Validity Date',
    val: 'patient_hmo_validity',
    anonymized: true,
    format: (d) => formatPatientHMOValidityDate(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientHMOValidityDate(anonymous);
    },
  },
  {
    name: 'Patient HMO Account Expiry Date',
    val: 'patient_hmo_expiry',
    anonymized: true,
    format: (d) => formatPatientHMOExpiryDate(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientHMOExpiryDate(anonymous);
    },
  },
  {
    name: 'Patient HMO Account Status',
    val: 'patient_hmo_status',
    anonymized: true,
    format: (d) => formatPatientHMOStatus(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientHMOStatus(anonymous);
    },
  },
  {
    name: 'Patient Company',
    val: 'patient_companies',
    anonymized: true,
    format: (d) => formatPatientCompanies(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientCompanies(anonymous);
    },
  },
  {
    name: 'Patient Company Account No.',
    val: 'patient_company_accountno',
    anonymized: true,
    format: (d) => formatPatientCompaniesCardNo(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientCompaniesCardNo(anonymous);
    },
  },
  {
    name: 'Patient Display Picture',
    val: 'patient_dp',
    anonymized: true,
    format: (d) => formatPatientDisplayPicture(d?.patient),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientDisplayPicture(anonymous);
    },
  },
  {
    name: 'Patient Display Picture - Large',
    val: 'patient_lg_dp',
    anonymized: true,
    format: (d) => formatPatientDisplayPicture(d?.patient, '100', '100'),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientDisplayPicture(anonymous, '100', '100');
    },
  },
  {
    name: 'Patient Display Picture - X-Large',
    val: 'patient_xl_dp',
    anonymized: true,
    format: (d) => formatPatientDisplayPicture(d?.patient, '125', '125'),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientDisplayPicture(anonymous, '125', '125');
    },
  },
  {
    name: 'Patient Display Picture - Full Width',
    val: 'patient_full_width_dp',
    anonymized: true,
    format: (d) => formatPatientDisplayPicture(d?.patient, '100%', 'na'),
    anonymityRefAnswerFormatter: (d) => d?.patient?.id,
    anonymityDisplayFormatter: (anonymousData, token) => {
      if (isEmpty(anonymousData) || isEmpty(token?.answer)) return null;
      const anonymous = anonymousData?.find(d => d.id === token.answer);
      return formatPatientDisplayPicture(anonymous, '100%', 'na');
    },
  },
  {
    name: 'Date of Visit',
    val: 'patient_encounter_created_at',
    format: (d) => {
      return d?.encounter?.createdAt
        ? format(d.encounter.createdAt, 'MMMM D, YYYY')
        : '';
    },
  },
  {
    name: 'Chief Complaint',
    val: 'patient_complaint',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'chief-complaint');
      return recs.map(r => r.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'HPI',
    val: 'patient_hpi',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'hpi');
      return recs.map(r => r.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Past Medical History',
    val: 'patient_pmhx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'medical-history');
      return recs.map(r => guard`${r.medicalCondition}: ${r.notes}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Family History',
    val: 'patient_fhx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'family-history');
      return recs.map(r => guard`${r.medicalCondition} - ${r.relationship}: ${r.notes}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Social History',
    val: 'patient_shx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      return recs.map(formatSocialHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Social History - Exercising?',
    val: 'sh_is_exercising',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.smoking ? 'YES' : 'NO').join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.exercises ? 'YES' : 'NO';
    },
  },
  {
    name: 'Social History - Smoking?',
    val: 'sh_is_smoking',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.smoking ? 'YES' : 'NO').join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.smoking ? 'YES' : 'NO';
    },
  },
  {
    name: 'Social History - Sticks per day',
    val: 'sh_smoking_sticks_per_day',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.smokingSticksPerDay).join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.smokingSticksPerDay;
    },
  },
  {
    name: 'Social History - Smoking pack-years',
    val: 'sh_smoking_pack_years',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      if (recs.length === 0) return '';
      return formatSocialHxPackYears(recs?.[recs.length - 1]);
    },
  },
  {
    name: 'Social History - Drinking?',
    val: 'sh_is_drinking',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.drinksAlcohol ? 'YES' : 'NO').join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.drinksAlcohol ? 'YES' : 'NO';
    },
  },
  {
    name: 'Social History - Drinking Remarks',
    val: 'sh_drinking_remarks',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec?.drinksAlcoholRemarks || '';
    },
  },
  {
    name: 'Social History - Using prohibited drugs?',
    val: 'sh_is_using_drugs',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.usesProhibitedDrugs ? 'YES' : 'NO').join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.usesProhibitedDrugs ? 'YES' : 'NO';
    },
  },
  {
    name: 'Social History - Prohibited drugs',
    val: 'sh_prohibited_drugs',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'social-history');
      // return recs.map(r => r.drugName).join(', ');
      const rec = recs?.[recs.length - 1];
      if (isEmpty(rec)) return '';
      return rec.drugNamej;
    },
  },
  {
    name: 'Allergies History',
    val: 'patient_allergies_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'allergy');
      return recs.map(r => guard`${r.name}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Allergies History - Allergy',
    val: 'patient_allergy_name',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'allergy');
      return recs.map(r => guard`${r.name}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Allergies History - Supplement',
    val: 'patient_allergy_supplement',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'allergy');
      return recs.map(r => guard`${r.supplement}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Birth History',
    val: 'patient_birth_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'birth-history');
      return recs.map(formatBirthHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Gynecological History',
    val: 'patient_gynecological_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'gynecological-history');
      return recs.map(formatGynecologicHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Hospitalization History',
    val: 'patient_hospitalization_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'hospitalization-history');
      return recs.map(formatHospitalizationHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Vaccination',
    val: 'patient_vaccination_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vaccination');
      return recs.map(r => guard`${r.vaccine}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History',
    val: 'patient_menstrual_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(formatMenstrualHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History - LMP',
    val: 'patient_menstrual_lmp',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(r => guard`${r.LMP}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History - Interval',
    val: 'patient_menstrual_interval',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(r => guard`${r.interval}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History - Duration',
    val: 'patient_menstrual_duration',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(r => guard`${r.duration}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History - Cycle',
    val: 'patient_menstrual_cycle',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(r => guard`${r.cycle}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Menstrual History - OB Score',
    val: 'patient_menstrual_obscore',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'menstrual-history');
      return recs.map(r => guard`${r.OBScore}`).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Obstetric History',
    val: 'patient_obstetric_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'obstetric-history');
      return recs.map(formatObstestricHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Surgical History',
    val: 'patient_surgical_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'surgical-history');
      return recs.map(formatSurgicalHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Dental History',
    val: 'patient_dental_hx',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'dental-history');
      return recs.map(formatDentalHistory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems',
    val: 'patient_ros',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(formatROS).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - General Status',
    val: 'ros_status_general',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.generalStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - General Remarks',
    val: 'ros_general',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.general).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Eyes Status',
    val: 'ros_status_eyes',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.eyesStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Eyes Remarks',
    val: 'ros_eyes',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.eyes).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Skin Status',
    val: 'ros_status_skin',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.skinStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Skin Remarks',
    val: 'ros_skin',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.skin).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - HEENT Status',
    val: 'ros_status_ent',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.entStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - HEENT Remarks',
    val: 'ros_ent',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.ent).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Neck Status',
    val: 'ros_status_neck',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.neckStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Neck Remarks',
    val: 'ros_neck',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.neck).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Chest/Breast Status',
    val: 'ros_status_breasts',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.breastsStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Chest/Breast Remarks',
    val: 'ros_breasts',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.breasts).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Respiratory/Lungs Status',
    val: 'ros_status_respiratory',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.respiratoryStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Respiratory/Lungs Remarks',
    val: 'ros_respiratory',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.respiratory).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Heart Status',
    val: 'ros_status_cardiovascular',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.cardiovascularStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Heart Remarks',
    val: 'ros_cardiovascular',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.cardiovascular).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Gastrointestinal/Abdomen Status',
    val: 'ros_status_gastrointestinal',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.gastrointestinalStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Gastrointestinal/Abdomen Remarks',
    val: 'ros_gastrointestinal',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.gastrointestinal).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Peripheral Vascular Status',
    val: 'ros_status_peripheral_vascular',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.peripheralVascularStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Peripheral Vascular Remarks',
    val: 'ros_peripheral_vascular',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.peripheralVascular).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Genitourinary Status',
    val: 'ros_status_genitourinary',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.genitourinaryStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Genitourinary Remarks',
    val: 'ros_genitourinary',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.genitourinary).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Musculoskeletal Status',
    val: 'ros_status_musculoskeletal',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.musculoskeletalStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Musculoskeletal Remarks',
    val: 'ros_musculoskeletal',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.musculoskeletal).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Psychiatric Status',
    val: 'ros_status_psychiatric',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.psychiatricStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Psychiatric Remarks',
    val: 'ros_psychiatric',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.psychiatric).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Neurologic Status',
    val: 'ros_status_neurologic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.neurologicStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Neurologic Remarks',
    val: 'ros_neurologic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.neurologic).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Hematologic Status',
    val: 'ros_status_hematologic_lymphatic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.hematologicLymphaticStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Hematologic Remarks',
    val: 'ros_hematologic_lymphatic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.hematologicLymphatic).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Endocrine Status',
    val: 'ros_status_endocrine',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.endocrineStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Endocrine Remarks',
    val: 'ros_endocrine',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.endocrine).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Allergic Immunologic Status',
    val: 'ros_status_allergic_immunologic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => (r.allergicImmunologicStatus || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Review of Systems - Allergic Immunologic Remarks',
    val: 'ros_allergic_immunologic',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ros');
      return recs.map(r => r.allergicImmunologic).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Vitals',
    val: 'patient_vitals',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(formatVitals).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Vitals - Height (cm)',
    val: 'vital_height',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.height}`).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Height (ft)',
    val: 'vital_ht_ft',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.height ? getFtUtil(r.height) : ''}`).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Weight (kg)',
    val: 'vital_weight',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.weight}`).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Weight (lbs)',
    val: 'vital_wt_lbs',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.weight ? getLbUtil(r.weight) : ''}`).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - BMI',
    val: 'vital_bmi',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.weight && r.height ? calcBMI(r.weight, r.height) : ''}`).join(', ');
    },
  },
  {
    name: 'Vitals - Pulse Rate',
    val: 'vital_pulse_rate',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.pulse}`).join(', ');
    },
  },
  {
    name: 'Vitals - Respiration Rate',
    val: 'vital_resp_rate',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.respiration}`).join(', ');
    },
  },
  {
    name: 'Vitals - Blood Pressure',
    val: 'vital_blood_pressure',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs
        .map(r => r.bpSystolic && r.bpDiastolic ? `${r.bpSystolic}/${r.bpDiastolic}` : '')
        .filter(r => !isEmpty(r))
        .join(', ');
    },
  },
  {
    name: 'Vitals - Temperature',
    val: 'vital_temperature',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => guard`${r.temperature}`).join(', ');
    },
  },
  {
    name: 'Vitals - Visual Acuity (L)',
    val: 'vital_visual_acuity_left',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => r.visualAcuityLeft).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Visual Acuity (R)',
    val: 'vital_visual_acuity_right',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => r.visualAcuityRight).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Visual Remarks',
    val: 'vital_visual_remarks',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => r.visualRemarks).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'Vitals - Color Vision',
    val: 'vital_color_vision',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'vitals');
      return recs.map(r => r.colorVision).filter(r => !isEmpty(r)).join(', ');
    },
  },
  {
    name: 'ENT Specialty Feature',
    val: 'patient_ent_note',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ent-note');
      return recs.map(formatENTNote).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'OB-GYN Specialty Feature',
    val: 'patient_ob_note',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'ob-note');
      return recs.map(formatOBNote).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam',
    val: 'patient_physical_exam',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(formatPE).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - General Status',
    val: 'pe_general_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.general?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - General Remarks',
    val: 'pe_general_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.general?.remarks).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Head Status',
    val: 'pe_head_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.head?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Head Remarks',
    val: 'pe_head_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.head?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Eyes Status',
    val: 'pe_eyes_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.eyes?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Eyes Remarks',
    val: 'pe_eyes_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.general?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Ears Status',
    val: 'pe_ears_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.ears?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Ears Remarks',
    val: 'pe_ears_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.ears?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Nose Status',
    val: 'pe_nose_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.nose?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Nose Remarks',
    val: 'pe_nose_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.nose?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Ears, Eyes, Nose Status',
    val: 'pe_earseyesnose_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...[(r?.nose?.status || '')],
            ...[(r?.ears?.status || '')],
            ...[(r?.eyes?.status || '')],
          ].filter(r => !isEmpty(r));

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) {
            return 'POSITIVE';
          } else if (statuses.filter(s => !isEmpty(s)).length > 0) {
            return 'NORMAL';
          } else {
            return '';
          }
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Ears, Eyes, Nose Remarks',
    val: 'pe_earseyesnose_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const ears = r?.ears?.text;
          const eyes = r?.eyes?.text;
          const nose = r?.nose?.text;

          return guard`${ears}; ${eyes}; ${nose}`;
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Head and Neck Status',
    val: 'pe_headneck_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...(r?.head?.status || ''),
            ...(r?.neck?.status || ''),
          ];

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) {
            return 'POSITIVE';
          } else if (statuses.filter(s => !isEmpty(s)).length > 0) {
            return 'NORMAL';
          } else {
            return '';
          }
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Head and Neck Remarks',
    val: 'pe_headneck_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const head = r?.head?.text;
          const neck = r?.neck?.text;

          return guard`${head}; ${neck}`;
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Chest and Breast Status',
    val: 'pe_chestbreast_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const statusDefaults = [
            { value: 'normal', name: 'Normal' },
            { value: 'positive', name: 'Positive', isPositive: true },
          ];
          const statuses = [
            ...(r?.breasts?.status || ''),
            ...(r?.chest?.status || ''),
          ];

          const hasPositive = statuses.findIndex(s =>
            statusDefaults.findIndex(sd => s === sd.value && sd.isPositive) > -1,
          ) > -1;

          if (hasPositive) {
            return 'POSITIVE';
          } else if (statuses.filter(s => !isEmpty(s)).length > 0) {
            return 'NORMAL';
          } else {
            return '';
          }
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Chest and Breast Remarks',
    val: 'pe_chestbreast_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam')
        .map(r => {
          const breasts = r?.breasts?.text;
          const chest = r?.chest?.text;

          return guard`${breasts}; ${chest}`;
        });
      return recs?.[recs.length - 1] || '';
    },
  },
  {
    name: 'Physical Exam - Neck Status',
    val: 'pe_neck_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.neck?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Neck Remarks',
    val: 'pe_neck_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.neck?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Throat Status',
    val: 'pe_throat_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.throat?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Throat Remarks',
    val: 'pe_throat_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.throat?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Breath sound Status',
    val: 'pe_breath_sounds_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.breathSounds?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Breath sound Remarks',
    val: 'pe_breath_sounds_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.breathSounds?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Respiratory Status',
    val: 'pe_respiratory_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.respiratory?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Respiratory Remarks',
    val: 'pe_respiratory_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.respiratory?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Cardiovascular Status',
    val: 'pe_cardiovascular_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.cardiovascular?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Cardiovascular Remarks',
    val: 'pe_cardiovascular_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.cardiovascular?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Breast Status',
    val: 'pe_breasts_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.breasts?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Breast Remarks',
    val: 'pe_breasts_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.breasts?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Chest Status',
    val: 'pe_chest_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.chest?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Chest Remarks',
    val: 'pe_chest_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.chest?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Back Remarks',
    val: 'pe_back_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.back?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Back Status',
    val: 'pe_back_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.back?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Abdomen Remarks',
    val: 'pe_abdomen_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.abdomen?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Abdomen Status',
    val: 'pe_abdomen_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.abdomen?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Gastrointestinal Remarks',
    val: 'pe_gastrointestinal_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.gastrointestinal?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Gastrointestinal Status',
    val: 'pe_gastrointestinal_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.gastrointestinal?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Genitourinary Remarks',
    val: 'pe_genitourinary_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.genitourinary?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Genitourinary Status',
    val: 'pe_genitourinary_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.genitourinary?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Musculoskeletal Remarks',
    val: 'pe_musculoskeletal_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.musculoskeletal?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Musculoskeletal Status',
    val: 'pe_musculoskeletal_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.musculoskeletal?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Skin Remarks',
    val: 'pe_skin_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.skin?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Skin Status',
    val: 'pe_skin_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.skin?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Endocrine Remarks',
    val: 'pe_endocrine_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.endocrine?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Endocrine Status',
    val: 'pe_endocrine_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.endocrine?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Psychiatric Remarks',
    val: 'pe_psychiatric_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.psychiatric?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Psychiatric Status',
    val: 'pe_psychiatric_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.psychiatric?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Hematologic Remarks',
    val: 'pe_hematologic_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.hematologicLymphatic?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Hematologic Status',
    val: 'pe_hematologic_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.hematologicLymphatic?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Allergic / Immunologic Remarks',
    val: 'pe_allergicImmunologic_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.allergicImmunologic?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Allergic / Immunologic Status',
    val: 'pe_allergicImmunologic_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.allergicImmunologic?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Extermities Remarks',
    val: 'pe_extermities_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.extermities?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Extermities Status',
    val: 'pe_extermities_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.extermities?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Neurologic Remarks',
    val: 'pe_neurologic_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.neurologic?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Neurologic Status',
    val: 'pe_neurologic_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.neurologic?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Rectal Remarks',
    val: 'pe_rectal_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.rectal?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Rectal Status',
    val: 'pe_rectal_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.rectal?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Genitalia Remarks',
    val: 'pe_genitalia_text',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => r?.genitalia?.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Physical Exam - Genitalia Status',
    val: 'pe_genitalia_status',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'physical-exam');
      return recs.map(r => (r?.genitalia?.status || '').toUpperCase()).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Impression',
    val: 'patient_impression',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'assessment', 'impression');
      return recs.map(r => r.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Diagnosis',
    val: 'patient_diagnosis',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'assessment', 'diagnosis');
      return recs.map(r => r.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Diagnosis - ICD 10 Code',
    val: 'diagnosis_icd10',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'assessment', 'diagnosis');
      return recs
        .map(r => {
          if (isEmpty(r.diagnosisCode) && isEmpty(r.icd10)) return null;
          const code = r.diagnosisCode || r.icd10;
          const text = r.diagnosisText;
          return guard`${code} - ${text}`;
        })
        .filter(r => !isEmpty(r))
        .join('<br>');
    },
  },
  {
    name: 'Care Plan Notes',
    val: 'patient_care_plan',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'care-plan');
      return recs.map(r => r.text).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Prescriptions',
    val: 'patient_medication_order',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'medication-order');
      return recs.map(formatPrescription).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Laboratory Order',
    val: 'patient_lab_order',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'lab-test-order');
      return recs.map(formatDiagnosticOrder).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Imaging Order',
    val: 'patient_imaging_order',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'imaging-test-order');
      return recs.map(formatDiagnosticOrder).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Procedure Orders',
    val: 'patient_medical_procedure_orders',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'medical-procedure-order');
      return recs.map(r => r.name).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Procedure',
    val: 'patient_medical_procedures',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'medical-procedure');
      return recs.map(r => r.name).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Dental Baseline',
    val: 'patient_dental_note_baseline',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'dental-note', 'baseline');
      return recs.map(formatDentalNote).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Dental Work Proposed',
    val: 'patient_dental_note_order',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'dental-note', 'order');
      return recs.map(formatDentalNote).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Dental Work Done',
    val: 'patient_dental_note_result',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'dental-note', 'result');
      return recs.map(formatDentalNote).filter(r => !isEmpty(r)).join('<br>');
    },
  },
  {
    name: 'Dental Work Done Table',
    val: 'dental_note_result_table',
    format: (d) => {
      const recs = getRecords((d || {}).medRecords || [], 'dental-note', 'result');
      const diagnoses = getRecords((d || {}).medRecords || [], 'assessment', 'diagnosis')
        .map(diagnosis => diagnosis.text);
      return formatDentalNoteTable(recs, diagnoses);
    },
  },
  { name: 'Custom Text', val: 'custom_text' },
  { name: 'Custom Dropdown', val: 'custom_choices' },
];

export const GROUPED_TEMPLATE_PREFILLS = [
  {
    name: 'General',
    type: 'group',
    tokens: [
      { token: 'clinic_name', name: 'Clinic Name' },
      { token: 'clinic_address', name: 'Clinic Address' },
      { token: 'clinic_email', name: 'Clinic Email' },
      { token: 'clinic_phone', name: 'Clinic Phone' },
      { token: 'clinic_website', name: 'Clinic Website' },
      { token: 'clinic_logo', name: 'Clinic Logo' },
      { token: 'clinic_lg_logo', name: 'Clinic Logo - Large' },
      { token: 'clinic_xl_logo', name: 'Clinic Logo - X-Large' },
      { token: 'clinic_full_width_logo', name: 'Clinic Logo - Full-Width' },
      { token: 'clinic_banner', name: 'Clinic Banner' },
      { token: 'doctor_name', name: 'Logged In User - Name' },
      { token: 'doctor_doc_prc', name: 'Logged In User - PRC License No.' },
      { token: 'doctor_doc_ptr', name: 'Logged In User - PTR No.' },
      { token: 'doctor_doc_esig', name: 'Logged In User - E Signature' },
      { token: 'attending_doc_name', name: 'Attending Doctor - Name' },
      { token: 'attending_doc_prc', name: 'Attending Doctor - PRC License No.' },
      { token: 'attending_doc_ptr', name: 'Attending Doctor - PTR No.' },
      { token: 'attending_doc_esig', name: 'Attending Doctor - E Signature.' },
      { token: 'today', name: 'Date Today' },
      { token: 'date', name: 'Input Date' },
    ],
  },
  {
    name: 'Patient Details',
    type: 'group',
    tokens: [
      { token: 'patient_name', name: 'Full Name (Middle Initial)' },
      { token: 'patient_full_name_mid_name', name: 'Full Name (Middle Name)' },
      { token: 'patient_sex', name: 'Sex' },
      { token: 'patient_age', name: 'Age' },
      { token: 'patient_first_name', name: 'First Name' },
      { token: 'patient_middle_name', name: 'Middle Name' },
      { token: 'patient_last_name', name: 'Last Name' },
      { token: 'patient_dob', name: 'Date of Birth' },
      { token: 'patient_blood_type', name: 'Blood Type' },
      { token: 'patient_mobile_no', name: 'Mobile No.' },
      { token: 'patient_marital_status', name: 'Marital Status' },
      { token: 'patient_full_address', name: 'Full Address' },
      { token: 'patient_osca_id', name: 'OSCA Id' },
      { token: 'patient_pwd_id', name: 'PWD Id' },
      { token: 'patient_hmos', name: 'HMO' },
      { token: 'patient_hmo_accountno', name: 'HMO Account No.' },
      { token: 'patient_hmo_validity', name: 'HMO Account Validity Date' },
      { token: 'patient_hmo_expiry', name: 'HMO Account Expiry Date' },
      { token: 'patient_hmo_status', name: 'HMO Account Status' },
      { token: 'patient_companies', name: 'Company' },
      { token: 'patient_company_accountno', name: 'Company Id/No.' },
      { token: 'patient_dp', name: 'Display Picture' },
      { token: 'patient_lg_dp', name: 'Display Picture - Large' },
      { token: 'patient_xl_dp', name: 'Display Picture - X-Large' },
      { token: 'patient_full_width_dp', name: 'Display Picture - Full-Width' },
    ],
  },
  {
    name: 'Patient Encounter',
    type: 'group',
    tokens: [
      { token: 'patient_encounter_created_at', name: 'Date of visit' },
    ],
  },
  {
    name: 'Patient Chart (Subjective)',
    type: 'group',
    tokens: [
      { token: 'patient_complaint', name: 'Chief Complaint' },
      { token: 'patient_hpi', name: 'HPI' },
      { token: 'patient_pmhx', name: 'Past Medical History' },
      { token: 'patient_fhx', name: 'Family History' },
      { token: 'patient_shx', name: 'Social History' },
      { token: 'sh_is_exercising', name: 'Social History - Exercising?' },
      { token: 'sh_is_smoking', name: 'Social History - Smoking?' },
      { token: 'sh_smoking_sticks_per_day', name: 'Social History - Sticks per day' },
      { token: 'sh_smoking_pack_years', name: 'Social History - Smoking pack-years' },
      { token: 'sh_is_drinking', name: 'Social History - Drinking?' },
      { token: 'sh_drinking_remarks', name: 'Social History - Drinking Remarks' },
      { token: 'sh_is_using_drugs', name: 'Social History - Using prohibited drugs?' },
      { token: 'sh_prohibited_drugs', name: 'Social History - Prohibited drugs' },
      { token: 'patient_allergies_hx', name: 'Allergies History' },
      { token: 'patient_allergy_name', name: 'Allergies History - Allergy' },
      { token: 'patient_allergy_supplement', name: 'Allergies History - Supplement' },
      { token: 'patient_birth_hx', name: 'Birth History' },
      { token: 'patient_gynecological_hx', name: 'Gynecological Histoy' },
      { token: 'patient_hospitalization_hx', name: 'Hospitalization History' },
      { token: 'patient_vaccination_hx', name: 'Vaccineation History' },
      { token: 'patient_menstrual_hx', name: 'Menstrual History' },
      { token: 'patient_menstrual_lmp', name: 'Menstrual History - LMP' },
      { token: 'patient_menstrual_interval', name: 'Menstrual History - Interval' },
      { token: 'patient_menstrual_duration', name: 'Menstrual History - Duration' },
      { token: 'patient_menstrual_cycle', name: 'Menstrual History - Cycle' },
      { token: 'patient_menstrual_obscore', name: 'Menstrual History - OB Score' },
      { token: 'patient_obstetric_hx', name: 'Obstetric History' },
      { token: 'patient_surgical_hx', name: 'Surgical History' },
      { token: 'patient_dental_hx', name: 'Dental History' },
    ],
  },
  {
    name: 'Patient Review of Systems',
    type: 'group',
    tokens: [
      { token: 'patient_ros', name: 'Summary' },
      { token: 'ros_status_general', name: 'General - Status' },
      { token: 'ros_general', name: 'General - Remarks' },
      { token: 'ros_status_eyes', name: 'Eyes - Status' },
      { token: 'ros_eyes', name: 'Eyes - Remarks' },
      { token: 'ros_status_skin', name: 'Skin - Status' },
      { token: 'ros_skin', name: 'Skin - Remarks' },
      { token: 'ros_status_ent', name: 'HEENT - Status' },
      { token: 'ros_ent', name: 'HEENT - Remarks' },
      { token: 'ros_status_neck', name: 'Neck - Status' },
      { token: 'ros_neck', name: 'Neck - Remarks' },
      { token: 'ros_status_breasts', name: 'Chest/Breast - Status' },
      { token: 'ros_breasts', name: 'Chest/Breast - Remarks' },
      { token: 'ros_status_respiratory', name: 'Respiratory/Lungs - Status' },
      { token: 'ros_respiratory', name: 'Respiratory/Lungs - Remarks' },
      { token: 'ros_status_cardiovascular', name: 'Heart - Status' },
      { token: 'ros_cardiovascular', name: 'Heart - Remarks' },
      { token: 'ros_status_gastrointestinal', name: 'Gastrointestinal/Abdomen - Status' },
      { token: 'ros_gastrointestinal', name: 'Gastrointestinal/Abdomen - Remarks' },
      { token: 'ros_status_peripheral_vascular', name: 'Peripheral Vascular - Status' },
      { token: 'ros_peripheral_vascular', name: 'Peripheral Vascular - Remarks' },
      { token: 'ros_status_genitourinary', name: 'Genitourinary - Status' },
      { token: 'ros_genitourinary', name: 'Genitourinary - Remarks' },
      { token: 'ros_status_musculoskeletal', name: 'Musculoskeletal - Status' },
      { token: 'ros_musculoskeletal', name: 'Musculoskeletal - Remarks' },
      { token: 'ros_status_psychiatric', name: 'Psychiatric - Status' },
      { token: 'ros_psychiatric', name: 'Psychiatric - Remarks' },
      { token: 'ros_status_neurologic', name: 'Neurologic - Status' },
      { token: 'ros_neurologic', name: 'Neurologic - Remarks' },
      { token: 'ros_status_hematologic_lymphatic', name: 'Hematologic - Status' },
      { token: 'ros_hematologic_lymphatic', name: 'Hematologic - Remarks' },
      { token: 'ros_status_endocrine', name: 'Endocrine - Status' },
      { token: 'ros_endocrine', name: 'Endocrine - Remarks' },
      { token: 'ros_status_allergic_immunologic', name: 'Allergic Immunologic - Status' },
      { token: 'ros_allergic_immunologic', name: 'Allergic Immunologic - Remarks' },
    ],
  },
  {
    name: 'Patient Physical Exam',
    type: 'group',
    tokens: [
      { name: 'General - Status', token: 'pe_general_status' },
      { name: 'General - Remarks', token: 'pe_general_text' },
      { name: 'Head - Status', token: 'pe_head_status' },
      { name: 'Head - Remarks', token: 'pe_head_text' },
      { name: 'Eyes - Status', token: 'pe_eyes_status' },
      { name: 'Eyes - Remarks', token: 'pe_eyes_text' },
      { name: 'Ears - Status', token: 'pe_ears_status' },
      { name: 'Ears - Remarks', token: 'pe_ears_text' },
      { name: 'Nose - Status', token: 'pe_nose_status' },
      { name: 'Nose - Remarks', token: 'pe_nose_text' },
      { name: 'Neck - Status', token: 'pe_neck_status' },
      { name: 'Neck - Remarks', token: 'pe_neck_text' },
      { name: 'Throat - Status', token: 'pe_throat_status' },
      { name: 'Throat - Remarks', token: 'pe_throat_text' },
      { name: 'Breath sound - Status', token: 'pe_breath_sounds_status' },
      { name: 'Breath sound - Remarks', token: 'pe_breath_sounds_text' },
      { name: 'Respiratory - Status', token: 'pe_respiratory_status' },
      { name: 'Respiratory - Remarks', token: 'pe_respiratory_text' },
      { name: 'Cardiovascular - Status', token: 'pe_cardiovascular_status' },
      { name: 'Cardiovascular - Remarks', token: 'pe_cardiovascular_text' },
      { name: 'Breast - Status', token: 'pe_breasts_status' },
      { name: 'Breast - Remarks', token: 'pe_breasts_text' },
      { name: 'Chest - Status', token: 'pe_chest_status' },
      { name: 'Chest - Remarks', token: 'pe_chest_text' },
      { name: 'Back - Status', token: 'pe_back_status' },
      { name: 'Back - Remarks', token: 'pe_back_text' },
      { name: 'Abdomen - Status', token: 'pe_abdomen_status' },
      { name: 'Abdomen - Remarks', token: 'pe_abdomen_text' },
      { name: 'Gastrointestinal - Status', token: 'pe_gastrointestinal_status' },
      { name: 'Gastrointestinal - Remarks', token: 'pe_gastrointestinal_text' },
      { name: 'Genitourinary - Status', token: 'pe_genitourinary_status' },
      { name: 'Genitourinary - Remarks', token: 'pe_genitourinary_text' },
      { name: 'Musculoskeletal - Status', token: 'pe_musculoskeletal_status' },
      { name: 'Musculoskeletal - Remarks', token: 'pe_musculoskeletal_text' },
      { name: 'Skin - Status', token: 'pe_skin_status' },
      { name: 'Skin - Remarks', token: 'pe_skin_text' },
      { name: 'Endocrine - Status', token: 'pe_endocrine_status' },
      { name: 'Endocrine - Remarks', token: 'pe_endocrine_text' },
      { name: 'Psychiatric - Status', token: 'pe_psychiatric_status' },
      { name: 'Psychiatric - Remarks', token: 'pe_psychiatric_text' },
      { name: 'Hematologic - Status', token: 'pe_hematologic_status' },
      { name: 'Hematologic - Remarks', token: 'pe_hematologic_text' },
      { name: 'Allergic / Immunologic - Status', token: 'pe_allergicImmunologic_status' },
      { name: 'Allergic / Immunologic - Remarks', token: 'pe_allergicImmunologic_text' },
      { name: 'Extermities - Status', token: 'pe_extermities_status' },
      { name: 'Extermities - Remarks', token: 'pe_extermities_text' },
      { name: 'Neurologic - Status', token: 'pe_neurologic_status' },
      { name: 'Neurologic - Remarks', token: 'pe_neurologic_text' },
      { name: 'Rectal - Status', token: 'pe_rectal_status' },
      { name: 'Rectal - Remarks', token: 'pe_rectal_text' },
      { name: 'Genitalia - Status', token: 'pe_genitalia_status' },
      { name: 'Genitalia - Remarks', token: 'pe_genitalia_text' },
      { name: 'Ears, Eyes, and Nose - Remarks', token: 'pe_earseyesnose_text' },
      { name: 'Ears, Eyes, and Nose - Status', token: 'pe_earseyesnose_status' },
      { name: 'Head and Neck - Remarks', token: 'pe_headneck_text' },
      { name: 'Head and Neck - Status', token: 'pe_headneck_status' },
      { name: 'Chest and Breast - Remarks', token: 'pe_chestbreast_text' },
      { name: 'Chest and Breast - Status', token: 'pe_chestbreast_status' },
    ],
  },
  {
    name: 'Patient Chart (Objective)',
    type: 'group',
    tokens: [
      { token: 'patient_vitals', name: 'Vitals' },
      { token: 'vital_height', name: 'Vitals - Height (cm)' },
      { token: 'vital_ht_ft', name: 'Vitals - Height (ft)' },
      { token: 'vital_weight', name: 'Vitals - Weight (kg)' },
      { token: 'vital_wt_lbs', name: 'Vitals - Weight (lbs)' },
      { token: 'vital_bmi', name: 'Vitals - BMI' },
      { token: 'vital_pulse_rate', name: 'Vitals - Pulse Rate' },
      { token: 'vital_resp_rate', name: 'Vitals - Respiration Rate' },
      { token: 'vital_blood_pressure', name: 'Vitals - Blood Pressure' },
      { token: 'vital_temperature', name: 'Vitals - Temperature' },
      { token: 'vital_visual_acuity_left', name: 'Vitals - Visual Acuity Left' },
      { token: 'vital_visual_acuity_right', name: 'Vitals - Visual Acuity Right' },
      { token: 'vital_visual_remarks', name: 'Vitals - Visual Remarks' },
      { token: 'vital_color_vision', name: 'Vitals - Color Vision' },
      { token: 'patient_ent_note', name: 'ENT Note' },
      { token: 'patient_ob_note', name: 'OB Note' },
      { token: 'patient_physical_exam', name: 'Physical Exam' },
    ],
  },
  {
    name: 'Patient Chart (Assessment)',
    type: 'group',
    tokens: [
      { token: 'patient_impression', name: 'Impression' },
      { token: 'patient_diagnosis', name: 'Diagnosis' },
      { token: 'diagnosis_icd10', name: 'Diagnosis - ICD 10 Code' },
    ],
  },
  {
    name: 'Patient Chart (Plan)',
    type: 'group',
    tokens: [
      { token: 'patient_care_plan', name: 'Care Plan Note' },
      { token: 'patient_medication_order', name: 'Prescription' },
      { token: 'patient_lab_order', name: 'Laboratory Order' },
      { token: 'patient_imaging_order', name: 'Imaging Order' },
      { token: 'patient_medical_procedure_orders', name: 'Procedure Orders' },
      { token: 'patient_medical_procedures', name: 'Procedure' },
      { token: 'dental_note_result_table', name: 'Dental Note - Work Done Table' },
    ],
  },
  {
    name: 'Custom Text',
    type: 'token',
    token: 'custom_text',
  },
  {
    name: 'Custom Dropdown',
    type: 'token',
    token: 'custom_choices',
  },
];

export const PME_REPORT_ALLOWED_TOKENS = [
  'patient_complaint', 'patient_hpi', 'patient_pmhx', 'patient_fhx', 'patient_shx', 'sh_is_exercising',
  'sh_is_smoking', 'sh_smoking_sticks_per_day', 'sh_smoking_pack_years', 'sh_is_drinking', 'sh_drinking_remarks',
  'sh_is_using_drugs', 'sh_prohibited_drugs', 'patient_allergies_hx',
  'patient_allergy_name', 'patient_allergy_supplement', 'patient_birth_hx', 'patient_gynecological_hx', 'patient_hospitalization_hx', 'patient_vaccination_hx',
  'patient_menstrual_hx', 'patient_menstrual_lmp', 'patient_menstrual_interval', 'patient_menstrual_duration', 'patient_menstrual_cycle', 'patient_menstrual_obscore',
  'patient_obstetric_hx', 'patient_surgical_hx', 'patient_dental_hx', 'patient_ros', 'ros_status_general', 'ros_general', 'ros_status_eyes', 'ros_eyes',
  'ros_status_skin', 'ros_skin', 'ros_status_ent', 'ros_ent', 'ros_status_neck', 'ros_neck', 'ros_status_breasts', 'ros_breasts', 'ros_status_respiratory',
  'ros_respiratory', 'ros_status_cardiovascular', 'ros_cardiovascular', 'ros_status_gastrointestinal', 'ros_gastrointestinal', 'ros_status_peripheral_vascular',
  'ros_peripheral_vascular', 'ros_status_genitourinary', 'ros_genitourinary', 'ros_status_musculoskeletal', 'ros_musculoskeletal', 'ros_status_psychiatric',
  'ros_psychiatric', 'ros_status_neurologic', 'ros_neurologic', 'ros_status_hematologic_lymphatic', 'ros_hematologic_lymphatic', 'ros_status_endocrine',
  'ros_endocrine', 'ros_status_allergic_immunologic', 'ros_allergic_immunologic', 'pe_general_status', 'pe_general_text',
  'pe_head_status', 'pe_head_text', 'pe_eyes_status', 'pe_eyes_text', 'pe_ears_status', 'pe_ears_text', 'pe_nose_status',
  'pe_nose_text', 'pe_neck_status', 'pe_neck_text', 'pe_throat_status', 'pe_throat_text', 'pe_breath_sounds_status',
  'pe_breath_sounds_text', 'pe_respiratory_status', 'pe_respiratory_text', 'pe_cardiovascular_status', 'pe_cardiovascular_text',
  'pe_breasts_status', 'pe_breasts_text', 'pe_chest_status', 'pe_chest_text', 'pe_back_status', 'pe_back_text', 'pe_abdomen_status',
  'pe_abdomen_text', 'pe_gastrointestinal_status', 'pe_gastrointestinal_text', 'pe_genitourinary_status', 'pe_genitourinary_text',
  'pe_musculoskeletal_status', 'pe_musculoskeletal_text', 'pe_skin_status', 'pe_skin_text', 'pe_endocrine_status',
  'pe_endocrine_text', 'pe_psychiatric_status', 'pe_psychiatric_text', 'pe_hematologic_status', 'pe_hematologic_text',
  'pe_allergicImmunologic_status', 'pe_allergicImmunologic_text', 'pe_extermities_status', 'pe_extermities_text',
  'pe_neurologic_status', 'pe_neurologic_text', 'pe_rectal_status', 'pe_rectal_text', 'pe_genitalia_status', 'pe_genitalia_text',
  'patient_vitals', 'vital_height', 'vital_ht_ft', 'vital_weight', 'vital_wt_lbs', 'vital_bmi', 'vital_pulse_rate',
  'vital_resp_rate', 'vital_blood_pressure', 'vital_temperature', 'vital_visual_acuity_left', 'vital_visual_acuity_right',
  'vital_visual_remarks', 'vital_color_vision', 'patient_ent_note', 'patient_ob_note',
  'patient_physical_exam', 'patient_impression', 'patient_diagnosis', 'diagnosis_icd10', 'patient_care_plan',
  'patient_medication_order', 'patient_lab_order', 'patient_imaging_order', 'patient_medical_procedure_orders',
  'patient_medical_procedures', 'dental_note_result_table', 'patient_name', 'patient_full_name_mid_name', 'patient_sex', 'patient_age', 'patient_first_name',
  'patient_middle_name', 'patient_last_name', 'patient_dob', 'patient_blood_type', 'patient_mobile_no', 'patient_marital_status',
  'patient_full_address', 'patient_osca_id', 'patient_pwd_id', 'patient_hmos', 'patient_hmo_accountno', 'patient_hmo_validity',
  'patient_hmo_expiry', 'patient_hmo_status', 'patient_companies', 'patient_company_accountno', 'patient_dp', 'patient_lg_dp', 'patient_xl_dp',
  'patient_full_width_dp', 'custom_text', 'custom_choices', 'clinic_name', 'clinic_address', 'clinic_email', 'clinic_phone', 'clinic_website',
  'clinic_logo', 'clinic_lg_logo', 'clinic_xl_logo', 'clinic_full_width_logo', 'clinic_banner',
];
