<template lang="pug">
  v-card
    v-toolbar(flat)
      v-layout(row align-center)
        h2 Specimen Tracking Report
        v-chip(
          :color="statusColor"
          dark
        ).ml-2 {{statusText}}
        v-spacer
        v-btn(
          v-if="canReceive"
          color="primary"
          large
          @click="onReceive"
        ) Receive
        v-btn(
          color="success"
          large
          @click="onPrint"
        )
          v-icon mdi-printer
          | Print

    v-card-text
      //-metadata
      v-layout(column)
        span.header-size
          b Prepared for:
          |  {{preparedFor || '-'}}
        span.header-size
          b Clinic from:
          |  {{organizationName || '-'}}
        span.header-size
          b Send to:
          |  {{sendOutCenterName || '-'}}

      //- order tests
      v-layout(column).my-5
        generic-table(
          :items="items"
          :headers="headers"
          :loading="loading"
          hide-toolbar
          flat
          :slotted-header="canReceive"
        )
          tr(slot="headers" slot-scope="props")
            th(@click.stop="onSelectAll(!areAllSelected)")
              v-layout(column align-center)
                v-checkbox(
                  color="primary"
                  hide-details
                  readonly
                  :style="{ 'width': '20' }"
                  :input-value="areAllSelected"
                  :indeterminate="areSomeSelected && !areAllSelected"
                )
            th(
              v-for="header in props.headers"
              :key="header.text"
              :style="{ 'width': header.width }"
            ).text-xs-left
              v-layout(row).ma-0.pa-0
                span {{ header.text }}

          tr(slot="items" slot-scope="props")
            // checkbox for receiving
            td(v-if="canReceive")
              v-layout(column align-center)
                v-chip(
                  v-if="props.item.receivedAt"
                  color="primary"
                  small
                  dark
                )
                  | Received
                v-checkbox(
                  v-else
                  color="primary"
                  :input-value="selectedMap[props.item.id]"
                  @change="onSelectionToggle(props.item, $event)"
                  hide-details
                )

            //- specimen
            td(v-if="props.item.receivedByDetails && props.item.receivedByDetails.name")
              | {{props.item.receivedByDetails | extract-prop('name') | prettify-name}}
            td(v-else)
              | -
            td {{props.item.specimen || '-'}}
            td {{props.item.id || '-'}}

            //- member ID
            td {{props.item.patient | extract-prop('insuranceCards') | prettify-insurance-cards}}

            //- insurer
            td {{props.item.patient | extract-prop('companies') | prettify-companies}}

            //- patient
            td(v-if="props.item.patient && props.item.patient.name")
              | {{props.item.patient | extract-prop('name') | prettify-name}}
            td(v-else)
              | -
            td(v-if="props.item.patient && props.item.patient.dateOfBirth")
              | {{props.item.patient | extract-prop('dateOfBirth') | compute-age(preparedAt)}}
            td(v-else)
              | -
            td(v-if="props.item.patient && props.item.patient.sex")
              | {{props.item.patient | extract-prop('sex')}}
            td(v-else)
              | -

            //- order
            td {{props.item.tags | join-array}}
            td {{props.item.testName || '-'}}
            td {{props.item.reason || '-'}}
            td {{props.item.invoiceItemCoverageApprovalCodes | join-array}}
            td {{props.item.invoiceOR || '-'}}
            td {{props.item.requestingPhysician || '-'}}

            //- misc
            td(v-if="props.item.specimenCollectedAt")
              | {{props.item.specimenCollectedAt | morph-date('MM/DD/YY h:mm A')}}
            td(v-else)
              | -
            td(v-if="props.item.estimatedReleaseAt")
              | {{props.item.estimatedReleaseAt | morph-date('MM/DD/YY h:mm A')}}
            td(v-else)
              | -
            td {{props.item.specimenNote || '-'}}

      //- sig
      v-layout(row justify-space-between)
        v-flex(v-if="preparedAt" grow)
          v-layout(column align-center)
            span
              b Prepared by:
              |  {{preparerName}}
            span.grey--text.text--darken-3
              | {{preparedAt | morph-date('MMM DD, YYYY h:mm A')}}
        v-flex(v-if="pickedUpBy" grow)
          v-layout(column align-center)
            span
              b Picked up by:
              |  {{pickedUpBy}}
            span.grey--text.text--darken-3
              | {{pickedUpAt | morph-date('MMM DD, YYYY h:mm A')}}
        v-flex(v-if="verifiedAt" grow)
          v-layout(column align-center)
            span
              b Verified by:
              |  {{verifierName}}
            span.grey--text.text--darken-3
              | {{verifiedAt | morph-date('MMM DD, YYYY h:mm A')}}
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
// constants
// utils
import _ from 'lodash';
import datefns from 'date-fns';
import { prettifyNameFirst } from '../../utils/string';
import { initLogger } from '../../utils/logger';

const log = initLogger('DiagnosticOrderTestsReport');

