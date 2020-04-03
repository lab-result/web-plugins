<template lang="pug">
  div
    v-layout(row :class="{ archived: isArchived }")
      v-flex(shrink :class="{'pr-3': !isMobile, 'pr-1': isMobile }").text-xs-center
        img(
          width="60"
          :src="px.picURL"
          v-if="px.picURL"
        )
        img(
          width="60"
          src="@/assets/images/person-placeholder.png"
          v-else
        )
      v-flex(grow)
        v-layout(row align-center)
          v-flex(grow)
            span.title {{px.name | prettify-name}}
              template(v-if="px.tags")
                v-chip(v-for="(tag, key) in px.tags" :key="key" small) {{ tag }}
              v-chip(color="error" v-if="isArchived") Archived
              v-tooltip(v-if="!readOnly && !isArchived" bottom)
                v-menu(offset-y slot="activator" right)
                  v-btn(flat small color="primary" slot="activator" icon)#tour-patient-edit
                    v-icon(style="font-size: 17px;") mdi-pencil
                  v-list
                    v-list-tile(:to="editRoute")
                      v-list-tile-action
                        v-icon mdi-pencil
                      v-list-tile-content
                        v-list-tile-title Edit Patient
                    v-list-tile(
                      @click="recordsDrawer = !recordsDrawer"
                      v-if="!hidePatientDrawer"
                    )
                      v-list-tile-action
                        v-icon mdi-information-outline
                      v-list-tile-content
                        v-list-tile-title Medical Record Summary
                    v-divider
                    v-list-tile(@click="confirmDialog = true")
                      v-list-tile-action
                        v-icon.error--text mdi-delete
                      v-list-tile-content
                        v-list-tile-title.error--text Archive Patient
                | More options
          v-flex(shrink v-if="!isArchived")
            v-btn(
              small
              flat
              color="primary"
              outline
              @click.stop="recordsDrawer = !recordsDrawer"
              v-if="!hidePatientDrawer"
            )#tour-patient-records.my-0
              v-icon(v-if="!recordsDrawer") mdi-chevron-left
              | Patient Records
              v-icon(v-if="recordsDrawer") mdi-chevron-right
        v-layout(
          row
          wrap
        ).grey--text.mb-2
          v-flex(xs12 md5).pr-4
            span.caption.grey--text.text--darken-3 {{px.sex | morph-capitalize}}
            v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
            span.caption.grey--text.text--darken-3 {{ calcExactAgeUtil(px.dateOfBirth) || 'Age: --'}}
            v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
            span.caption.grey--text.text--darken-3 Blood Type: {{px.bloodType || '--' | morph-capitalize}}
            br
            span(v-if="px.dateOfBirth").caption.grey--text.text--darken-3 {{px.dateOfBirth | morph-date('MMM DD, YYYY') }}
            span(v-if="!px.dateOfBirth").caption.grey--text.text--darken-3 Date of Birth: --
            v-icon(style="font-size: 18px;").mx-1.grey--text mdi-chevron-right
            span.caption.grey--text.text--darken-3 {{px.mobileNo || 'Mobile: --'}}
            br
            template(v-if="px.OSCASeniorCitizenId")
              span.caption.grey--text.text--darken-3 Senior Citizen Id: {{px.OSCASeniorCitizenId}}
            template(v-if="px.PWDId")
              v-icon(style="font-size: 18px;" v-if="px.OSCASeniorCitizenId").mx-1.grey--text mdi-chevron-right
              span.caption.grey--text.text--darken-3 PWD Id: {{px.PWDId}}
            br(v-if="px.OSCASeniorCitizenId || px.PWDId")
            span.caption.grey--text.text--darken-3 {{medicalNote | morph-truncate(30)}}
              button(@click="notesDialog = true" v-if="medicalNote.length > 100").primary--text.caption Read more...
          v-flex(shrink)
            span(v-if="HMOs" style="white-space: pre-wrap").caption.grey--text.text--darken-3 HMO: {{HMOs}}
            br(v-if="companies")
            span(v-if="companies" style="white-space: pre-wrap").caption.grey--text.text--darken-3 Company: {{companies}}

    v-navigation-drawer(
      v-model="recordsDrawer"
      right
      app
      clipped
      stateless
      floating
      width="550"
      style="border-left: 1px solid lightgrey;"
      v-if="!hidePatientDrawer"
    )
      v-toolbar(flat color="white" dense)
        v-icon.grey--text mdi-file-document-outline
        v-toolbar-title.grey--text Medical Record Summary
        v-spacer
        v-btn(icon @click.stop="recordsDrawer = !recordsDrawer")
          v-icon.grey--text mdi-chevron-right
      v-tabs(
        v-model="selectedTab"
        slider-color="primary"
        grow
        height="45"
      )
        v-tab(href="#timeline") View per visit
        v-tab(href="#per-record") View per record
      v-divider
      v-tabs-items(v-model="selectedTab")
        v-tab-item(value="timeline" lazy)
          v-container.pa-0
            v-layout(row)
              v-flex
                previous-encounter(
                  ref="prevEncRef"
                  :patient="id"
                )
        v-tab-item(value="per-record" lazy)
          previous-per-record-view

    loading-confirm-dialog(
      :dialog.sync="confirmDialog"
      :loading.sync="loading"
      title="Confirm"
      message="Do you really want to archive this patient?"
      primaryAction="Yes, archive patient"
      primaryColor="error"
      @yes="archivePatient"
    )

    v-dialog(v-model="notesDialog" width="500")
      v-card
        v-toolbar(flat)
          v-toolbar-title Patient Notes
        v-card-text
          p.subheading {{medicalNote}}
