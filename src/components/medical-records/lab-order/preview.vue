<template lang="pug">
  div
    v-layout(row wrap)
      v-dialog(
        v-model="selectTestDialog"
        lazy
        persistent
        scrollable
        width="500"
      )
        v-card
          v-toolbar(flat)
            h2 Print Test Result
            v-spacer
            v-btn(icon @click.stop="selectTestDialog = false")
              v-icon mdi-close
          v-card-text
            p.mb-0 Select a test to print:
            v-list
              v-list-tile(
                v-for="(test, key) in tests"
                :key="key"
                @click="selectTest(test.id)"
              )
                v-list-tile-content
                  v-list-tile-title {{ test.name }}
      record-options(
        ref="recordOptionsRef"
        v-if="!removeOptions"
        printable
        printable-results
        order-test-type="lis"
        print-button-text-suffix="Lab Order"
        :record="record"
        :read-only="readOnly"
        :hide-edit-overlay="inDrawer"
        :order-test-id="orderTestId"
        @select-test="selectTestDialog = true"
      )
      v-flex(grow).pa-2
        h5.grey--text Diagnosis
        span {{record.diagnosisCode}} - {{record.diagnosisText}}
      v-flex(xs12).pa-2
        h5.grey--text Test Reason
        span {{record.reason}}
      v-flex(grow).pa-2
        h5.grey--text Test Requested
        ol
          template(v-for="(result, key) in labTestResults")
            li(:key="key") {{result.test.name || '-'}}
              |
              v-chip(
                dark
                small
                :color="getColor(getStatus(result))"
              ) {{ getStatus(result) }}
            span.mb-4 Specimen ID: {{result.specimen || '-'}}
          br

      //- results
      template(v-for="section in labTestResultsGroupedBySection")
        v-flex(xs12)
          h3(v-if="section.section && section.section !== 'undefined'" align="center").primary--text {{section.section | morph-uppercase}}
          template(v-for="labTestResult in section.results")
            h5(align="center") {{labTestResult | prop('test.name') | morph-uppercase}}
            table(width="100%")
              thead.grey.lighten-2
                template(v-if="hasSiMeasures(section.results)")
                  tr
                    td(rowspan="3" width="100").pa-1
                      small Test
                  tr
                    td(colspan="3")
                      small CONV.
                    td(colspan="3")
                      small S.I.
                  tr
                    td(width="50")
                      small RESULT
                    td(width="50")
                      small UNIT
                    td(width="50")
                      small REF. RANGE
                    td(width="50")
                      small RESULT
                    td(width="50")
                      small UNIT
                    td(width="50")
                      small REF. RANGE
                template(v-else)
                  tr
                    th
                      small Test
                    th
                      small RESULT
                    th
                      small UNIT
                    th
                      small REF. RANGE
              tbody
                tr(v-for="result in labTestResult.results")
                  td.pa-1
                    small {{result.measure.name}}
                  td.pa-1
                    small(v-html="result.value")
                  td.pa-1
                    small {{result.measure.unit}}
                  td.pa-1
                    small {{result | prop('measure.referenceRanges') | select-reference-range(record, patient) | format-reference-range}}
                  template(v-if="hasSiMeasures(section.results)")
                    td.pa-1
                      small {{result.sivalue}}
                    td.pa-1
                      small {{result.measure.siunit}}
                    td.pa-1
                      small {{result | prop('measure.referenceRanges') | select-reference-range(record, patient) | format-si-reference-range}}

      //- attachments
      template(v-if="hasAttachments")
        v-flex(xs12).pa-1.my-3
          h3 Attachments
          v-layout(row)
            img(
              v-for="attachment in labTestResultsAttachmentURLs"
              :src="attachment"
              height="100px"
              width="100px"
            ).mc-attachment
</template>

<script>
// components
import RecordOptions from '../record-options';
// constants
import { STATUS_COLOR_MAP } from '../../diagnostic/constants';
// utils
import _ from 'lodash';
import { differenceInYears } from 'date-fns';
import { initLogger } from '../../../utils/logger';
import { guardRight } from '../../../utils/string';

const log = initLogger('LabOrderPreview');

