<template lang="pug">
  v-card(:class="{ 'elevation-0': !elevate }" style="height: 100%")
    v-card-title(v-if="title") {{title}}
    v-card-text
      apex-chart(
        type="line"
        :height="height"
        :series="series"
        :options="options"
      )
</template>

<script>
import _ from 'lodash';
import Vue from 'vue';
import ApexChart from 'vue-apexcharts';

Vue.use(ApexChart);

export default {
  components: {
    ApexChart,
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    title: {
      type: String,
      default: undefined,
    },
    horizontal: Boolean,
    height: {
      type: String,
      default: '500',
    },
    elevate: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      baseOptions: {
        stroke: {
          width: 1,
        },
        chart: {
          toolbar: {
            show: true,
          },
        },
      },
    };
  },
  computed: {
    options () {
      return {
        ...this.baseOptions,
        xaxis: {
          categories: _.get(this.data, 'age'),
          title: {
            text: _.get(this.data, 'xAxisText'),
          },
        },
        colors: _.get(this.data, 'colors'),
      };
    },
    series () {
      return _.get(this.data, 'series');
    },
  },
};
</script>
