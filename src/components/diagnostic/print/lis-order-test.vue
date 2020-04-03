<template lang="pug">
  div
    print-diagnostic-order-test(
      :order="order"
      :order-test="orderTest"
      :facility="facility"
      @ready="$onHeaderReady"
    )
      v-layout(column align-center)
        h2.blue--text {{section | morph-uppercase}}
        v-layout(column align-center).mt-2
          h3 {{testName}}

        //- table results
        table(v-if="hasTableResults").mc-table
          colgroup
            col(:class="testColumnClass")
          thead
            template(v-if="hasSiMeasures")
              tr
                th(rowspan="2") TEST
                th(colspan="3") Conventional
                th(colspan="3") SI
              tr
                th RESULT
                th UNIT
                th RANGE
                th RESULT
                th UNIT
                th RANGE
            template(v-else)
              tr
                th TEST
                th RESULT
                th(v-if="hasUnits") UNIT
                th(v-if="hasRanges") RANGE
          tbody
            template(v-for="(result, index) in tableResults")
              tr(
                v-if="getSetHeader(index)"
                :key="getSetHeader(index)"
              ).mc-set-header
                td.mc-set-label {{getSetHeader(index)}}
                td(:colspan="totalColumns - 1")
              tr(
                v-if="getSubsetHeader(index)"
                :key="getSubsetHeader(index)"
              ).mc-set-header
                td.pl-3 {{getSubsetHeader(index)}}
                td(:colspan="totalColumns - 1")
              tr(:key="result.measure.id")
                td(:class="getClass(result.measure)")
                  | {{result.measure.name}}
                td
                  v-icon(
                    v-if="showIndicatorsOnPrint && getReferenceRangeIndication(isWithinReferenceRange(result))"
                    :color="getReferenceRangeColor(isWithinReferenceRange(result))"
                    small
                  ).mc-margin-bottom.mc-indicator
                    | {{getReferenceRangeIndication(isWithinReferenceRange(result))}}
                  | {{result.value}}
                td(v-if="hasSiMeasures || hasUnits") {{result.measure.unit}}
                td(v-if="hasSiMeasures || hasRanges") {{getReferenceRangeText(orderTest, result.measure)}}
                template(v-if="result.measure.siunit")
                  td
                    v-icon(
                      v-if="showIndicatorsOnPrint && getReferenceRangeIndication(isWithinSiReferenceRange(result))"
                      :color="getReferenceRangeColor(isWithinSiReferenceRange(result))"
                      small
                    ).mc-margin-bottom.mc-indicator
                      | {{getReferenceRangeIndication(isWithinSiReferenceRange(result))}}
                    | {{result.sivalue}}
                  td {{result.measure.siunit}}
                  td {{getSiReferenceRangeText(orderTest, result.measure)}}
                template(v-else-if="hasSiMeasures")
                  td
                  td
                  td
              tr(v-if="hasSetTotal(index)")
                td
                  i Total
                td {{getSetTotal(index)}}
                td(v-if="hasSiMeasures || hasUnits")
                td(v-if="hasSiMeasures || hasRanges") {{getBreakdownRangeText(result.measure)}}
                td(v-if="hasSiMeasures" colspan="3")

        //- html results
        v-layout(v-if="hasHtmlResults" column).mt-3.mc-width
          v-layout(
            v-for="htmlResult in htmlResults"
            :key="htmlResult.measure.id"
            column
          )
            b(v-if="!hideHtmlMeasureName") • {{htmlResult.measure.name}}
            div(v-html="htmlResult.value").result-preview

        //- attachments
        v-layout(v-if="hasAttachments" row).mt-3.mc-width
          v-flex(xs12).pa-1
            h3 Attachments
            v-layout(row)
              img(
                v-for="attachment in orderTest.attachmentURLs"
                :src="attachment"
                class="mc-attachment"
                height="100px"
                width="100px"
              )

        //- remarks
        v-layout(v-if="showRemarksOnPrint && orderTest.remarks").mt-3.mc-width
          v-flex(xs12).pa-1
            h3 Remarks
            p {{orderTest.remarks}}

        //- disclaimer
        v-layout(v-if="disclaimer").mt-3.mc-width
          v-flex(xs12).pa-1
            p {{disclaimer}}

        //- signature
        v-layout(row justify-space-around align-end).my-5.mc-sig.mc-width
          v-flex(v-if="orderTest.technician" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="technicianESigValue"
                :src="technicianESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(technicianName)}}
              span(v-if="orderTest.technician.PRCLicenseNo")
                | PRC License No. {{orderTest.technician.PRCLicenseNo}}
              span {{technicianLabel}}
          v-flex(v-if="orderTest.verifiedByDetails" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="verifiedByDetailsESigValue"
                :src="verifiedByDetailsESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(verifierName)}}
              span(v-if="verifierLicenseNo")
                | PRC License No. {{verifierLicenseNo}}
              span {{verifiedByText}}
          v-flex(v-if="orderTest.pathologist" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="pathologistESigValue"
                :src="pathologistESigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(pathologistName)}}
              span(v-if="orderTest.pathologist.doc_PRCLicenseNo")
                | PRC License No. {{orderTest.pathologist.doc_PRCLicenseNo}}
              span Pathologist
</template>

<script>
import _ from 'lodash';
import printReadyMixin from '../../../mixins/print-ready';
import PrintDiagnosticOrderTest from '../print/diagnostic-order-test';
import { guard, formatDecimal, prettifyProfessionalName } from '../../../utils/string';
import { differenceInYears } from 'date-fns';

export default {
  components: {
    PrintDiagnosticOrderTest,
  },
  mixins: [printReadyMixin],
  data () {
    return {
      orderTest: {},
    };
  },
  computed: {
    technicianESigValue () {
      const base64 = this.orderTest?.technician?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.technician?.['doc_eSignatureURL'];
    },
    pathologistESigValue () {
      const base64 = this.orderTest?.pathologist?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.pathologist?.['doc_eSignatureURL'];
    },
    verifiedByDetailsESigValue () {
      const base64 = this.orderTest?.verifiedByDetails?.['doc_eSignatureDataURI'];
      if (base64) return base64;
      return this.orderTest?.verifiedByDetails?.['doc_eSignatureURL'];
    },
    activeOrganization () {
      return this.$activeOrganization;
    },
    showIndicatorsOnPrint () {
      return this.activeOrganization?.configLIS?.showIndicatorsOnPrint;
    },
    showRemarksOnPrint () {
      return this.activeOrganization?.configLIS?.showRemarksOnPrint;
    },
    verifiedByText () {
      return this.activeOrganization?.configFacility?.languages?.diagnosticVerifiedBy ||
        'Verified by';
    },
    orderTestId () {
      return this.$route.params.id;
    },
    facility () {
      return this.orderTest?.facility || {};
    },
    patient () {
      return this.orderTest?.patient;
    },
    order () {
      return this.orderTest?.order;
    },
    testName () {
      return this.orderTest?.test?.name;
    },
    section () {
      return this.orderTest?.test?.section;
    },
    disclaimer () {
      return this.orderTest?.test?.disclaimer;
    },
    technicianLabel () {
      return this.orderTest?.test?.technicianLabel ||
        'Medical Technologist';
    },
    technicianName () {
      return this.orderTest?.technician?.name;
    },
    verifierName () {
      return this.orderTest?.verifiedByDetails?.name;
    },
    verifierLicenseNo () {
      const verifier = this.orderTest?.verifiedByDetails;
      return verifier?.['doc_PRCLicenseNo'] ||
        verifier?.PRCLicenseNo;
    },
    pathologistName () {
      return this.orderTest?.pathologist?.name;
    },
    results () {
      return this.orderTest?.results;
    },
    tableResults () {
      const tableResults = _.filter(this.results, r => r?.measure?.type !== 'html');
      // filter for empty results
      return _.filter(
        tableResults,
        r => !_.isEmpty(r?.value) || !_.isEmpty(r?.sivalue),
      );
    },
    htmlResults () {
      return _.filter(this.results, r => r?.measure?.type === 'html');
    },
    hasTableResults () {
      return !_.isEmpty(this.tableResults);
    },
    hasHtmlResults () {
      return !_.isEmpty(this.htmlResults);
    },
    hasSiMeasures () {
      return _.some(
        this.tableResults,
        r => !_.isEmpty(r?.measure?.siunit),
      );
    },
    hasUnits () {
      return _.some(
        this.tableResults,
        r => !_.isEmpty(r?.measure?.unit),
      );
    },
    hasRanges () {
      return _.some(
        this.tableResults,
        r => !_.isEmpty(r?.measure?.referenceRanges),
      );
    },
    // total number of columns (since SI, unit, and range behavior can vary this)
    // to help with computation of colspan
    totalColumns () {
      if (this.hasSiMeasures) return 7;
      // 2 base columns: one for test, one for result
      let columns = 2;
      // add a column for unit and range if displayed
      if (this.hasUnits) columns += 1;
      if (this.hasRanges) columns += 1;
      return columns;
    },
    testColumnClass () {
      if (this.totalColumns === 2) return 'mc-test-wide';
      return 'mc-test';
    },
    hideHtmlMeasureName () {
      return _.size(this.htmlResults) <= 1;
    },
    hasAttachments () {
      return !_.isEmpty(this.orderTest?.attachmentURLs);
    },
    isFinalized () {
      return this.orderTest?.finalizedAt;
    },
  },
  created () {
    this.$initLogger('print-lis-order-test');
    this.init();
  },
  methods: {
    async init () {
      this.orderTest = await this.$store.dispatch('diagnostic/getOrderTest', this.orderTestId);
      this.$log('init#orderTest: %O', this.orderTest);

      if (!this.isFinalized) return;

      // trigger printing
      this.$registerPicURLs(
        this.technicianESigValue,
        this.pathologistESigValue,
      );
      await this.$waitUntilPrintReady();
      this.$nextTick(() => {
        setTimeout(() => {
          window.print();
          this.$router.go(-1);
        }, 3000);
      });
    },
    getSetHeader (index) {
      const prevSet = _.get(this.tableResults, [index - 1, 'measure', 'set']);
      const set = _.get(this.tableResults, [index, 'measure', 'set']);

      if (!_.isEmpty(set) && prevSet !== set) return set;
    },
    getSubsetHeader (index) {
      // TODO: handle arbitrarily deep nesting
      const prevSubset = _.get(this.tableResults, [index - 1, 'measure', 'sets', 1]);
      const subset = _.get(this.tableResults, [index, 'measure', 'sets', 1]);

      if (!_.isEmpty(subset) && prevSubset !== subset) return subset;
    },
    getSetTotal (index) {
      const set = _.get(this.tableResults, [index, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.tableResults, [index, 'measure', 'set']);
      const nextSet = _.get(this.tableResults, [index + 1, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.tableResults, [index + 1, 'measure', 'set']);
      if (_.isEmpty(set) || set === nextSet) return;

      const breakdownResults = _.filter(
        this.tableResults,
        r => (_.get(r, ['measure', 'sets', 0]) === set ||
          _.get(r, ['measure', 'set']) === set) &&
          r.measure.type === 'numeric-breakdown',
      );
      if (_.isEmpty(breakdownResults)) return;

      const total = _.reduce(breakdownResults, (acc, r) => acc + +r.value, 0);
      // kludging for float-point computations
      const roundedTotal = Math.round(total * 1000) / 1000;

      return roundedTotal;
    },
    hasSetTotal (index) {
      return !_.isNil(this.getSetTotal(index));
    },
    getClass (measure) {
      return {
        'pl-3': this.isInSet(measure),
        'pl-5': this.isInSubset(measure),
      };
    },
    isInSet (measure) {
      return !_.isEmpty(_.get(measure, 'sets[0]')) ||
        // check set also for backwards compatibility
        !_.isEmpty(_.get(measure, 'set'));
    },
    isInSubset (measure) {
      return !_.isEmpty(_.get(measure, 'sets[1]'));
    },
    isWithinReferenceRange (result) {
      const referenceRange = this.getReferenceRange(this.orderTest, result.measure);
      if (!referenceRange) return;
      const { min, max } = referenceRange;
      if (_.isNil(min) || _.isNil(max)) return;
      if (_.isNil(result.value)) return;

      if (+result.value > +max) return 'above';
      if (+result.value < +min) return 'below';
      return 'within';
    },
    isWithinSiReferenceRange (result) {
      const referenceRange = this.getReferenceRange(this.orderTest, result.measure);
      if (!referenceRange) return;
      const { simin, simax } = referenceRange;
      if (_.isNil(simin) || _.isNil(simax)) return;
      if (_.isNil(result.sivalue)) return;

      if (+result.sivalue > +simax) return 'above';
      if (+result.sivalue < +simin) return 'below';
      return 'within';
    },
    getReferenceRangeIndication (isWithinReferenceRange) {
      if (isWithinReferenceRange === 'above') return 'mdi-arrow-up';
      if (isWithinReferenceRange === 'below') return 'mdi-arrow-down';
    },
    getReferenceRangeColor (isWithinReferenceRange) {
      if (isWithinReferenceRange === 'above') return 'error';
      if (isWithinReferenceRange === 'below') return 'error';
      if (isWithinReferenceRange === 'within') return 'success';
    },
    getReferenceRange (test, measure) {
      const isWithinSex = r => {
        if (_.isNil(r.sex)) return true;
        if (r.sex === 'all') return true;
        return r.sex === this.patient.sex;
      };

      const patientAge = differenceInYears(test.createdAt, this.patient.dateOfBirth);
      const isWithinAge = r => {
        if (!_.isNil(r.ageMin) && r.ageMin > patientAge) return false;
        if (!_.isNil(r.ageMax) && r.ageMax < patientAge) return false;
        return true;
      };

      const referenceRange = _.find(measure.referenceRanges,
        r => isWithinSex(r) && isWithinAge(r));
      return referenceRange || {};
    },
    getReferenceRangeText (test, measure) {
      const referenceRange = this.getReferenceRange(test, measure);
      const min = _.get(referenceRange, 'min');
      const max = _.get(referenceRange, 'max');
      const minPrecision = _.get(referenceRange, 'minPrecision');
      const maxPrecision = _.get(referenceRange, 'maxPrecision');

      // apply precision
      const formattedMin = min >= 1000
        ? (+min).toLocaleString('en', { useGrouping: true })
        : _.isNil(minPrecision)
          ? min
          : formatDecimal(min, minPrecision);
      const formattedMax = max >= 1000
        ? (+max).toLocaleString('en', { useGrouping: true })
        : _.isNil(maxPrecision)
          ? max
          : formatDecimal(max, maxPrecision);

      return guard`${formattedMin}-${formattedMax}`;
    },
    getSiReferenceRangeText (test, measure) {
      const referenceRange = this.getReferenceRange(test, measure);
      const simin = _.get(referenceRange, 'simin');
      const simax = _.get(referenceRange, 'simax');
      const siminPrecision = _.get(referenceRange, 'siminPrecision');
      const simaxPrecision = _.get(referenceRange, 'simaxPrecision');

      // apply precision
      const formattedSimin = simin >= 1000
        ? (+simin).toLocaleString('en', { useGrouping: true })
        : _.isNil(siminPrecision)
          ? simin
          : formatDecimal(simin, siminPrecision);
      const formattedSimax = simax >= 1000
        ? (+simax).toLocaleString('en', { useGrouping: true })
        : _.isNil(simaxPrecision)
          ? simax
          : formatDecimal(simax, simaxPrecision);

      return guard`${formattedSimin}-${formattedSimax}`;
    },
    getBreakdownRangeText (measure) {
      const min = _.get(measure, 'numericBreakdownMin');
      const max = _.get(measure, 'numericBreakdownMax');

      // special case: min and max are the same,
      // meaning breakdown is constrained to a single value
      if (min === max) return min;

      return guard`${min}-${max}`;
    },
    prettifyProfessionalName,
  },
};
</script>

<style scoped>
.mc-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
}

.mc-table thead {
  border-top: 3px solid lightgray;
  border-bottom: 3px solid lightgray;
}

.mc-table th, .mc-table td {
  text-align: left;
  height: 30px;
}

.mc-test {
  width: 33%;
}

.mc-test-wide {
  width: 50%;
}

.mc-set-header {
  font-weight: bold;
}

.mc-width {
  width: 100%;
}

.mc-indicator {
  margin-left: -22px;
  margin-right: 6px;
}

.result-preview {
  border: 1px solid rgba(0,0,0,0.12);
  padding: 10px;
}

.mc-attachment {
  object-fit: cover;
}

.mc-sig {
  break-inside: avoid;
}

.mc-sig span {
  text-align: right;
}

.mc-signature {
  object-fit: contain;
}
</style>