export default {
  components: {
    RecordOptions,
  },
  filters: {
    prop (item, prop) {
      return _.get(item, prop);
    },
    selectReferenceRange (referenceRanges, record, patient) {
      if (!record || !patient) return;
      const age = differenceInYears(record.createdAt, patient.dateOfBirth);

      return _.find(referenceRanges, r => {
        // sex should match
        if (!_.isNil(r.sex) && r.sex !== 'all' && r.sex !== patient.sex) return false;
        // age should be within range
        if (!_.isNil(r.ageMin) && age < r.ageMin) return false;
        if (!_.isNil(r.ageMax) && age > r.ageMax) return false;
        // tests exhausted
        return true;
      });
    },
    formatReferenceRange (refRange) {
      if (!refRange) return;
      return guardRight`${refRange.min}-${refRange.max}`;
    },
    formatSiReferenceRange (refRange) {
      if (!refRange) return;
      return guardRight`${refRange.simin}-${refRange.simax}`;
    },
  },
  props: {
    record: {
      type: Object,
      default: undefined,
    },
    patient: {
      type: Object,
      default: undefined,
    },
    readOnly: Boolean,
    removeOptions: Boolean,
    inDrawer: Boolean,
  },
  data () {
    return {
      orderTests: [],
      selectTestDialog: false,
    };
  },
  computed: {
    labTestResults () {
      const results = (this.record.tests || []).map(test => {
        const orderTest = (this.orderTests || []).find(orderTest => orderTest.test === test.id);

        return {
          ..._.omit(orderTest, '$populated'),
          results: _.includes(['sent-out', 'cancelled'], this.getStatus(orderTest))
            ? []
            : _.map(_.get(orderTest, 'results'), r => ({
              ...r,
              measure: _.find(_.get(orderTest, '$populated.measures'), m => m.id === r.measure),
            })),
          test,
        };
      });

      log('computed#labTestResults: %O', results);
      return results;
    },
    labTestResultsGroupedBySection () {
      const grouped = _.groupBy(this.labTestResultsWithResult, 'test.section');

      // shape should now be Object<DiagnosticTest#section,LabTestResult[]>
      // convert this to Section[]
      // where Section is { section: DiagnosticTest#section, results: LabTestResult[] }
      const sectionGroups = _.map(grouped, (results, section) => ({ section, results }));
      return _.sortBy(sectionGroups, 'section');
    },
    labTestResultsWithResult () {
      return _.filter(this.labTestResults, res => !_.isEmpty(res.results));
    },
    labTestResultsAttachmentURLs () {
      return _.filter(_.flatMap(this.labTestResults, 'attachmentURLs'), item => !_.isEmpty(item));
    },
    hasAttachments () {
      return !_.isEmpty(this.labTestResultsAttachmentURLs);
    },
    orders () {
      if (this.record?.$populated?.results?.length) {
        return this.record.$populated.results;
      }
      return [];
    },
    results () {
      if (this.record?.$populated?.results?.length) {
        return this.record.$populated.results[0].results;
      }
      return [];
    },
    sections () {
      if (this.orders?.[0]?.$populated?.tests) {
        const tests = this.orders[0].$populated.tests;
        return _.groupBy(tests, 'section');
      }
      return undefined;
    },
    allSections () {
      if (!_.isEmpty(this.orders)) {
        log('allSections#record: %O', this.record);
        log('allSections#orders: %O', this.orders);
        const res = this.orders
          .map(o => {
            if (o.$populated && o.$populated.tests) {
              const tests = o.$populated.tests;
              return _.groupBy(tests, 'section');
            }

            return null;
          })
          .filter(Boolean);
        log('allSections#allSections: %O', res);
      }
      return undefined;
    },
    measures () {
      if (this.orders?.[0]?.$populated?.measures) {
        return this.orders[0].$populated.measures;
      }
      return undefined;
    },
    tests () {
      return _.get(this.record, 'tests') || [];
    },
    orderTestId () {
      return _.get(this.orderTests, '[0].id');
    },
  },
  async created () {
    try {
      log('created#record: %O', this.record);
      const orderTests = await this.$store.dispatch(
        'diagnostic/getOrderTestsByMedicalRecordOrderId',
        {
          medicalRecordOrder: this.record.id,
          type: 'laboratory',
        }
      );
      log('created#orderTests: %O', orderTests);
      this.orderTests = orderTests;
    } catch (e) {
      log('created#error: %O', e);
    }
  },
  mounted () {
    log('mounted#patient: %O', this.patient);
  },
  methods: {
    hasSiMeasures (labTestResults) {
      return _.some(
        labTestResults,
        labTestResult => _.some(
          _.get(labTestResult, 'results'),
          r => !_.isEmpty(_.get(r, 'measure.siunit'))
        )
      );
    },
    getConvValue (id) {
      const result = this.results.find(result => result.test === id);
      return result ? result.value : '';
    },
    getSIValue (id) {
      const result = this.results.find(result => result.test === id);
      return result ? result.sivalue : '';
    },
    getStatus (testResult) {
      if (_.isEmpty(testResult)) return;
      const {
        completedAt,
        verifiedAt,
        finalizedAt,
        sentOutAt,
        cancelledAt,
      } = testResult;

      if (cancelledAt) return 'cancelled';
      if (sentOutAt && !completedAt && !finalizedAt) return 'sent-out';
      if (!completedAt) return 'pending';
      if (!verifiedAt) return 'completed';
      if (!finalizedAt) return 'verified';
      return 'finalized';
    },
    getColor (status) {
      return STATUS_COLOR_MAP[status];
    },
    selectTest (testId) {
      log('selectTest#testId: %O', testId);
      /**
       * TOOD: handle more than one orderTest to display
       * in the dialog
       */

      const orderTest = (this.orderTests || [])
        .find(orderTest => orderTest.test === testId);
      if (!orderTest) {
        return this.$enqueueSnack({
          message: 'Laboratory Order Test doesn\'t have test results yet.',
          color: 'warning',
        });
      }
      log('selectTest#orderTest: %O', orderTest);
      this.$refs.recordOptionsRef.printDiagnosticResults(orderTest.id);
      this.selectTestDialog = false;
    },
  },
};
</script>

<style scoped>
table {
  border-collapse: collapse;
}

table,
th,
td {
  border: 1px solid #f5f5f5;
}

.mc-attachment {
  object-fit: cover;
}
</style>
