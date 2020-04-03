import Vue from 'vue';
import {
  PAGINATION_LIMIT,
} from '../constants';
export default Vue.mixin({
  data () {
    return {
      limit: PAGINATION_LIMIT,
      page: 1,
    };
  },
  computed: {
    skip () {
      return (this.page - 1) * this.limit;
    },
  },
  methods: {
    loadMore () {
      this.page++;
      this.$emit('loadMore', { skip: this.skip, limit: this.limit });
    },
  },
});
