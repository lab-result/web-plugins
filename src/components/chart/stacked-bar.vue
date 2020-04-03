<template lang="pug">
  v-card(style="height: 100%")
    v-card-title {{title}}
    v-card-text
      apex-chart(
        v-if="hasData"
        type="bar"
        height="300"
        :series="series"
        :options="options"
      )
      v-layout(v-else column align-center).my-5
        v-flex(shrink).text-xs-center
          span No data available.
</template>

<script>
// components
import ApexChart from 'vue-apexcharts';
// utils
import Vue from 'vue';
import { isEmpty } from 'lodash';

/**
 * @typedef {Object} StackedBarDataItemBase
 * @property {string} category
 *
 * @typedef {Object.<string,any> & StackedBarDataItemBase} StackedBarDataItem
 */

/**
 * @typedef {Object} StackedBarDataNames
 * @property {string} name
 * @property {string} key defaults to name
 */

Vue.use(ApexChart);

export default {
  components: {
    ApexChart,
  },
  props: {
    /**
       * @type {StackedBarDataItem[]}
       */
    data: {
      type: Array,
      required: true,
    },
    /**
       * @type {StackedBarDataNames}
       */
    names: {
      type: Array,
      required: true,
    },
    defaultValue: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      default: undefined,
    },
    horizontal: {
      type: Boolean,
      default: undefined,
    },
  },
  data () {
    return {
      baseOptions: {
        chart: {
          stacked: true,
          toolbar: {
            show: true,
          },
        },
        tooltip: {
          shared: true,
        },
        plotOptions: {
          bar: {
            horizontal: this.horizontal,
          },
        },
        dataLabels: {
          enabled: false,
        },
      },
    };
  },
  computed: {
    options () {
      const opts = {
        ...this.baseOptions,
        xaxis: {
          categories: this.data?.map(item => item.category),
        },
      };
      const dataValues = this.names.map(n => (
        this.data?.map(d => d[n.key] > 0 ? d[n.key] : this.defaultValue)
          ?.reduce((a, b) => a + b, 0)
      ));
      const maxVal = dataValues?.length && Math.max(...dataValues);

      if (maxVal < 9) {
        opts.yaxis = {
          min: 0,
          max: 10,
          tickAmount: 4,
        };
      }

      return opts;
    },
    series () {
      return this.names.map(n => ({
        name: n.name,
        data: this.data.map(d => d[n.key] > 0 ? d[n.key] : this.defaultValue),
      }));
    },
    hasData () {
      return !isEmpty(this.data);
    },
  },
};
</script>
