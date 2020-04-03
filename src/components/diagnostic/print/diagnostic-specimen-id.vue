<template lang="pug">
  div
    vue-barcode(:value="specimenId")
</template>

<script>
import _ from 'lodash';
import VueBarcode from '@chenfengyuan/vue-barcode';

export default {
  components: {
    VueBarcode,
  },
  computed: {
    specimenId () {
      return _.get(this.$route, 'params.specimen');
    },
  },
  mounted () {
    window.print();
    this.$router.go(-1);
  },
};
</script>
