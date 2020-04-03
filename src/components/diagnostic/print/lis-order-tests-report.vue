<template lang="pug">
  .root
    //- header
    print-facility-header-default(
      v-if="printHeaderTemplate === 'default'"
      :facility="organization"
      @ready="$onHeaderReady"
    )
    print-facility-header-template2(
      v-if="printHeaderTemplate === 'template-2'"
      :facility="organization"
      @ready="$onHeaderReady"
    )
    img(
      v-if="printHeaderTemplate === 'custom'"
      :src="printHeaderPicURL"
      width="100%"
    )

    //- metadata
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

    //- order test table
    v-layout(column align-center).mt-5
      h2 Specimen Tracking Log Sheet
    table.mc-table.scroll-horizontal
      thead
        tr
          th RECEIVED BY
          th CONTROL NO
          th SEND-OUT ID NO
          th ACCOUNT NO
          th COMPANY
          th NAME
          th AGE
          th SEX
          th EXAM TYPE
          th TEST DONE
          th DIAGNOSIS
          th APPROVAL CODE
          th OR NO.
          th REQUESTING PHYSICIAN
          th COLLECTED AT
          th DUE DATE
          th SPECIMEN NOTE
      tbody
        tr(v-for="item in items" :key="item.id")
          //- specimen
          td(v-if="item.receivedByDetails && item.receivedByDetails.name")
              | {{item.receivedByDetails | extract-prop('name') | prettify-name}}
          td(v-else)
            | -
          td {{item.specimen || '-'}}
          td {{item.id || '-'}}

          //- member ID
          td {{item.patient | extract-prop('insuranceCards') | prettify-insurance-cards}}

          //- insurer
          td {{item.patient | extract-prop('companies') | prettify-companies}}

          //- patient
          td(v-if="item.patient && item.patient.name")
            | {{item.patient | extract-prop('name') | prettify-name}}
          td(v-else)
            | -
          td(v-if="item.patient && item.patient.dateOfBirth")
            | {{item.patient | extract-prop('dateOfBirth') | compute-age(preparedAt)}}
          td(v-else)
            | -
          td(v-if="item.patient && item.patient.sex")
            | {{item.patient | extract-prop('sex')}}
          td(v-else)
            | -

          //- order
          td {{item.tags | join-array}}
          td {{item.testName || '-'}}
          td {{item.reason || '-'}}
          td {{item.invoiceItemCoverageApprovalCodes | join-array}}
          td {{item.invoiceOR || '-'}}
          td {{item.requestingPhysician || '-'}}

          //- misc
          td(v-if="item.specimenCollectedAt")
            | {{item.specimenCollectedAt | morph-date('MM/DD/YY h:mm A')}}
          td(v-else)
            | -
          td(v-if="item.estimatedReleaseAt")
            | {{item.estimatedReleaseAt | morph-date('MM/DD/YY h:mm A')}}
          td(v-else)
            | -
          td {{item.specimenNote || '-'}}

    //- sig
    v-layout(row justify-space-between).mt-5
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
import _ from 'lodash';
import datefns from 'date-fns';
import PrintReadyMixin from '../../../mixins/print-ready';
import PrintFacilityHeaderDefault from '../../print/facility-header-default';
import PrintFacilityHeaderTemplate2 from '../../print/facility-header-template2';
import { prettifyNameFirst } from '../../../utils/string';

/**
 * @typedef {import('@mycure/sdk').DiagnosticOrderTestsReport} DiagnosticOrderTestsReport
 * @typedef {import('@mycure/sdk').Organization} Organization
 */

export default {
  components: {
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
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
  mixins: [PrintReadyMixin],
  props: {
    /** @type {DiagnosticOrderTestsReport} */
    report: {
      type: Object,
      default: undefined,
    },
    /** @type {Organization} */
    organization: {
      type: Object,
      default: undefined,
    },
    loading: Boolean,
  },
  computed: {
    printHeaderTemplate () {
      return _.get(this.organization, 'mf_printHeaderTemplate.template') || 'default';
    },
    printHeaderPicURL () {
      return _.get(this.organization, 'mf_printHeaderTemplate.picURL');
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
  async mounted () {
    if (this.printHeaderTemplate === 'custom') {
      this.$registerPicHeader(this.printHeaderPicURL);
    }
    await this.$waitUntilPrintReady();
    // FIXME: find better way to await print ready
    setTimeout(() => {
      window.print();
      this.$router.go(-1);
    }, 1000);
  },
};
</script>

<style scoped>
@media print{
  @page {
    size: legal landscape;
  }
}

.root {
  font-size: 9px;
}

.scroll-horizontal {
  overflow-x: auto;
}

.mc-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
}

.mc-table th, .mc-table td {
  text-align: left;
  border: 1px solid lightgrey;
  padding: 5px;
  word-wrap: break-word;
  max-width: 1px;
  hyphens: auto;
}

.mc-table th {
  height: 50px;
  background-color: #ebedee;
}

.mc-table td {
  height: 30px;
}

.header-size {
  font-size: 14px;
}
</style>
