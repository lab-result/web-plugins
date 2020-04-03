<template lang="pug">
  div
    v-layout(column align-center)
      h2.blue--text {{diagnosticTest.section | morph-uppercase}}
      h3 {{diagnosticTest.name}}

    //- table measures
    table(v-if="hasResults").mc-table
      colgroup
        col(:class="testColumnClass")
      thead
        template(v-if="hasSiMeasures")
          tr
            th(rowspan="2") Test
            th(colspan="3") Conventional
            th(colspan="3") SI
          tr
            th Result
            th Unit
            th Range
            th Result
            th Unit
            th Range
        template(v-else)
          tr
            th Test
            th Result
            th(v-if="hasUnits") Unit
            th(v-if="hasRanges") Range
      tbody
        template(v-for="(result, index) in resultsModel")
          tr(
            v-if="getSetHeader(index)"
            :key="getSetHeader(index)"
          ).mc-set-header
            td {{getSetHeader(index)}}
            td(:colspan="totalColumns - 1")
          tr(
            v-if="getSubsetHeader(index)"
            :key="getSubsetHeader(index)"
          ).mc-set-header
            td.pl-3 {{getSubsetHeader(index)}}
            td(:colspan="totalColumns - 1")
          tr(:key="result.measure.id")
            //- conventional
            td(:class="getClass(result.measure)")
              | {{result.measure.name}}
            td(v-if="readOnly")
              v-icon(
                v-if="getReferenceRangeIndication(isWithinReferenceRange(result))"
                :color="getReferenceRangeColor(isWithinReferenceRange(result))"
                small
              ).mc-margin-bottom.mc-indicator
                | {{getReferenceRangeIndication(isWithinReferenceRange(result))}}
              | {{result.value}}
            td(v-else).mc-no-padding
              lis-test-results-entry(
                :measure="result.measure"
                v-model="result.value"
              )
            td(v-if="hasSiMeasures || hasUnits") {{result.measure.unit}}
            td(v-if="hasSiMeasures || hasRanges") {{getReferenceRangeText(result.measure)}}

            //- si
            template(v-if="result.measure.siunit")
              td(v-if="readOnly")
                v-icon(
                  v-if="getReferenceRangeIndication(isWithinSiReferenceRange(result))"
                  :color="getReferenceRangeColor(isWithinSiReferenceRange(result))"
                  small
                ).mc-margin-bottom.mc-indicator
                  | {{getReferenceRangeIndication(isWithinSiReferenceRange(result))}}
                | {{result.sivalue}}
              td(v-else).mc-no-padding
                lis-test-results-entry(
                  :measure="result.measure"
                  v-model="result.sivalue"
                )
              td {{result.measure.siunit}}
              td {{getSiReferenceRangeText(result.measure)}}
            template(v-else-if="hasSiMeasures")
              td
              td
              td

          //- set total
          tr(v-if="hasSetTotal(index)")
            td
              i Total
            td {{getSetTotal(index)}}
            td(v-if="hasSiMeasures || hasUnits")
            td(v-if="hasSiMeasures || hasRanges") {{getBreakdownRangeText(result.measure)}}
            td(v-if="hasSiMeasures" colspan="3")

    //- paragraph measures
    v-layout(v-if="hasHtmlResults" column).mt-3
      h3 Rich Text Results
      v-layout(
        v-for="htmlResult in htmlResultsModel"
        :key="htmlResult.measure.id"
        column
      )
        b(v-if="!hideHtmlMeasureName") • {{htmlResult.measure.name}}
        div(
          v-if="readOnly"
          v-html="htmlResult.value"
        ).result-preview
        template(v-else)
          v-toolbar(flat).bordered-toolbar.py-1
            generic-search(
              label="Select Template"
              :items="labTemplates"
              item-text="name"
              item-value="id"
              outline
              width="100%"
              @select="selectTemplate($event, htmlResult)"
              @search="searchLabReportTemplates"
              no-filter
            )
          mc-wysiwyg(
            v-model="htmlResult.value"
            :key="templateId"
            style="margin-top: 0px;"
          )
</template>

<script>
// components
import GenericSearch from '../commons/generic-search';
import LisTestResultsEntry from './lis-test-results-entry';
import { McWysiwyg } from '@mycure/vue-wysiwyg';
// utils
import _ from 'lodash';
import { guard, formatDecimal } from '../../utils/string';
import { syncProp } from '../../utils/vue';
import { differenceInYears } from 'date-fns';