</template>

<script>
// components
import LoadingConfirmDialog from '../commons/loading-confirm-dialog';
import PreviousEncounter from '../encounter/previous/per-visit-view';
import PreviousPerRecordView from '../encounter/previous/per-record-view';
// constants
// utils
import _ from 'lodash';
import { format } from 'date-fns';
import { compile } from '../../utils/string';
import { initLogger } from '../../utils/logger';
import { calcExactAgeUtil } from '../../utils/date';
import { getPatient } from '../../services/patients';
import { mapPagination } from '../../utils/ui-store-mapping';
import { getMedicalRecords } from '../../services/medical-records';
import * as organizationMembers from '../../services/organization-members';

const log = initLogger('PatientProfile');
const MEDICAL_TEST_ORDER_TYPES = ['lab-test-order', 'imaging-test-order'];
const DIAGNOSTIC_MEDICAL_TYPE_MAP = {
  laboratory: ['lab-test-order'],
  radiology: ['imaging-test-order'],
};
const DOCTOR_ROLES = [
  'doctor',
  'doctor_pathologist',
  'doctor_radiologist',
  'doctor_sonologist',
  'doctor_cardiologist',
  'doctor_pme',
];

export default {
  components: {
    LoadingConfirmDialog,
    PreviousEncounter,
    PreviousPerRecordView,
  },
  props: {
    patient: {
      type: String,
      default: undefined,
    },
    readOnly: {
      type: Boolean,
      default: undefined,
    },
    hidePatientDrawer: {
      type: Boolean,
      default: false,
    },
    compact: {
      type: Boolean,
      default: undefined,
    },
    preventRouteChanges: {
      type: Boolean,
      default: undefined,
    },
    editPatientRoute: {
      type: Object,
      default: null,
    },
  },
  data () {
    return {
      notesDialog: false,
      recordsDrawer: false,
      confirmDialog: false,
      selectedTab: 'timeline',
      loading: false,
      px: {
        name: {},
      },
      calcExactAgeUtil: calcExactAgeUtil,
      serviceSearching: false,
      serviceType: '',
      services: [],
      imagingTestsSearchText: '',
      labTestsSearchText: '',
      ordersPagination: {},
      ordersTotal: 0,
      fetching: false,
      orders: [],
    };
  },
  computed: {
    isMobile () {
      return this.$vuetify.breakpoint.mdAndDown;
    },
    medicalNote () {
      return _.get(this.px.medicalNote, 'text') || 'No additional notes';
    },
    id () {
      return this.patient;
    },
    isArchived () {
      return !_.isNil(this.px.archivedAt);
    },
    HMOs () {
      log('computed#insuranceCards: %O', this.px.insuranceCards);
      log('computed#HMOs: %O', this.px.hmos);

      if (_.isEmpty(this.px.insuranceCards) && _.isEmpty(this.px.hmos)) {
        return 'None provided';
      }

      return ((this.px || {}).insuranceCards || [])
        .map(card => {
          const hmo = this.px.hmos.filter(h => h.id === card.insurance)[0];
          const formatHMO = compile`${'name'} - ${'number'} - ${'status'}\nValidity: ${'validity'} - ${'expiry'}`;
          const name = _.get(hmo, 'name');
          const number = _.get(card, 'number');
          const validity = _.get(card, 'validAt');
          const expiry = _.get(card, 'expiresAt');
          const status = _.get(card, 'status');

          return formatHMO({
            name,
            number,
            validity: validity ? format(validity, 'MMM D, YYYY') : null,
            expiry: expiry ? format(expiry, 'MMM D, YYYY') : null,
            status: status ? status.toUpperCase() : null,
          });
        })
        .join(', ');
      // return _.map(this.px.hmos, 'name').join(', ');
    },
    companies () {
      log('computed#companies: %O', this.px.companies);
      log('computed#companyPartners: %O', this.px.companyPartners);
      if (_.isEmpty(this.px.companies)) {
        return 'None provided';
      }

      return ((this.px || {}).companies || [])
        .map(card => {
          const company = (this.px.companyPartners || []).filter(c => c.id === card.id || c.id === card.company)[0];
          const formatCompany = compile`${'name'} - ${'companyId'}`;
          const name = _.get(company, 'name') || _.get(company, 'insurerName') || _.get(card, 'name') || '';
          const companyId = _.get(card, 'companyId');

          return formatCompany({ name, companyId });
        })
        .join(', ');
      // return _.map(this.px.companyPartners, 'name').join(', ');
    },
    staffs () {
      return this.activeOrganizationDoctors?.map(m => _.pick(m, 'uid', 'picURL', 'name'));
    },
    labTests () {
      if (_.isEmpty(this.labTestsSearchText)) return this.$store.getters['diagnostic/labTests'];

      const regex = new RegExp(this.labTestsSearchText, 'i');
      return _.filter(
        this.$store.getters['diagnostic/labTests'],
        t => regex.test(t.name) || regex.test(t.section)
      );
    },
    imagingTests () {
      if (_.isEmpty(this.imagingTestsSearchText)) return this.$store.getters['diagnostic/imagingTests'];

      const regex = new RegExp(this.imagingTestsSearchText, 'i');
      return _.filter(
        this.$store.getters['diagnostic/imagingTests'],
        t => regex.test(t.name) || regex.test(t.section)
      );
    },
    editRoute () {
      const defaultRoute = {
        name: 'create-patient',
        params: { id: this.id, action: 'update' },
      };
      return this.editPatientRoute || defaultRoute;
    },
  },
  watch: {
    recordsDrawer (val) {
      if (!this.preventRouteChanges) {
        this.$route.meta.isLeftDrawerClosed = val;
        this.$forceUpdateRoute();
      }

      this.$emit('update:drawer', val);

      if (val) {
        this.$refs.prevEncRef.init();
      }
    },
    isArchived (val) {
      this.$emit('archived', val);
    },
    patient () {
      this.init();
    },
    $route (route) {
      log('watch#route: %O', route);
    },
    targetSearchstring: {
      immediate: true,
      handler: 'fetchActiveOrganizationDoctors',
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      if (!this.patient) return;
      try {
        const query = { id: this.patient };
        this.px = await getPatient(this.$sdk, query);
        await this.$store.dispatch('insurance-contracts/getInsuranceContracts', this.$activeOrganization.id);
      } catch (error) {
        console.error(error);
      }
    },
    async fetchActiveOrganizationDoctors () {
      try {
        const opts = {
          organization: this.$activeOrganization.id,
          searchString: this.targetSearchstring,
          roles: { $in: DOCTOR_ROLES },
          limit: 100,
        };
        const { items } = await organizationMembers.getOrganizationMembers(this.$sdk, opts);
        log('fetchActiveOrganizationDoctors#items: %O', items);
        this.activeOrganizationDoctors = items;
      } catch (error) {
        log('fetchActiveOrganizationDoctors#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
    },
    async archivePatient () {
      try {
        this.loading = true;
        await this.$sdk.service('medical-patients').update(this.patient, { archive: true });
        this.$router.push({
          name: 'patients',
        });
        this.$enqueueSnack({
          message: 'Patient archived successfully!',
          color: 'success',
        });
      } catch (error) {
        console.error(error);
        log('archivePatient#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
    async onServiceSearch (searchText) {
      try {
        this.serviceSearching = true;
        const query = {
          facilityId: this.$activeOrganization.id,
          type: this.serviceType,
          limit: 100,
        };

        if (!_.isEmpty(searchText)) query.searchText = searchText;

        const res = await this.$store.dispatch('services/searchServices', query);

        this.services = res;
      } catch (e) {
        log(e);
      } finally {
        this.serviceSearching = false;
      }
    },
    onServiceTypeSelect (type) {
      this.serviceType = type || '';
      this.onServiceSearch();
    },
    onSearchDiagnosticTests (event) {
      log('onSearchDiagnosticTests#event: %O', event);
      if (event.type === 'laboratory') {
        this.labTestsSearchText = event.searchText;
      }
      if (event.type === 'radiology') {
        this.imagingTestsSearchText = event.searchText;
      }
    },
    async onOrdersFetch (patient) {
      this.fetching = true;
      try {
        log('onOrdersFetch#diagnosticType', this.diagnosticType);
        const types = this.diagnosticType
          ? _.get(DIAGNOSTIC_MEDICAL_TYPE_MAP, this.diagnosticType) || MEDICAL_TEST_ORDER_TYPES
          : MEDICAL_TEST_ORDER_TYPES;
        log('onOrdersFetch#types: %O', types);
        const { items, total } = await getMedicalRecords(this.$sdk, {
          patient,
          types,
          ...mapPagination(this.ordersPagination),
          latest: true,
        });
        this.orders = items;
        this.ordersTotal = total;
      } catch (error) {
        log('onOrdersFetch#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.fetching = false;
    },
  },
};
</script>

<style scoped>
  .round-img {
    border-radius: 100%;
  }

  .archived {
    background: repeating-linear-gradient(
      135deg,
      white,
      white 20px,
      #fdfdd0 20px,
      #fdfdd0 40px
    );
  }
</style>