/**
 * @typedef {import('@mycure/sdk').DiagnosticOrderTestsReport} DiagnosticOrderTestsReport
 *
 * @emits receive
 * @emits print
 */

const BASE_HEADERS = [
  { text: 'Received by', value: 'receivedBy', sortable: false },
  { text: 'Control No', value: 'specimen', sortable: false },
  { text: 'Send-out ID No', value: 'id', sortable: false },
  { text: 'Account No', value: 'patient.insuranceCards', sortable: false },
  { text: 'Company', value: 'patient.companies', sortable: false },
  { text: 'Name', value: 'patient.name', sortable: false },
  { text: 'Age', value: 'patient.dateOfBirth', sortable: false },
  { text: 'Sex', value: 'patient.sex', sortable: false },
  { text: 'Exam Type', value: 'tags', sortable: false },
  { text: 'Test Done', value: 'testName', sortable: false },
  { text: 'Diagnosis', value: 'reason', sortable: false },
  { text: 'Approval Code', value: 'invoiceItemCoverageApprovalCodes', sortable: false },
  { text: 'OR No.', value: 'invoiceOR', sortable: false },
  { text: 'Requesting Physician', value: 'requestingPhysician', sortable: false },
  { text: 'Collected At', value: 'specimenCollectedAt', sortable: false },
  { text: 'Due Date', value: 'estimatedReleaseAt', sortable: false },
  { text: 'Specimen Note', value: 'specimenNote', sortable: false },
];
const STATUS_DETAILS_MAP = {
  delivered: {
    text: 'Delivered',
    color: 'error',
  },
  partial: {
    text: 'Partially Received',
    color: 'primary',
  },
  received: {
    text: 'Received',
    color: 'success',
  },
};

export default {
  components: {
    GenericTable,
  },
  filters: {
    extractProp (patient, prop) {
      return _.get(patient, prop);
    },
    computeAge (dateOfBirth, referenceDate) {
      if (!dateOfBirth) return;
      return datefns.differenceInYears(referenceDate, dateOfBirth);
    },
    prettifyInsuranceCards (insuranceCards) {
      if (_.size(insuranceCards) === 1) return _.get(insuranceCards, '[0].number');
      return _.map(insuranceCards, c => `${c.insurerName} - ${c.number}`).join(', ');
    },
    prettifyCompanies (companies) {
      if (_.size(companies) === 1) return _.get(companies, '[0].name');
      return _.map(companies, 'name').join(', ');
    },
    joinArray (array) {
      if (_.isEmpty(array)) return '-';
      return _.join(array, ', ');
    },
  },
  props: {
    /** @type {DiagnosticOrderTestsReport} */
    report: {
      type: Object,
      default: undefined,
    },
    selectedMap: {
      type: Object,
      default: undefined,
    },
    status: {
      type: String,
      default: undefined,
    },
    loading: Boolean,
    canReceive: Boolean,
    areAllSelected: Boolean,
    areSomeSelected: Boolean,
  },
  computed: {
    statusColor () {
      return _.get(STATUS_DETAILS_MAP, [this.status, 'color']);
    },
    statusText () {
      return _.get(STATUS_DETAILS_MAP, [this.status, 'text']);
    },
    preparedFor () {
      return _.get(this.report, 'preparedFor');
    },
    preparedAt () {
      return _.get(this.report, 'preparedAt');
    },
    organizationName () {
      return _.get(this.report, 'organization.name');
    },
    sendOutCenterName () {
      return _.get(this.report, 'sentOutTo.name');
    },
    headers () {
      return this.canReceive
        ? BASE_HEADERS
        : _.filter(BASE_HEADERS, h => !h.receivingOnly);
    },
    items () {
      return _.get(this.report, 'items');
    },
    preparerName () {
      const name = _.get(this.report, 'preparedBy.name');
      if (!name) return '--';
      return prettifyNameFirst(name);
    },
    pickedUpBy () {
      return _.get(this.report, 'pickedUpBy');
    },
    pickedUpAt () {
      return _.get(this.report, 'pickedUpAt');
    },
    verifierName () {
      const name = _.get(this.report, 'verifiedBy.name');
      if (!name) return '--';
      return prettifyNameFirst(name);
    },
    verifiedAt () {
      return _.get(this.report, 'verifiedAt');
    },
  },
  methods: {
    onSelectionToggle (orderTest, selected) {
      const event = { orderTest, selected };
      log('onSelectionToggle#event: %O', event);
      this.$emit('select', event);
    },
    onSelectAll (selected) {
      log(`onSelectAll#selected: ${selected}`);
      this.$emit('select:all', selected);
    },
    onReceive () {
      log('onReceive: emitting');
      this.$emit('receive');
    },
    onPrint () {
      log('onPrint: emitting');
      this.$emit('print');
    },
  },
};
</script>

<style scoped>
.header-size {
  font-size: 14pt;
}
</style>
