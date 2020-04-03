<template lang="pug">
  div
    v-layout(row).pa-2
      date-filter(
        v-model="dateFilter"
        outline
        no-future
      )
    v-layout(row wrap)
      v-flex(xs12).pa-2
        stacked-bar-chart(
          :title="summaryTitle"
          :data="summaryData"
          :names="summaryNames"
        )
      v-flex(xs6).pa-2
        bar-chart(
          title="Top Tests Performed"
          :data="topTestsData"
          series-name="Patients"
          horizontal
        )
      v-flex(xs6).pa-2
        bar-chart(
          title="Top Send Outs"
          :data="topSendOutsData"
          series-name="Patients"
          horizontal
        )
</template>

<script>
// components
import BarChart from '../chart/bar';
import StackedBarChart from '../chart/stacked-bar';
import DateFilter from '../commons/date-filter';
// constants
// utils
import _ from 'lodash';
import { format } from 'date-fns';
import { sumObjects } from '../../utils/list';
import { groupByDay } from '../../utils/diagnostic-analytics';
import { initLogger } from '../../utils/logger';

const log = initLogger('diagnostic-dashboard');

export default {
  components: {
    BarChart,
    DateFilter,
    StackedBarChart,
  },
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  data () {
    return {
      dateFilter: {},
      diagnosticTestSummary: [],
      topTests: [],
      topSendOuts: [],
      summaryNames: [
        { name: 'Pending Tests', key: 'pending' },
        { name: 'Completed Tests', key: 'complete' },
        { name: 'Verified Tests', key: 'verified' },
        { name: 'Finalized Tests', key: 'approved' },
        { name: 'Send Out Tests', key: 'sendOut' },
      ],
    };
  },
  computed: {
    summaryTitle () {
      return this.type === 'laboratory'
        ? 'Lab Test Summary'
        : 'Imaging Test Summary';
    },
    summaryData () {
      if (_.isEmpty(this.dateFilter) ||
          _.isEmpty(this.diagnosticTestSummary)) return [];

      const { start, end } = this.dateFilter;
      const groupedSummary = groupByDay(this.diagnosticTestSummary, {
        startDate: start,
        endDate: end,
      });
      log('computed#summaryData#groupedSummary: %O', groupedSummary);
      const data = _.map(groupedSummary, (summary, date) => ({
        date: +date,
        category: format(+date, 'DD/MM/YY'),
        pending: 0,
        complete: 0,
        verified: 0,
        approved: 0,
        sendOut: 0,
        ...sumObjects(_.map(summary, item => _.omit(item, 'date'))),
      }));
      const sortedData = _.sortBy(data, 'date');

      log('computed#summaryData: %O', sortedData);
      return sortedData;
    },
    topTestsData () {
      if (_.isEmpty(this.topTests)) return [];

      const testCounts = _.flatMap(this.topTests, 'tests');
      log('computed#topTestsData#testCounts: %O', testCounts);

      const groupedCounts = _.groupBy(testCounts, 'test.id');
      log('computed#topTestsData#groupedCounts: %O', groupedCounts);

      const groupedSums = _.mapValues(groupedCounts, counts => ({
        test: _.get(_.head(counts), 'test'),
        count: _.reduce(_.map(counts, 'count'), _.add, 0),
      }));
      log('computed#topTestsData#groupedSums: %O', groupedSums);

      const data = _.map(groupedSums, sums => ({
        x: _.get(sums, 'test.name'),
        y: _.get(sums, 'count') || 0,
      }));
      log('computed#topTestsData#data: %O', data);

      const sortedData = _.take(_.reverse(_.sortBy(data, 'y')), 10);
      log('computed#topTestsData: %O', sortedData);

      return sortedData;
    },
    topSendOutsData () {
      if (_.isEmpty(this.topSendOuts)) return [];

      const providerCounts = _.flatMap(this.topSendOuts, 'providers');
      log('computed#topSendOutsData#providerCounts: %O', providerCounts);

      const groupedCounts = _.groupBy(providerCounts, 'provider');
      log('computed#topSendOutsData#groupedCounts: %O', groupedCounts);

      const groupedSums = _.mapValues(groupedCounts, (counts, provider) => ({
        provider,
        count: _.reduce(_.map(counts, 'count'), _.add, 0),
      }));
      log('computed#topSendOutsData#groupedSums: %O', groupedSums);

      const data = _.map(groupedSums, sums => ({
        x: _.get(sums, 'provider'),
        y: _.get(sums, 'count') || 0,
      }));
      log('computed#topSendOutsData#data: %O', data);

      const sortedData = _.take(_.sortBy(data, 'count'), 10);
      log('computed#topSendOutsData: %O', sortedData);

      return sortedData;
    },
  },
  watch: {
    dateFilter: {
      handler () {
        this.fetchAnalytics();
      },
      deep: true,
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      this.fetchAnalytics();
    },
    async fetchAnalytics () {
      const facility = this.$activeOrganization.id;
      log(`fetchAnalytics#facility: ${facility}`);

      const { start: startDate, end: endDate } = this.dateFilter;
      log('fetchAnalytics#startDate', startDate);
      log('fetchAnalytics#endDate', endDate);
      // forgo fetching without boundary dates
      if (!startDate || !endDate) return;

      const { type } = this;
      log('fetchAnalytics#type', type);

      const [
        diagnosticTestSummary,
        topTests,
        topSendOuts,
      ] = await Promise.all([
        this.$store.dispatch('diagnostic/getDiagnosticTestSummary', { facility, type, startDate, endDate }),
        this.$store.dispatch('diagnostic/getTopTestsPerformed', { facility, type, startDate, endDate }),
        this.$store.dispatch('diagnostic/getTopSendOuts', { facility, type, startDate, endDate }),
      ]);

      log('fetchAnalytics#diagnosticTestSummary: %O', diagnosticTestSummary);
      log('fetchAnalytics#topTests: %O', topTests);
      log('fetchAnalytics#topSendOuts: %O', topSendOuts);
      this.diagnosticTestSummary = diagnosticTestSummary;
      this.topTests = topTests;
      this.topSendOuts = topSendOuts;
    },
  },
};
</script>
