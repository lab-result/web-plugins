<template lang="pug">
  v-card(:class="{ 'elevation-0': !elevate }" style="height: 100%")
    v-card-title(v-if="title") {{title}}
    v-card-text
      apex-chart(
        v-if="displayData"
        type="bar"
        :height="height"
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

Vue.use(ApexChart);

export default {
  components: {
    ApexChart,
  },
  props: {
    data: {
      type: Array,
      required: true,
    },
    title: {
      type: String,
      default: undefined,
    },
    horizontal: Boolean,
    height: {
      type: String,
      default: '300',
    },
    elevate: {
      type: Boolean,
      default: true,
    },
    seriesName: {
      type: String,
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
        plotOptions: {
          bar: {
            horizontal: this.horizontal,
          },
        },
        dataLabels: {
          enabled: false,
        },
        tooltip: {
          shared: true,
        },
      },
    };
  },
  computed: {
    options () {
      const opts = {
        ...this.baseOptions,
        xaxis: {
          categories: this.labels,
        },
      };
      const dataValues = this.data.map(item => +item.y) || [];
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
      return [{ name: this.seriesName || this.title, data: this.data.map(item => item.y) }];
    },
    labels () {
      return this.data.map(item => item.x) || [];
    },
    displayData () {
      return !isEmpty(this.data);
    },
  },
};
</script>
