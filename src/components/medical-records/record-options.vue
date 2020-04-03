<template lang="pug">
  v-flex(xs12 md12 style="height: 25px;")
    v-tooltip(right v-if="record.type === 'medical-procedure-order' && record.doneAt")
      v-icon(slot="activator" @click="permissionDialog = true").success--text mdi-check
      | Procedure done at {{record.doneAt | morph-date('MMM. DD, YYYY hh:mm A')}}
    v-tooltip(right v-if="recordPermission === 'private'")
      v-icon(slot="activator" @click="permissionDialog = true") mdi-lock-outline
      | Only you can see this record
    v-tooltip(right v-if="recordPermission === 'advanced'")
      v-icon(slot="activator" @click="permissionDialog = true") mdi-account-group
      | This record has custom permission
    v-tooltip(bottom).right
      v-menu(slot="activator" bottom left)
        button(slot="activator").right
          v-icon mdi-dots-horizontal
        v-list(dense style="min-width: 250px;")
          v-list-tile(@click="print()" v-if="printable")
            v-list-tile-action
              v-icon mdi-printer
            v-list-tile-content
              v-list-tile-title Print {{printButtonTextSuffix}}
          v-list-tile(@click="onPrintDiagnosticResults()" v-if="printableResults")
            v-list-tile-action
              v-icon mdi-printer
            v-list-tile-content
              v-list-tile-title Print {{printButtonTextSuffix}} Results
          v-list-tile(@click="addResultDialog = true" v-if="record.type === 'lab-test-order' && !readOnly")
            v-list-tile-action
              v-icon mdi-plus
            v-list-tile-content
              v-list-tile-title Add Result
          v-list-tile(@click="editRecord" v-if="editable")
            v-list-tile-action
              v-icon mdi-pencil
            v-list-tile-content
              v-list-tile-title Edit
          v-list-tile(@click="infoDialog = true")
            v-list-tile-action
              v-icon mdi-information-outline
            v-list-tile-content
              v-list-tile-title Info
          v-list-tile(@click="permissionDialog = true" v-if="!readOnly")
            v-list-tile-action
              v-icon mdi-lock
            v-list-tile-content
              v-list-tile-title Manage Permissions
          v-divider(v-if="!readOnly")
          v-list-tile(@click="confirmDelete = true" v-if="!readOnly")
            v-list-tile-action
              v-icon.error--text mdi-trash-can-outline
            v-list-tile-content
              v-list-tile-title.error--text Delete
      | Options

    confirm-dialog(
      :dialog.sync="confirmDelete"
      message="Do you really want to archive this record?"
      @yes="deleteRecord"
    )

    //- PERMISSION DIALOG
    permission-dialog(
      :loading="loading"
      :dialog.sync="permissionDialog"
      :permission="recordPermission"
      :permissions="recordPermissions"
      @close="permissionDialog = $event"
      @make-public="makePublic"
      @make-private="makePrivate"
      @save="saveAdvancedPermission"
    )
    //- INFO DIALOG
    v-dialog(v-model="infoDialog" width="500" persistent lazy)
      v-card
        v-toolbar(flat)
          h2 Medical Record Information
          v-spacer
          v-btn(icon @click="infoDialog = false")
            v-icon mdi-close
        v-card-text
          v-layout(row wrap)
            v-flex(xs12 md6)
              h3.grey--text Created By
              p {{createdBy}}
            v-flex(xs12 md6)
              h3.grey--text Created At
              p {{record.createdAt | morph-date('MMM. DD, YYYY hh:mm:ss A')}}

    //- PRIVILEGE DIALOG
    v-dialog(v-model="privilegeDialog" width="500" persistent lazy)
      v-card
        v-toolbar(flat)
          h2 Action Interrupted
          v-spacer
          v-btn(icon @click="privilegeDialog = false")
            v-icon mdi-close
        v-card-text
          //- TODO: make this more dynamic to handle all unpermitted actions
          p.subheading You don't have enough privilege to print this.
            | &nbsp;You must atleast have view permission on {{ diagTestType }} Results

    //- EDIT DIALOG
    v-dialog(
      v-model="editDialog"
      v-if="editDialog"
      persistent
      scrollable
      lazy
      width="700"
      :fullscreen="fullscreenEdit"
      :hide-overlay="hideEditOverlay"
    )
      v-card
        v-toolbar(flat)
          h2 Edit {{recordName}}
          v-spacer
          v-btn(icon @click="editDialog = false")
            v-icon mdi-close
        v-divider
        v-card-text
          v-layout(row wrap)
            //- ENC
            v-flex(xs12 md12)
              lab-order-form(
                ref="formRef"
                v-if="tempRecord.type === 'lab-test-order'"
                :model="tempRecord"
                isEdit
                @submit="submit"
              )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            @click="validateForm"
            color="success"
            large
          ) Update Record

    v-dialog(v-model="addResultDialog" width="800" scrollable lazy)
      v-card
        v-toolbar(flat)
          v-toolbar-title Lab Result
          v-spacer
          v-btn(icon @click="addResultDialog = false")
            v-icon mdi-close
        v-card-text
          lab-order-result-form(
            ref="labOrderResultForm"
            :record="record"
            @results="createLabOrderResults"
          )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            @click="$refs.labOrderResultForm.validate()"
            color="success"
            large
            :disabled="loading"
            :loading="loading"
          ) Add Result
