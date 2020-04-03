<template lang="pug">
  div
    async-confirm-dialog(ref="confirmDialog")
    async-confirm-custom-actions-dialog(ref="confirmActionsDialog")
    loader-dialog(ref="loaderDialog")
    v-tooltip(bottom v-show="!hideImport")
      v-menu(offset-y left slot="activator")
        //- v-btn(color="primary" flat large slot="activator")
        //-   v-icon(left) mdi-import
        //-   | Import Patients
        v-btn(color="primary" flat icon large slot="activator")
          v-icon mdi-import
        import-xlsx(
          :downloadLink="importTemplateLink"
          :headers="importHeaders"
          :utils="utils"
          @result="onImportData"
        )
      | Import Patients
</template>
<script>
// components
import ImportXlsx from '../commons/import-xlsx';
import LoaderDialog from '../commons/loader-dialog';
import AsyncConfirmDialog from '../commons/async-confirm-dialog';
import AsyncConfirmCustomActionsDialog from '../commons/async-confirm-custom-actions-dialog';
// constants
// utils
import _ from 'lodash';
import * as utils from '../../utils/xlsx';
import { parse, isValid } from 'date-fns';
import { initLogger } from '../../utils/logger';
import { genericTransform } from '../../utils/obj';
import { middleInitalInjector, prettifyNameFirst } from '../../utils/string';

export const COMPONENT_NAME = 'PatientsImport';
const log = initLogger(COMPONENT_NAME);

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
const IMPORT_PATIENT_MAPPINGS = [
  { from: 'firstName', to: 'name.firstName' },
  { from: 'middleName', to: 'name.middleName' },
  { from: 'lastName', to: 'name.lastName' },
  { from: 'dateOfBirth', format: d => !!d && isValid(d) ? parse(d) : null },
  { from: 'sex', format: fuzzySexMatch },
  { from: 'mobileNo', format: m => m ? `${m}` : null },
  { from: 'street1', to: 'address.street1' },
];

