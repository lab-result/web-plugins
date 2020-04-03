<template lang="pug">
  v-card(:flat="flat").mb-2
    v-toolbar(flat :class="{ archived: isArchived }")
      v-avatar.mr-2
        img(:src="patient.picURL" v-if="patient.picURL")
        img(src="@/assets/images/person-placeholder.png" v-else)
      h2 {{patientName}}
        template(v-if="patient.tags")
          v-chip(v-for="(tag, key) in patient.tags" :key="key" small) {{ tag }}
      v-spacer
      v-tooltip(v-if="!readOnly" bottom)
        v-menu(offset-y slot="activator" left)
          v-btn(icon flat color="primary" slot="activator")
            v-icon mdi-dots-horizontal
          v-list
            v-list-tile(:to="{ name: 'create-patient', params: { id, action: 'update' } }")
              v-list-tile-action
                v-icon mdi-pencil
              v-list-tile-content
                v-list-tile-title Edit Patient
            br
            v-divider
            v-list-tile(@click="archive")
              v-list-tile-action
                v-icon.error--text mdi-delete
              v-list-tile-content
                v-list-tile-title.error--text Archive Patient
        | More options
    v-alert(
      :value="isArchived"
      type="info"
      color="#fdfd98"
    ).black--text This patient has been archived.
    v-progress-linear(:indeterminate="true" height="4" v-if="loading").progress-linear
    v-card-text
      v-layout(:row="!compact" :column="compact" wrap)
        v-flex(xs12 md6 :class="{ 'mb-2': !compact }")
          span {{patient.sex | morph-capitalize}} • {{calcExactAgeUtil(patient.dateOfBirth)}} • Blood Type: {{patient.bloodType || '--'  | morph-capitalize}}
          br(v-if="HMOs")
          span(:class="{ 'mb-2': compact }")
            | {{patient.dateOfBirth | morph-date('MMM DD, YYYY')}} • {{patient.mobileNo || 'Mobile: --'}}
        v-flex(xs12 md6 :class="{ 'mt-2': compact, 'mb-2': !compact }")
          span(v-if="HMOs" style="white-space: pre-wrap") {{HMOs}}
          br(v-if="HMOs && companies")
          span(v-if="companies" style="white-space: pre-wrap") {{ companies }}
      v-layout(:row="!compact" :column="compact" wrap)
        v-flex(xs12 md12 v-if="(patient.medicalNote || {}).text").mb-2
          span
            b Notes:
            br
            i {{patient.medicalNote ? patient.medicalNote.text : 'No additional notes'}}
</template>

<script>
// components
// constants
// utils
import _ from 'lodash';
import { format } from 'date-fns';
import { calcExactAgeUtil } from '../../utils/date';
import { getPatient } from '../../services/patients';
import { prettifyNameFirst, compile } from '../../utils/string';
import { initLogger } from '../../utils/logger';

export const COMPONENT_NAME = 'PatientDetails';
const log = initLogger(COMPONENT_NAME);

export default {
  props: {
    readOnly: {
      type: Boolean,
      default: undefined,
    },
    flat: {
      type: Boolean,
      default: undefined,
    },
    id: {
      type: String,
      default: undefined,
    },
    compact: {
      type: Boolean,
      default: undefined,
    },
  },
  data () {
    return {
      loading: false,
      patient: {},
      calcExactAgeUtil: calcExactAgeUtil,
    };
  },
  computed: {
    patientName () {
      return prettifyNameFirst(this.patient.name);
    },
    isArchived () {
      return !_.isNil(this.patient.archivedAt);
    },
    HMOs () {
      log('computed#insuranceCards: %O', this.patient.insuranceCards);
      log('computed#HMOs: %O', this.patient.hmos);
      if (_.isEmpty(this.patient.insuranceCards) && _.isEmpty(this.patient.hmos)) {
        return null;
      }

      return ((this.patient || {}).insuranceCards || [])
        .map(card => {
          const hmo = this.patient.hmos.filter(h => h.id === card.insurance)[0];
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
      // return _.map(this.patient.hmos, 'name').join(', ');
    },
    companies () {
      log('computed#companies: %O', this.patient.companies);
      log('computed#companyPartners: %O', this.patient.companyPartners);
      if (_.isEmpty(this.patient.companies)) {
        return null;
      }

      return ((this.patient || {}).companies || [])
        .map(card => {
          const company = (this.patient.companyPartners || []).filter(c => c.id === card.id || c.id === card.company)[0];
          const formatCompany = compile`${'name'} - ${'companyId'}`;
          const name = _.get(company, 'name') || _.get(company, 'insurerName') || _.get(card, 'name') || '';
          const companyId = _.get(card, 'companyId');

          return formatCompany({ name, companyId });
        })
        .join(', ');
    },
  },
  watch: {
    id () {
      this.init();
    },
  },
  async created () {
    if (this.id) await this.init();
  },
  mounted () {
  },
  methods: {
    async init () {
      try {
        log('init#id: ', this.id);
        this.loading = true;
        this.patient = await getPatient(this.$sdk, { id: this.id });
        await this.$store.dispatch('insurance-contracts/getInsuranceContracts', this.$activeOrganization.id);
      } catch (error) {
        console.log(error);
        log('init#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
    async archive () {
      try {
        log('init#id: ', this.id);
        this.loading = true;
        await this.$sdk.service('medical-patients').update(this.id, { archive: true });
        this.$router.go(-1);
      } catch (error) {
        console.error(error);
        log('archive#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
  .quote {
    border-left-color: #0099cc;
    border-left: 2px;
  }

  .archived {
    background: repeating-linear-gradient(
      135deg,
      white,
      white 20px,
      #fdfd98 20px,
      #fdfd98 40px
    );
  }
</style>
