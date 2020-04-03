<template lang="pug">
  v-card
    v-toolbar(flat)
      h1 Create {{typeFormatted}} Order
      v-spacer
      v-btn(flat icon @click="onClose")
        v-icon mdi-close

    v-card-text
      v-layout(row)
        v-flex(xs12 sm6).pa-2
          v-flex.mb-2
            b Choose Patient
              span.red--text *
          v-flex
            search-patients(
              v-model="patient"
              :disabled="showForm"
              label="Search Patient"
              return-object
              clearable
              outline
            )

          v-layout(column align-center)
            span.grey--text.mt-1 or
            v-btn(
              :color="showForm ? 'error' : 'primary'"
              :disabled="!!patient"
              outline
              @click="showForm = !showForm"
            )
              template(v-if="showForm")
                v-icon mdi-minus
                | Input New Patient
              template(v-else)
                v-icon mdi-plus
                | Input New Patient

          v-form(v-if="showForm" ref="form")
            v-layout(row wrap align-content-center)
              v-flex(xs12).pa-1
                v-checkbox(
                  v-model="requireEmail"
                  color="primary"
                  label="Attach an email so you can send results directly to the patient"
                )
                v-text-field(
                  v-model="patientModel.email"
                  :rules="requireEmail ? [requiredRule, emailRule] : []"
                  label="Email"
                  outline
                  clearable
                )
              v-flex(xs6).pa-1
                v-text-field(
                  v-model="patientModel.firstName"
                  :rules="[requiredRule]"
                  label="First Name"
                  outline
                  hide-details
                )
              v-flex(xs6).pa-1
                v-text-field(
                  v-model="patientModel.lastName"
                  :rules="[requiredRule]"
                  label="Last Name"
                  outline
                  hide-details
                )
              v-flex(xs6).pa-1
                v-select(
                  v-model="patientModel.sex"
                  :items="sexes"
                  label="Sex"
                  item-text="text"
                  item-value="value"
                  outline
                  hide-details
                )
              v-flex(xs6).pa-1
                date-picker-menu(
                  v-model="patientModel.dateOfBirth"
                  :max="today"
                  outline
                  hide-details
                )

        v-flex(xs12 sm6).pa-2
          v-flex.mb-2
            b Choose {{typeFormatted}} Tests
              span.red--text *
          v-flex
            v-layout(row wrap)
              v-flex(xs12).pa-1
                search-diagnostic-tests(
                  v-model="diagnosticTests"
                  :type="type"
                  :truncate-chip="40"
                  :rules="[requiredRule]"
                  :label="searchTestLabelFormatted"
                  outline
                  multiple
                  clearable
                )
              v-flex(xs6).pa-1
                v-text-field(
                  v-model="orderModel.reason"
                  label="Reason"
                  outline
                )
              v-flex(xs6).pa-1
                v-text-field(
                  v-model="orderModel.requestingPhysician"
                  label="Requesting Physician"
                  outline
                )

    v-card-actions
      v-spacer
      v-btn(
        :loading="loading"
        color="primary"
        dark
        large
        @click="onSave"
      ) Save
      v-btn(
        :disabled="loading"
        color="error"
        flat
        large
        @click="onCancel"
      ) Cancel

    async-confirm-dialog(ref="confirmDialog")
</template>

<script>
// components
import DatePickerMenu from '../commons/date-picker-menu';
import SearchPatients from '../common-search/search-patients';
import AsyncConfirmDialog from '../commons/async-confirm-dialog';
import SearchDiagnosticTests from '../common-search/search-diagnostic-tests';
// utils
import datefns from 'date-fns';
import { initLogger } from '../../utils/logger';

const log = initLogger('DiagnosticOrderCreate');
const getDefaultPatientModel = () => ({
  firstName: '',
  lastName: '',
  sex: 'male',
  dateOfBirth: null,
  email: '',
});
const getDefaultOrderModel = () => ({
  reason: '',
  requestingPhysician: '',
});

export default {
  components: {
    DatePickerMenu,
    SearchPatients,
    AsyncConfirmDialog,
    SearchDiagnosticTests,
  },
  props: {
    type: {
      type: String,
      default: 'laboratory',
      validator: v => ['laboratory', 'radiology'].includes(v),
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      showForm: false,
      requireEmail: true,
      patient: null,
      patientModel: getDefaultPatientModel(),
      diagnosticTests: [],
      orderModel: getDefaultOrderModel(),
      sexes: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
      ],
      today: datefns.format(Date.now(), 'YYYY-MM-DD'),
      requiredRule: v => !!v || 'Required',
      emailRule: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
    };
  },
  computed: {
    typeFormatted () {
      switch (this.type) {
        case 'laboratory': return 'Laboratory';
        case 'radiology': return 'Imaging';
        default: return '';
      }
    },
    searchTestLabelFormatted () {
      return `Search ${this.typeFormatted} Tests`;
    },
  },
  methods: {
    clearModels () {
      this.showForm = false;
      this.requireEmail = true;
      this.patient = null;
      this.patientModel = getDefaultPatientModel();
      this.diagnosticTests = [];
      this.orderModel = getDefaultOrderModel();
    },
    onClose () {
      log('onClose#emitting');
      this.$emit('close');
    },
    async onSave () {
      // validate
      if (!this.patient && !this.showForm) {
        return this.$enqueueSnack({
          message: 'Select or add a patient first.',
          color: 'warning',
        });
      }
      if (this.showForm && !this.$refs.form?.validate()) {
        return this.$enqueueSnack({
          message: 'Make sure to fill out required patient details.',
          color: 'warning',
        });
      }
      if (!this.diagnosticTests?.length) {
        return this.$enqueueSnack({
          message: 'Select at least one test.',
          color: 'warning',
        });
      }
      // normalize patient
      let normalizedPatient = this.patient;
      if (!this.patient) {
        normalizedPatient = {
          facility: this.$activeOrganization?.id,
          personalDetails: {
            name: {
              firstName: this.patientModel?.firstName,
              lastName: this.patientModel?.lastName,
            },
            sex: this.patientModel?.sex,
            dateOfBirth: this.patientModel?.dateOfBirth,
          },
        };
      }
      // emit
      this.$emit('create', {
        patient: normalizedPatient,
        email: this.patientModel?.email,
        order: this.orderModel,
        diagnosticTests: this.diagnosticTests,
      });
      // clear
      this.clearModels();
    },
    async onCancel () {
      const confirm = await this.$refs.confirmDialog?.open(
        'Cancel Order',
        'Are you sure you want to discard changes?'
      );
      if (!confirm) return;
      this.$emit('close');
      // clear
      this.clearModels();
    },
  },
};
</script>