export default {
  components: {
    ImportXlsx,
    LoaderDialog,
    AsyncConfirmDialog,
    AsyncConfirmCustomActionsDialog,
  },
  props: {
    hideImport: Boolean,
  },
  data () {
    return {
      importTemplateLink: '/attach/mycure-import-patients-template.xlsx',
      importHeaders: [
        'lastName',
        'firstName',
        'middleName',
        'dateOfBirth',
        'sex',
        'mobileNo',
        'street1',
      ],
    };
  },
  computed: {
    organization () {
      return this.$activeOrganization || {};
    },
    organizationIds () {
      return [
        ...[this.organization.id],
        ...this.organization._ch || [],
        ...this.organization._sb || [],
      ];
    },
    patientFields () {
      return this.organization.mf_patientFields || this.defaultPatientFields ||
        {};
    },
  },
  created () {
    this.utils = { ...utils };
  },
  methods: {
    isFieldRequired (key) {
      const field = (this.patientFields || {})[key];
      return _.isEmpty(field) || field.required;
    },
    openConfirmDialog (title, message, opts) {
      return this.$refs.confirmDialog.open(title, message, opts);
    },
    openConfirmActionsDialog (title, message, actions) {
      return this.$refs.confirmActionsDialog.open(title, message, actions);
    },
    openLoaderDialog (title, message) {
      this.$refs.loaderDialog.open(
        message || 'Loading...',
        title || 'Please wait...'
      );
    },
    closeLoaderDialog () {
      this.$refs.loaderDialog.close();
    },
    updateLoaderDialogMessage (message) {
      this.$refs.loaderDialog.updateMessage(message);
    },
    async pxWithIdNotFoundWDetails (index, old) {
      const name = prettifyNameFirst(middleInitalInjector((old || {}).name));
      const title = 'Patient id doesn\'t exist';
      const msg = `Patient id "${old.id}" doesn't exist in line ${index + 2}. Do you want to create patient ${name} as new? Press NO to skip patient.`;
      const actions = [
        { name: 'Yes', action: 'yes' },
        { name: 'Yes to all', action: 'yes-all' },
        { name: 'No', action: 'no' },
        { name: 'No to all', action: 'no-all' },
        { name: 'Cancel Import', action: 'cancel' },
      ];

      const res = await this.openConfirmActionsDialog(title, msg, actions);
      return res;
    },
    async pxWithIdNotFoundSuggest (index, old, suggest) {
      const name = prettifyNameFirst(middleInitalInjector((suggest || {}).name));
      const title = 'Patient id doesn\'t exist';
      const msg = `Patient id "${old.id}" doesn't exist in line ${index + 2}. But this patient match with an old record. Do you want to use patient ${name}'s old records? Press NO to create as new patient.`;
      const actions = [
        { name: 'Yes', action: 'yes' },
        { name: 'Yes to all', action: 'yes-all' },
        { name: 'No', action: 'no' },
        { name: 'No to all', action: 'no-all' },
        { name: 'Cancel Import', action: 'cancel' },
      ];

      const res = await this.openConfirmActionsDialog(title, msg, actions);
      return res;
    },
    async pxIdNotFound (index, id) {
      const title = 'Patient id doesn\'t exist';
      const msg = `Unable to find patient with id ${id} in line ${index + 2}.`;
      const actions = [
        { name: 'Skip', action: 'skip' },
        { name: 'Skip all', action: 'skip-all' },
        { name: 'Cancel Import', action: 'cancel' },
      ];

      const res = await this.openConfirmActionsDialog(title, msg, actions);
      return res;
    },
    async pxWoutIdSuggest (index, suggest) {
      const name = prettifyNameFirst(middleInitalInjector((suggest || {}).name));
      const title = 'Patient already exists';
      const msg = `This patient match with an old record. Do you want to use patient ${name}'s old records in line ${index + 2}? Press NO to create as new patient.`;
      const actions = [
        { name: 'Yes', action: 'yes' },
        { name: 'Yes to all', action: 'yes-all' },
        { name: 'No', action: 'no' },
        { name: 'No to all', action: 'no-all' },
        { name: 'Cancel Import', action: 'cancel' },
      ];

      const res = await this.openConfirmActionsDialog(title, msg, actions);
      return res;
    },
    verifyData (data) {
      return (data || [])
        .map(d => genericTransform(IMPORT_PATIENT_MAPPINGS, d))
        .map((d, i) => {
          log('verifyData', d, i);
          if (_.isEmpty(_.pickBy(d))) {
            throw new Error(`Please fill out FIRST NAME and LAST NAME or PATIENT ID in line ${i + 2} and try again.`);
          } else if (_.isEmpty(d.id)) {
            if (this.isFieldRequired('first_name') && _.isEmpty(_.get(d, 'name.firstName'))) {
              throw new Error(`Please fill out the FIRST NAME in line ${i + 2} and try again.`);
            } else if (this.isFieldRequired('last_name') && _.isEmpty(_.get(d, 'name.lastName'))) {
              throw new Error(`Please fill out the LAST NAME in line ${i + 2} and try again.`);
            } else if (this.isFieldRequired('middle_name') && _.isEmpty(_.get(d, 'name.middleName'))) {
              throw new Error(`Please fill out the MIDDLE NAME in line ${i + 2} and try again.`);
            } else if (this.isFieldRequired('date_of_birth') && (!d.dateOfBirth || !isValid(d.dateOfBirth))) {
              throw new Error(`Please fill out the DATE OF BIRTH in line ${i + 2} and try again.`);
            } else if (this.isFieldRequired('sex') && _.isEmpty(d.sex)) {
              throw new Error(`Please check the SEX in line ${i + 2} and try again.`);
            } else if (this.isFieldRequired('mobile_num') && _.isEmpty(d.mobileNo)) {
              throw new Error(`Please check the MOBILE NUMBER in line ${i + 2} and try again.`);
            }
          }
          return d;
        });
    },
    async matchPatients (patients) {
      const facility = this.organization;
      const patientList = [];
      const skippedPatients = [];
      let pxWithIdNotFoundSuggestStatus;
      let pxWithIdNotFoundWDetailsStatus;
      let pxIdNotFoundStatus;
      let pxWoutIdSuggestStatus;

      for (let i = 0; i < patients.length; i++) {
        this.updateLoaderDialogMessage(`Loading (${i + 1}/${patients.length})...`);
        const patient = patients[i];
        if (_.isEmpty(_.pickBy(patient))) break;
        if (patient.id) {
          const match = await this.searchPatient({ facility, patient });
          if (match && match.id) {
            patientList.push(match);
          } else if (!_.isEmpty(_.pickBy(_.omit(patient, ['id']))) &&
            !_.isEmpty(_.get(patient, 'name.lastName')) &&
            !_.isEmpty(_.get(patient, 'name.firstName'))) {
            const suggested = await this.searchPatient({
              facility,
              patient: _.omit(patient, ['id']),
            });

            if (suggested && suggested.id) {
              if (pxWithIdNotFoundSuggestStatus === 'yes-all') {
                patientList.push(suggested);
              } else if (pxWithIdNotFoundSuggestStatus === 'no-all') {
                patientList.push(_.omit(patient, ['id']));
              } else {
                const res = await this.pxWithIdNotFoundSuggest(i, patient, suggested);
                if (res === 'yes' || res === 'yes-all') {
                  if (res === 'yes-all') pxWithIdNotFoundSuggestStatus = res;
                  patientList.push(suggested);
                } else if (res === 'no' || res === 'no-all') {
                  if (res === 'no-all') pxWithIdNotFoundSuggestStatus = res;
                  patientList.push(_.omit(patient, ['id']));
                } else {
                  const error = new Error('Import cancelled.');
                  error.name = 'Import cancelled';
                  throw error;
                }
              }
            } else {
              if (pxWithIdNotFoundWDetailsStatus === 'yes-all') {
                patientList.push(_.omit(patient, ['id']));
              } else if (pxWithIdNotFoundWDetailsStatus === 'no-all') {
                skippedPatients.push(patient);
              } else {
                const res = await this.pxWithIdNotFoundWDetails(i, patient);
                if (res === 'yes' || res === 'yes-all') {
                  if (res === 'yes-all') pxWithIdNotFoundWDetailsStatus = res;
                  patientList.push(_.omit(patient, ['id']));
                } else if (res === 'no' || res === 'no-all') {
                  if (res === 'no-all') pxWithIdNotFoundWDetailsStatus = res;
                  skippedPatients.push(_.omit(patient, ['id']));
                } else {
                  const error = new Error('Import cancelled.');
                  error.name = 'Import cancelled';
                  throw error;
                }
              }
            }
          } else {
            if (pxIdNotFoundStatus === 'skip-all') {
              skippedPatients.push(patient);
            } else {
              const res = await this.pxIdNotFound(i, patient.id);
              if (res === 'skip' || res === 'skip-all') {
                if (res === 'skip-all') pxIdNotFoundStatus = res;
                skippedPatients.push(patient);
              } else {
                const error = new Error('Import cancelled.');
                error.name = 'Import cancelled';
                throw error;
              }
            }
          }
        } else {
          const searchedPatient = await this.searchPatient({ facility, patient });
          if (searchedPatient && searchedPatient.id) {
            if (pxWoutIdSuggestStatus === 'yes-all') {
              patientList.push(searchedPatient);
            } else if (pxWoutIdSuggestStatus === 'no-all') {
              patientList.push(patient);
            } else {
              const res = await this.pxWoutIdSuggest(i, searchedPatient);
              if (res === 'yes' || res === 'yes-all') {
                if (res === 'yes-all') pxWoutIdSuggestStatus = res;
                patientList.push(searchedPatient);
              } else if (res === 'no' || res === 'no-all') {
                if (res === 'no-all') pxWoutIdSuggestStatus = res;
                patientList.push(patient);
              } else {
                const error = new Error('Import cancelled.');
                error.name = 'Import cancelled';
                throw error;
              }
            }
          } else {
            patientList.push(patient);
          }
        }
      }

      return { patientList, skippedPatients };
    },
    async onImportData (data) {
      try {
        this.openLoaderDialog();
        const patients = await this.verifyData(data);
        const result = await this.matchPatients(patients);
        log('onImportData#result', result);
        this.$emit('result', result);
      } catch (error) {
        console.error(error);
        log('onImportData#error');
        this.openConfirmDialog(error.name || 'Invalid/Incomplete Input(s)',
          error.message, { secondaryAction: 'Dismiss', hidePrimaryAction: true });
      } finally {
        this.closeLoaderDialog();
      }
    },
    async searchPatient ({ facility, patient }) {
      if (_.isEmpty(facility)) throw new Error('No facility id.');
      if (_.isEmpty(_.pickBy(patient))) throw new Error('Invalid payload.');
      const query = {
        $comment: 'wp/patient/searchPatient',
        $total: false,
      };

      if (typeof facility === 'object' && facility) {
        if (!query.$search) query.$search = {};
        const parent = typeof facility.parent === 'object'
          ? _.get(facility, 'parent.id')
          : facility.parent;
        const includeFamily = !!parent || !_.isEmpty(facility._ch);
        query.$search.organization = parent || facility.id;
        query.$search.includeOrganizationChildren = includeFamily;
      } else if (!_.isEmpty(facility)) {
        query.facility = facility;
      }

      if (patient.id) {
        query.id = patient.id;
      } else {
        // TODO: add these filters to $search operator
        if (!_.isEmpty(patient?.name?.firstName)) {
          const text = patient.name.firstName.toLowerCase();
          query.firstNameNormalized = { $regex: `^${text}` };
        }
        if (!_.isEmpty(patient?.name?.lastName)) {
          const text = patient.name.lastName.toLowerCase();
          query.lastNameNormalized = { $regex: `^${text}` };
        }
        if (!_.isEmpty(patient?.sex)) {
          query.sex = patient.sex;
        }
        if (patient?.dateOfBirth) {
          if (!query.$or) query.$or = [];
          const bdayStart = new Date(patient.dateOfBirth).setHours(0, 0, 0, 0);
          const bdayEnd = new Date(patient.dateOfBirth).setHours(23, 59, 59, 0);
          query.$or.push({
            dateOfBirth: { $lte: bdayEnd, $gte: bdayStart },
          });
        }
        if (patient.mobileNo) {
          if (!query.$or) query.$or = [];
          query.$or.push({ mobileNo: patient.mobileNo });
        }
      }

      log('searchPatient#query', query);
      const res = await this.$sdk.service('personal-details').findOne(query);
      log('searchPatient#res', res);
      return res;
    },
  },
};
</script>
