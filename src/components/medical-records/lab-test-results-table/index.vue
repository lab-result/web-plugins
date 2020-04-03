<template lang="pug">
  div
    v-toolbar(dense flat)
      v-spacer
      v-tooltip(bottom)
        v-btn(icon slot="activator" :loading="loading" @click="init")
          v-icon mdi-refresh
        | Refresh
    v-divider
    v-progress-linear(indeterminate v-if="loading" height="4").ma-0
    div(style="overflow: scroll;").pa-4
      table(:width="calcTableWidth")
        thead.grey.lighten-2
          tr
            th(rowspan="2" width="100").pa-1 Test
            th(colspan="2" width="100" v-for="(date) in groupByDateArr" :key="date").pa-1
              | {{date | morph-date('MM/DD/YYYY hh:mm A')}}
          tr
            template(v-for="date in groupByDateArr")
              th(width="50") CONV.
              th(width="50") S.I.
        tbody(v-if="resultsData.length")
          template(v-for="(tests, tesName) in results")
            tr(height="40")
              td.pa-2
                strong {{tesName}}
              template(v-for="date in groupByDateArr")
                td
                td
            tr(height="40")
              //- FIXME: when test is deleted, it is getting grouped by undefined
              td.pa-2.pl-2 {{ tests[0].measure && tests[0].measure.name }}
              template(v-for="(date, index) in groupByDateArr")
                td.pa-2.text-xs-center {{tests[index] ? tests[index].value : '-'}}
                td.pa-2.text-xs-center {{tests[index] ? tests[index].sivalue : '-'}}
</template>

<script>
// components
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';

export const COMPONENT_NAME = 'LabTestTable';
const log = initLogger(COMPONENT_NAME);

export default {
  props: {
    patient: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      loading: false,
      resultsData: [],
    };
  },
  computed: {
    groupByDateArr () {
      return _.map(this.resultsData, (result) => result.createdAt);
    },
    calcTableWidth () {
      if (this.groupByDateArr.length > 3) {
        return this.groupByDateArr.length * 200;
      } else {
        return '100%';
      }
    },
    results () {
      let results = _.flatten(_.map(this.resultsData, (item) => {
        return item.results;
      }));
      results = _.groupBy(results, 'test.name');
      return results;
    },
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        const query = {
          type: 'lab-test-result',
          patient: this.patient,
          facility: this.$activeOrganization.id,
          $populate: {
            tests: {
              service: 'diagnostic-tests',
              method: 'find',
              localKey: 'results',
              extractKey: 'test',
              foreignKey: 'id',
              foreignOps: '$in',
            },
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'results',
              extractKey: 'measure',
              foreignKey: 'id',
              foreignOps: '$in',
            },
          },
        };

        const { items } = await this.$sdk.service('medical-records').find(query);

        const results = _.cloneDeep(items)?.map(item => {
          const { measures, tests } = item.$populated;
          const results = item?.results?.map(result => {
            return {
              ...result,
              test: tests?.find(test => test.id === result.test),
              measure: measures?.find(measure => measure.id === result.measure),
            };
          });
          delete item.$populated;
          return { ...item, results };
        });
        log('init#results: %O', results);

        this.resultsData = results;
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          message: error.message || 'There was an error. Please try again later.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
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
  border: 1px solid lightgrey;
}

.inactive-cell {
  background-color: #f5f5f5;
}

.clickable-cell:hover {
  cursor: pointer;
}
</style>
