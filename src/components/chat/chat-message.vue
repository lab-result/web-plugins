<template lang="pug">
  v-layout(row :justify-end="isMine")
    //- me
    template(v-if="isMine")
      v-scroll-y-transition
        v-flex(shrink).pa-2.ma-2.box.elevation-3.right.primary.white--text.arrow-right
          p(style="overflow-wrap: break-word;")
            span(v-html="text")
          v-progress-circular(v-if="isSending" indeterminate size="10" width="1").right
          v-btn(v-else-if="isNotSent" small icon dark).ma-0.right
            v-icon mdi-refresh
          small(v-else).right {{ timestamp }}
    //- !me
    template(v-else)
        v-flex(shrink).pl-2
          v-avatar(size="25").mt-3
            img(:src="picURL")
        v-flex(shrink style="white-space: wrap").pa-2.ma-2.box.elevation-3.right.white
          p(style="overflow-wrap: break-word;")
            span(v-html="text")
          small.right {{ timestamp }}
</template>

<script>
import _ from 'lodash';
import datefns from 'date-fns';
import defaultImage from '../../assets/images/person-placeholder.png';

export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  computed: {
    picURL () {
      return _.get(this.message, 'creator.picURL') || defaultImage;
    },
    creator () {
      const firstName = _.get(this.message, 'creator.name.firstName');
      const lastName = _.get(this.message, 'creator.name.lastName');
      return [firstName, lastName].filter(Boolean).join(' ');
    },
    timestamp () {
      return this.message.createdAt && datefns.format(this.message.createdAt, 'MMM. DD, YYYY hh:mm:ss A');
    },
    text () {
      return this.message.text;
    },
    isMine () {
      return !this.message.createdBy || this.message.createdBy === this.$currentUser.uid;
    },
    isSending () {
      return !this.message.failed && !this.message.createdAt;
    },
    isNotSent () {
      return !!this.message.failed;
    },
  },
  methods: {
    async retry () {
      this.$emit('retry', this.message);
    },
  },
};
</script>

<style scoped>
.box {
  border-radius: 5px;
  max-width: 300px;
}
</style>