</template>

<script>
// components
import labOrderForm from './lab-order/form';
import ConfirmDialog from '../commons/confirm-dialog';
import labOrderResultForm from './lab-order/result-form';
import PermissionDialog from '../dialogs/permission-dialog';
// constants
import { MEDICAL_RECORD_TYPES } from '../../plugins/medical-records/constants';
// utils
import _ from 'lodash';
import { initLogger } from '../../utils/store';
import { permitPrivileges } from '../../utils/permissions';

const log = initLogger('RecordOptions');

export default {
  components: {
    PermissionDialog,
    ConfirmDialog,
    labOrderForm,
    labOrderResultForm,
  },
  props: {
    readOnly: {
      type: Boolean,
      default: undefined,
    },
    record: {
      type: Object,
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
    printable: {
      type: Boolean,
      default: undefined,
    },
    printableResults: {
      type: Boolean,
      default: undefined,
    },
    editable: {
      type: Boolean,
      default: true,
    },
    printButtonTextSuffix: {
      type: String,
      default: undefined,
    },
    externalEdit: {
      type: Boolean,
      default: undefined,
    },
    formTemplates: {
      type: Array,
      default: undefined,
    },
    fullscreenEdit: {
      type: Boolean,
      default: undefined,
    },
    orderTestId: {
      type: String,
      default: undefined,
    },
    orderTestType: {
      type: String,
      default: undefined,
    },
    hideEditOverlay: {
      type: Boolean,
      default: false,
    },
  },
  data () {
    return {
      loading: false,
      tempRecord: {},
      confirmDelete: false,
      infoDialog: false,
      editDialog: false,
      formValid: false,
      printDialog: false,
      addResultDialog: false,
      permissionDialog: false,
      recordPermission: '',
      recordPermissions: null,
      privilegeDialog: false,
    };
  },
  computed: {
    createdBy () {
      const createdByDetails = _.get(this.record, '$populated.createdByDetails');
      if (_.isEmpty(createdByDetails)) return 'None';
      return this.$formatName(createdByDetails.name, 'firstName middleInitial lastName');
    },
    recordName () {
      let record = null;

      if (this.record.subtype) {
        record = MEDICAL_RECORD_TYPES.find(r => r.subtype === this.record.subtype);
      } else {
        record = MEDICAL_RECORD_TYPES.find(r => r.type === this.record.type);
      }

      if (_.isEmpty(record)) return '';

      return record.name;
    },
    determinePermission () {
      const permissions = _.get(this.record, 'permissions');
      // FIXME: remove unexpected side effect
      this.recordPermissions = permissions; // eslint-disable-line
      if (_.isEmpty(permissions)) {
        return 'public';
      } else if (permissions.length === 1) {
        const permission = permissions[0];
        if (permission.uid === this.$currentUser.uid) { return 'private'; }
      } else if (permissions.length > 1) {
        return 'advanced';
      }
      return undefined;
    },
    diagTestType () {
      if (this.orderTestType === 'lis') {
        return 'Laboratory';
      }
      return 'Imaging';
    },
  },
  watch: {
    editDialog (val) {
      if (val) {
        this.tempRecord = { ...this.record };
      }
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      this.tempRecord = { ...this.record };
      this.recordPermission = this.determinePermission;
    },
    async deleteRecord () {
      try {
        const data = {
          type: this.record.type,
          id: this.record.id,
        };
        if (this.record.subtype) {
          data.subtype = this.record.subtype;
        }
        await this.$store.dispatch('medical-records/removeMedicalRecord', { data });
        this.$enqueueSnack({
          message: 'Record deleted!',
          color: 'success',
          timeout: 3000,
        });
      } catch (error) {
        console.error(error);
        log('deleteRecord#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
    },
    validateForm () {
      this.$nextTick(async () => {
        await this.$refs.formRef.validate();
      });
    },
    // Update record here
    async submit (data) {
      try {
        data.payload = _.mapValues(
          data.payload,
          v => typeof v === 'string' && _.isEmpty(v) ? null : v,
        );
        const payload = { type: this.record.type, data };
        if (this.record.subtype) {
          payload.subtype = this.record.subtype;
        }
        await this.$store.dispatch('medical-records/updateMedicalRecords', payload);
        this.$enqueueSnack({
          message: `${this.recordName} has been updated!`,
          color: 'success',
          timeout: 3000,
        });
      } catch (error) {
        console.error(error);
        log('submit#error');
        this.$enqueueSnack({
          message: 'There was an error. Please try again later.',
          color: 'error',
          timeout: 3000,
        });
      } finally {
        this.editDialog = false;
      }
    },
    async onPrintDiagnosticResults () {
      log('printDiagnosticResults#record: %O', this.record);
      log('printDiagnosticResults#orderTestType: %O', this.orderTestType);
      log('printDiagnosticResults#$activeMembership: %O', this.$activeMembership);
      if (!this.orderTestType) {
        console.error('Print error: Diagnostic test type is required. Value must be one of \'lis\' or \'ris\'');
        return;
      }

      const isUserPermitted = permitPrivileges(this.$activeMembership,
        [`${this.orderTestType}_resultsRead`]);
      log('printDiagnosticResults#isUserPermitted: %O', isUserPermitted);

      if (!isUserPermitted) {
        this.privilegeDialog = true;
        return;
      }

      const testCount = this.record && this.record.tests && this.record.tests.length;

      if (testCount > 1) {
        this.$emit('select-test');
      } else {
        this.printDiagnosticResults(this.orderTestId);
      }
    },
    async printDiagnosticResults (orderTestId) {
      if (orderTestId) {
        this.$router.push({
          name: `${this.orderTestType}-print-test`,
          params: { id: orderTestId },
        });
      } else {
        this.$router.push({
          name: `${this.orderTestType}-tests`,
        });
      }
    },
    async loadMedicines (searchString) {
      try {
        const query = { uid: this.$currentUser.uid };
        if (searchString) query.searchText = searchString;
        await this.$store.dispatch('medicines/getAllMedicines', query);
      } catch (e) {
        console.error(e);
      }
    },
    searchMedicine (searchString) {
      this.loadMedicines(searchString);
    },
    print () {
      const routes = {
        'audiometry-report': 'emr-print-medical-procedure-record',
        spirometry: 'emr-print-medical-procedure-record',
        'treadmill-stress-test-patient-profile': 'emr-print-medical-procedure-record',
        'treadmill-stress-test-report': 'emr-print-medical-procedure-record',
        'medical-note': 'emr-print-medical-procedure-record',
        'fit-certificate': 'emr-print-medical-record',
        'health-history': 'emr-print-medical-record',
        'imaging-test-order': 'emr-print-medical-record',
        'lab-test-order': 'emr-print-medical-record',
        'med-certificate': 'emr-print-medical-record',
        'medication-order': 'emr-print-medical-record',
        waiver: 'emr-print-medical-record',
        claims: 'emr-print-medical-record',
        general: 'emr-print-medical-record',
        'nutritional-plan': 'emr-print-medical-record',
      };

      const route = routes[this.record.type];

      if (!route) return;

      this.$router.push({
        name: route,
        params: {
          record: this.record,
          patient: this.record.patient,
          patientData: this.patient,
          fromRoute: this.$route.name,
          fromParams: this.$route.params,
          fromQueries: this.$route.query,
        },
      });
    },
    async makePrivate () {
      try {
        this.loading = true;
        const payload = {
          permissions: [
            {
              uid: this.$currentUser.uid,
            },
          ],
        };
        const payloadData = {
          type: this.record.type,
          data: {
            id: this.record.id,
            payload,
          },
        };
        if (this.record.subtype) {
          payloadData.subtype = this.record.subtype;
        }
        await this.$store.dispatch('medical-records/updateMedicalRecords', payloadData);
        this.recordPermission = 'private';
        this.$enqueueSnack({
          message: 'Record\'s permission successfully set to PRIVATE.',
          color: 'success',
        });
        this.permissionDialog = false;
      } catch (error) {
        console.error(error);
        log('makePrivate#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async makePublic () {
      try {
        this.loading = true;
        const payload = {
          permissions: [],
        };
        const payloadData = {
          type: this.record.type,
          data: {
            id: this.record.id,
            payload,
          },
        };
        if (this.record.subtype) {
          payloadData.subtype = this.record.subtype;
        }
        await this.$store.dispatch('medical-records/updateMedicalRecords', payloadData);
        this.recordPermission = 'public';
        this.$enqueueSnack({
          message: 'Record\'s permission successfully set to PUBLIC.',
          color: 'success',
        });
        this.permissionDialog = false;
      } catch (error) {
        console.error(error);
        log('makePublic#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async saveAdvancedPermission (permissions) {
      try {
        this.loading = true;
        const payload = {
          type: this.record.type,
          data: {
            id: this.record.id,
            payload: {
              permissions,
            },
          },
        };
        if (this.record.subtype) {
          payload.subtype = this.record.subtype;
        }
        await this.$store.dispatch('medical-records/updateMedicalRecords', payload);
        this.recordPermission = 'advanced';
        this.$enqueueSnack({
          message: 'Record\'s permission successfully updated.',
          color: 'success',
        });
        this.permissionDialog = false;
      } catch (error) {
        console.error(error);
        log('saveAdvancedPermission#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async createLabOrderResults (results) {
      try {
        this.loading = true;
        await this.$store.dispatch('medical-records/createMedicalRecords', {
          records: [
            {
              type: 'lab-test-result',
              order: this.record.id,
              results,
              patient: this.record.patient,
              facility: this.$activeOrganization.id,
            },
          ],
          patient: this.record.patient,
        });
        this.$enqueueSnack({
          message: 'Lab order results added!',
          color: 'success',
        });
        this.addResultDialog = false;
      } catch (error) {
        console.error(error);
        log('createLabOrderResults#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    editRecord () {
      if (this.externalEdit) {
        this.$emit('edit');
      } else {
        this.editDialog = true;
      }
    },
  },
};
</script>
