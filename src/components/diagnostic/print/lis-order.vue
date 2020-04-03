<template lang="pug">
  div
    print-diagnostic-order(
      :order="order"
      :facility="$activeOrganization"
      @ready="$onHeaderReady"
    )
      template(v-for="section in sections").mt-2
        v-layout(column align-center)
          h2.blue--text {{section.name | morph-uppercase}}

        //- table results
        table(v-if="doesSectionHaveTableResults(section)").mc-table
          colgroup
            col.mc-test
          thead
            template(v-if="doesSectionHaveSiMeasures(section)")
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
                th(v-if="doesSectionHaveUnits(section)") UNIT
                th(v-if="doesSectionHaveRanges(section)") RANGE
          tbody
            template(
              v-for="test in section.tests"
              v-if="hasTableResults(test)"
            )
              tr(v-if="displayTestName(section)").mc-test-header
                td {{test.test.name}}
                td(colspan="0")
              template(v-for="(result, index) in getTableResults(test)")
                tr(
                  v-if="getSetHeader(index, getTableResults(test))"
                  :key="getSetHeader(index, getTableResults(test))"
                  :class="{ 'mc-indented': displayTestName(section) }"
                ).mc-set-header
                  td.mc-set-label {{getSetHeader(index, getTableResults(test))}}
                  td(colspan="0")
                tr(
                  :key="result.measure.id"
                  :class="{ 'mc-indented': displayTestName(section) }"
                )
                  td {{result.measure.name}}
                  td {{result.value}}
                  td(v-if="doesSectionHaveSiMeasures(section) || doesSectionHaveUnits(section)")
                    | {{result.measure.unit}}
                  td(v-if="doesSectionHaveSiMeasures(section) || doesSectionHaveRanges(section)")
                    | {{getReferenceRangeText(test, result.measure)}}
                  template(v-if="doesSectionHaveSiMeasures(section)")
                    td {{result.sivalue}}
                    td {{result.measure.siunit}}
                    td {{getSiReferenceRangeText(test, result.measure)}}
                tr(v-if="hasSetTotal(index, getTableResults(test))")
                  td
                    i Total
                  td {{getSetTotal(index, getTableResults(test))}}
                  td(v-if="hasSiMeasures || hasUnits")
                  td(v-if="hasSiMeasures || hasRanges") {{getBreakdownRangeText(result.measure)}}
                  td(v-if="hasSiMeasures" colspan="3")

        //- html results
        v-layout(v-if="doesSectionHaveHtmlResults(section)" column).mt-3.mc-width
          template(v-for="test in section.tests")
            v-layout(
              v-for="htmlResult in getHtmlResults(test)"
              :key="htmlResult.measure.id"
              column
            )
              b(v-if="shouldSectionHideHtmlMeasureName(section)") • {{htmlResult.measure.name}}
              div(v-html="htmlResult.value").result-preview

        //- attachments
        v-layout(v-if="doesSectionHaveAttachments(section)" row).mt-3.mc-width
          v-flex(xs12).pa-1
            h3 Attachments
            v-layout(row)
              template(v-for="test in section.tests")
                img(
                  v-for="attachment in test.attachmentURLs"
                  :src="attachment"
                  class="mc-attachment"
                  height="100px"
                  width="100px"
                )

        v-layout(row justify-space-around align-end).my-5.mc-sig
          v-flex(v-if="section.technician")
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="section.technician.eSigValue"
                :src="section.technician.eSigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(section.technician.name)}}
              span(v-if="section.technician.doc_PRCLicenseNo")
                | PRC License No. {{section.technician.doc_PRCLicenseNo}}
              span(v-if="section.technician.PRCLicenseNo")
                | PRC License No. {{section.technician.PRCLicenseNo}}
              span Medical Technologist
          v-flex(v-if="section.verifiedByDetails" grow)
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="section.verifiedByDetails.eSigValue"
                :src="section.verifiedByDetails.eSigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(section.verifiedByDetails.name)}}
              span(v-if="section.verifiedByDetails.doc_PRCLicenseNo")
                | PRC License No. {{section.verifiedByDetails.doc_PRCLicenseNo}}
              span(v-if="section.verifiedByDetails.PRCLicenseNo")
                | PRC License No. {{section.verifiedByDetails.PRCLicenseNo}}
              span {{verifiedByText}}
          v-flex(v-if="section.pathologist")
            v-layout(column align-center)
              img(
                class="mc-signature"
                v-if="section.pathologist.eSigValue"
                :src="section.pathologist.eSigValue"
                width="200px"
                height="75px"
              )
              span {{prettifyProfessionalName(section.pathologist.name)}}
              span(v-if="section.pathologist.doc_PRCLicenseNo")
                | PRC License No. {{section.pathologist.doc_PRCLicenseNo}}
              span(v-if="section.pathologist.PRCLicenseNo")
                | PRC License No. {{section.pathologist.PRCLicenseNo}}
              span Pathologist