export default {
  components: {
    GenericSearch,
    LisTestResultsEntry,
    McWysiwyg,
  },
  props: {
    readOnly: Boolean,
    results: {
      type: Array,
      default: undefined,
    },
    htmlResults: {
      type: Array,
      default: undefined,
    },
    orderTest: {
      type: Object,
      required: true,
    },
    patient: {
      type: Object,
      required: true,
    },
    diagnosticTest: {
      type: Object,
      required: true,
    },
    labTemplates: {
      type: Array,
      default: undefined,
    },
  },
  data () {
    return {
      selectedTemplate: null,
    };
  },
  computed: {
    resultsModel: syncProp('results'),
    htmlResultsModel: syncProp('htmlResults'),
    hasResults () {
      return !_.isEmpty(this.resultsModel);
    },
    hasHtmlResults () {
      return !_.isEmpty(this.htmlResultsModel);
    },
    hideHtmlMeasureName () {
      return _.size(this.htmlResultsModel) <= 1;
    },
    hasSiMeasures () {
      return _.some(
        this.resultsModel,
        r => !_.isEmpty(_.get(r, 'measure.siunit'))
      );
    },
    hasUnits () {
      return _.some(
        this.resultsModel,
        r => !_.isEmpty(_.get(r, 'measure.unit'))
      );
    },
    hasRanges () {
      return _.some(
        this.resultsModel,
        r => !_.isEmpty(_.get(r, 'measure.referenceRanges'))
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
    templateId () {
      return _.get(this.selectedTemplate, 'id');
    },
  },
  methods: {
    getSetHeader (index) {
      const prevSet = _.get(this.resultsModel, [index - 1, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.resultsModel, [index - 1, 'measure', 'set']);
      const set = _.get(this.resultsModel, [index, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.resultsModel, [index, 'measure', 'set']);

      if (!_.isEmpty(set) && prevSet !== set) return set;
    },
    getSubsetHeader (index) {
      // TODO: handle arbitrarily deep nesting
      const prevSubset = _.get(this.resultsModel, [index - 1, 'measure', 'sets', 1]);
      const subset = _.get(this.resultsModel, [index, 'measure', 'sets', 1]);

      if (!_.isEmpty(subset) && prevSubset !== subset) return subset;
    },
    getSetTotal (index) {
      const set = _.get(this.resultsModel, [index, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.resultsModel, [index, 'measure', 'set']);
      const nextSet = _.get(this.resultsModel, [index + 1, 'measure', 'sets', 0]) ||
        // check set also for backwards compatibility
        _.get(this.resultsModel, [index + 1, 'measure', 'set']);
      if (_.isEmpty(set) || set === nextSet) return;

      const breakdownResults = _.filter(
        this.resultsModel,
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
      const referenceRange = this.getReferenceRange(result.measure);
      if (!referenceRange) return;
      const { min, max } = referenceRange;
      if (_.isNil(min) || _.isNil(max)) return;
      if (_.isString(result.value) && _.isEmpty(result.value)) return;
      if (_.isNil(result.value)) return;

      if (+result.value > +max) return 'above';
      if (+result.value < +min) return 'below';
      return 'within';
    },
    isWithinSiReferenceRange (result) {
      const referenceRange = this.getReferenceRange(result.measure);
      if (!referenceRange) return;
      const { simin, simax } = referenceRange;
      if (_.isNil(simin) || _.isNil(simax)) return;
      if (_.isString(result.value) && _.isEmpty(result.value)) return;
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
    getReferenceRange (measure) {
      const isWithinSex = r => {
        if (_.isNil(r.sex)) return true;
        if (r.sex === 'all') return true;
        return r.sex === this.patient.sex;
      };

      const patientAge = differenceInYears(this.orderTest.createdAt,
        this.patient.dateOfBirth);
      const isWithinAge = r => {
        if (!_.isNil(r.ageMin) && r.ageMin > patientAge) return false;
        if (!_.isNil(r.ageMax) && r.ageMax < patientAge) return false;
        return true;
      };

      const referenceRange = _.find(measure.referenceRanges,
        r => isWithinSex(r) && isWithinAge(r));
      return referenceRange || {};
    },
    getReferenceRangeText (measure) {
      const referenceRange = this.getReferenceRange(measure);
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
    getSiReferenceRangeText (measure) {
      const referenceRange = this.getReferenceRange(measure);
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
    searchLabReportTemplates (searchString) {
      this.$emit('searchLabReportTemplates', searchString);
    },
    selectTemplate (item, htmlResult) {
      this.selectedTemplate = item;
      htmlResult.value = _.get(item, 'template');
    },
  },
};
</script>

<style scoped>
.mc-table {
  table-layout: fixed;
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}

.mc-table th, .mc-table td {
  border: 1px solid gray;
  height: 30px;
  padding: 0px 5px;
}

.mc-table td.mc-no-padding {
  padding: 0px 0px;
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

.mc-margin-bottom {
  margin-bottom: 3px;
}

.mc-input {
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: #ffffaa;
}

.mc-input::placeholder {
  font-size: 12px;
}

.mc-indicator {
  margin-left: -22px;
  margin-right: 6px;
}

.result-preview {
  border: 1px solid rgba(0,0,0,0.12);
  padding: 10px;
}
</style>
