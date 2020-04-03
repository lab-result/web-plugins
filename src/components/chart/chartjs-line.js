import { Line, mixins } from 'vue-chartjs';
const { reactiveProp } = mixins;

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: ['chartData', 'options'],
  data () {
    return {
      baseOptions: {
        spanGaps: true,
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  },
  mounted () {
    this.renderChart(this.chartData, { ...this.baseOptions, ...this.options });
  },
};