</template>

<script>
import _ from 'lodash';
import PrintDiagnosticOrder from './diagnostic-order';
import printReadyMixin from '../../../mixins/print-ready';
import { initLogger } from '../../../utils/logger';
import { guard, compile, prettifyProfessionalName } from '../../../utils/string';
import { differenceInYears } from 'date-fns';

const log = initLogger('LisOrder');

export default {
  components: {
    PrintDiagnosticOrder,
  },
  mixins: [printReadyMixin],
  computed: {
    activeOrganization () {
      return this.$activeOrganization;
    },
    orderId () {
      return this.$route.params.id;
    },
    order () {
      return _.find(this.$store.state.diagnostic.orders, ({ id }) => id === this.orderId);
    },
    patient () {
      return this.order.patient;
    },
    sections () {
      log('computed#sections#tests: %O', this.order.tests);
      const sections = _(this.order.tests)
        .groupBy('test.section')
        .map((sectionTests, section) => ({
          name: section,
          tests: _.map(sectionTests, test => ({
            ...test,
            results: _.map(test.results, result => ({
              ...result,
              measure: _.find(test.measures, m => m.id === result.measure),
            })),
          })),
          // FIXME: only looks at first test's signature
          technician: {
            ..._.get(sectionTests[0], 'technician'),
            eSigValue: this.getESigValue(_.get(sectionTests[0], 'technician')),
          },
          verifiedByDetails: {
            ..._.get(sectionTests[0], 'verifiedByDetails'),
            eSigValue: this.getESigValue(_.get(sectionTests[0], 'verifiedByDetails')),
          },
          pathologist: {
            ..._.get(sectionTests[0], 'pathologist'),
            eSigValue: this.getESigValue(_.get(sectionTests[0], 'pathologist')),
          },
        }))
        .filter(({ tests }) => _.some(tests, t => !_.isEmpty(_.get(t, 'results'))))
        .value();
      log('computed#sections: %O', sections);

      return sections;
    },
    verifiedByText () {
      return _.get(this.activeOrganization, 'configFacility.languages.diagnosticVerifiedBy') ||
        'Verified by';
    },
  },
  async created () {
    this.$initLogger('print-lis-order');
    log('created#order', this.order);

    // trigger printing
    this.$registerPicURLs(
      _.flatMap(this.sections, s => [
        _.get(s, 'technician.doc_eSignatureURL'),
        _.get(s, 'pathologist.doc_eSignatureURL'),
      ])
    );
    await this.$waitUntilPrintReady();
    this.$nextTick(() => {
      window.print();
      this.$router.go(-1);
    });
  },
  methods: {
    getESigValue (obj) {
      const base64 = _.get(obj, 'doc_eSignatureDataURI');
      if (base64) return base64;
      return _.get(obj, 'doc_eSignatureURL');
    },
    getTableResults (test) {
      const tableResults = _.filter(
        _.get(test, 'results'),
        r => _.get(r, 'measure.type') !== 'html'
      );
      // filter for empty results
      return _.filter(
        tableResults,
        r => !_.isEmpty(_.get(r, 'value')) || !_.isEmpty(_.get(r, 'sivalue'))
      );
    },
    hasTableResults (test) {
      return _.size(this.getTableResults(test)) > 0;
    },
    doesSectionHaveTableResults (section) {
      return _.some(section.tests, this.hasTableResults);
    },
    hasSiMeasures (test) {
      return _.some(
        this.getTableResults(test),
        r => !_.isEmpty(_.get(r, 'measure.siunit'))
      );
    },
    doesSectionHaveSiMeasures (section) {
      return _.some(section.tests, this.hasSiMeasures);
    },
    hasUnits (test) {
      return _.some(
        this.getTableResults(test),
        r => !_.isEmpty(_.get(r, 'measure.unit'))
      );
    },
    doesSectionHaveUnits (section) {
      return _.some(section.tests, this.hasUnits);
    },
    hasRanges (test) {
      return _.some(
        this.getTableResults(test),
        r => !_.isEmpty(_.get(r, 'measure.referenceRanges'))
      );
    },
    doesSectionHaveRanges (section) {
      return _.some(section.tests, this.hasRanges);
    },
    getHtmlResults (test) {
      return _.filter(
        _.get(test, 'results'),
        r => _.get(r, 'measure.type') === 'html'
      );
    },
    hasHtmlResults (test) {
      return _.size(this.getHtmlResults(test)) > 0;
    },
    doesSectionHaveHtmlResults (section) {
      return _.some(section.tests, this.hasHtmlResults);
    },
    shouldSectionHideHtmlMeasureName (section) {
      const htmlResults = _.flatMap(section.tests, this.getHtmlResults);
      return _.size(htmlResults) <= 1;
    },
    hasAttachments (test) {
      return !_.isEmpty(_.get(test, 'attachmentURLs'));
    },
    doesSectionHaveAttachments (section) {
      return _.some(section.tests, this.hasAttachments);
    },
    displayTestName (section) {
      const testsWithResults = _.filter(section.tests, this.hasTableResults);
      return _.size(testsWithResults) > 1;
    },
    getSetHeader (index, results) {
      const prevSet = _.get(results, [index - 1, 'measure', 'set']);
      const set = _.get(results, [index, 'measure', 'set']);

      if (!_.isEmpty(set) && prevSet !== set) return set;
    },
    getSetTotal (index, results) {
      const set = _.get(results, [index, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(results, [index, 'measure', 'set']);
      const nextSet = _.get(results, [index + 1, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(results, [index + 1, 'measure', 'set']);
      if (_.isEmpty(set) || set === nextSet) return;

      const breakdownResults = _.filter(
        results,
        r => (_.get(r, ['measure', 'sets', 0]) === set ||
          _.get(r, ['measure', 'set']) === set) &&
          r.measure.type === 'numeric-breakdown'
      );
      if (_.isEmpty(breakdownResults)) return;

      const total = _.reduce(breakdownResults, (acc, r) => acc + +r.value, 0);
      // kludging for float-point computations
      const roundedTotal = Math.round(total * 1000) / 1000;

      return roundedTotal;
    },
    hasSetTotal (index, results) {
      return !_.isNil(this.getSetTotal(index, results));
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
      const format = compile`${'min'}-${'max'}`;

      return format(this.getReferenceRange(test, measure));
    },
    getSiReferenceRangeText (test, measure) {
      const format = compile`${'simin'}-${'simax'}`;

      return format(this.getReferenceRange(test, measure));
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

.mc-test-header {
  font-size: 11pt;
  font-weight: bold;
}

.mc-set-header {
  font-weight: bold;
}

.mc-attachment {
object-fit: cover;
}

.mc-indented :first-child {
  padding-left: 15px;
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
