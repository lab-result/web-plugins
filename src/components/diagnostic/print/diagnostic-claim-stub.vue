<template lang="pug">
  .mc-page
    print-facility-header-default(
      v-if="printHeaderTemplate === 'default'"
      :facility="order.facility"
      @ready="$onHeaderReady"
    )
    print-facility-header-template2(
      v-if="printHeaderTemplate === 'template-2'"
      :facility="order.facility"
      @ready="$onHeaderReady"
    )
    img(
      v-if="printHeaderTemplate === 'custom'"
      :src="printHeaderPicURL"
      width="100%"
    )
    hr.my-3
    table(v-if="patient").mc-header-table
      tbody
        tr
          td
            span Name: {{patient.name | prettifyNameFirst}}
          td
            span Date Requested: {{createdAt | morph-date('MMM DD, YYYY')}}
        tr
          td
            span(v-if="patientDateOfBirth") Age: {{patientAge}} years old
            span(v-else) Age: N/A
          td
            span Sex: {{patient.sex | morph-capitalize}}
    hr.mt-3.mb-5

    v-layout(column align-center)
      h2(v-if="type === 'laboratory'") LABORATORY CLAIM STUB
      h2(v-else) IMAGING CLAIM STUB
    span(v-if="type === 'laboratory'") Laboratory Test/s:
    span(v-else) Test/s:
    ol.my-2
      li(v-for="diagnosticTest in tests" :key="diagnosticTest.id")
        | {{diagnosticTest.test.name}}
    v-layout(column).my-2
      span Diagnosis/Reason for Test/s:
      span(v-if="order.reason") {{order.reason}}
      span(v-else) None provided.
    v-layout(v-if="order.requestingPhysician" column)
      span Requesting Physician:
      span {{order.requestingPhysician}}
    v-layout(v-if="latestReleaseDate" column)
      span Claim your result by:
      span {{latestReleaseDate | morph-date('MMM DD, YYYY hh:mm A')}}

    v-spacer
    v-layout(row).mc-footer
      vue-qrcode(:value="orderId" :options="{ width: 70 }")
      span(v-if="type === 'laboratory'")
        | PRESENT THIS TO THE RECEPTIONIST/LABORATORY STAFF TO QUICKLY CLAIM
        | YOUR LABORATORY RESULT/S.
      span(v-else)
        | PRESENT THIS TO THE RECEPTIONIST/IMAGING STAFF TO QUICKLY CLAIM
        | YOUR LABORATORY RESULT/S.
</template>

<script>
import _ from 'lodash';
import VueQrcode from '@chenfengyuan/vue-qrcode';
import printReadyMixin from '../../../mixins/print-ready';
import PrintFacilityHeaderDefault from '../../print/facility-header-default';
import PrintFacilityHeaderTemplate2 from '../../print/facility-header-template2';
import { differenceInYears } from 'date-fns';

export default {
  components: {
    VueQrcode,
    PrintFacilityHeaderDefault,
    PrintFacilityHeaderTemplate2,
  },
  mixins: [printReadyMixin],
  data () {
    return {
      order: {},
    };
  },
  computed: {
    orderId () {
      return this.$route.params.id;
    },
    type () {
      return _.get(this.order, 'type');
    },
    patient () {
      return _.get(this.order, 'patient');
    },
    facility () {
      return _.get(this.order, 'facility');
    },
    tests () {
      return _.filter(_.get(this.order, 'tests'), test => !test.cancelledAt);
    },
    createdAt () {
      return _.get(this.order, 'createdAt');
    },
    printHeaderTemplate () {
      this.$log('computed#printHeaderTemplate#facility: %O', this.facility);
      return _.get(this.facility, 'mf_printHeaderTemplate.template') || 'default';
    },
    printHeaderPicURL () {
      return _.get(this.facility, 'mf_printHeaderTemplate.picURL');
    },
    patientDateOfBirth () {
      return _.get(this.order, 'patient.dateOfBirth');
    },
    patientAge () {
      return differenceInYears(new Date(), new Date(this.patientDateOfBirth));
    },
    latestReleaseDate () {
      const latestReleaseDate = _.map(_.get(this.order, 'tests'),
        t => t.estimatedReleaseAt)
        .filter(Boolean)
        .sort((a, b) => a - b)
        .pop();
      this.$log(`watch#latestReleaseDate: ${latestReleaseDate}`);
      return latestReleaseDate;
    },
  },
  created () {
    this.$initLogger('print-diagnostic-claim-stub');
    this.init();
  },
  methods: {
    async init () {
      this.order = await this.$store.dispatch('diagnostic/getOrder', this.orderId);
      if (this.printHeaderTemplate === 'custom') {
        this.$registerPicHeader(this.printHeaderPicURL);
      }
      await this.$waitUntilPrintReady();
      this.$nextTick(() => {
        window.print();
        this.$router.go(-1);
      });
    },
  },
};
</script>

<style scoped>
  @media print {
    .mc-hide {
      display: none;
    }

    .mc-footer {
      position: fixed;
      bottom: 0;
      width: 100%;
    }
  }

  .mc-header-table {
    table-layout: fixed;
    width: 100%;
    border-collapse: collapse;
  }

  .mc-header-table td {
    padding: 5px;
  }
</style>
