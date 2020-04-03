<template lang="pug">
  v-card(:class="{ 'elevation-0': !elevate }" style="height: 100%")
    v-card-title(v-if="title") {{title}}
    v-card-text
      apex-chart(
        v-if="data.length"
        type="donut"
        :series="series"
        :options="options"
      )
      v-layout(v-else column align-center).my-5
        v-flex(shrink).text-xs-center
          span No data available.
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
  },
  data () {
    return {
      baseOptions: {
        colors: ['#1792f8', '#25e298', '#fcaf32', '#fd4863', '#7761cc', '#424242'],
        chart: {
          toolbar: {
            show: true,
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: '50%',
            },
          },
        },
        dataLabels: {
          enabled: true,
        },
        // chart: {
        //   width: 200
        // },
        legend: {
          position: 'top',
        },
      },
    };
  },
  computed: {
    options () {
      return {
        ...this.baseOptions,
        labels: this.labels,
      };
    },
    series () {
      return _.map(this.data, 'y');
    },
    labels () {
      return _.map(this.data, 'x');
    },
  },
};
</script>
