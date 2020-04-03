<template lang="pug">
  div
    v-layout(column style="line-height: 1;").text-xs-center.pa-0
      h3 {{ doctor | prettify-doctor-name-first }}
      small(style="line-height: 1;").ma-0.mb-1 {{doctorSpecializations}}
      br
    v-layout(row wrap).pa-0.ma-0
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set1`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set2`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set3`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set4`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set5`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
      v-flex(xs4 md4).pa-0.ma-0
        p(style="line-height: 0.8;").ma-0.mb-1
          template(v-for="(q, k) in getSet(`set6`)")
            small(:style="k | set-item-style") {{q.answer}}
            br
</template>

<script>
import _ from 'lodash';

export default {
  filters: {
    setItemStyle: (index) => ({
      'font-weight': index === 0 ? 'bold' : '',
      'font-size': '9px !important',
    }),
  },
  props: {
    doctor: {
      type: Object,
      default: undefined,
    },
    doctorHeader: {
      type: Object,
      default: undefined,
    },
  },
  computed: {
    doctorSpecializations () {
      const specs = _.get(this.doctor, 'doc_specialties');
      if (_.isEmpty(specs)) return '';
      return specs.join(', ');
    },
  },
  methods: {
    getSet (set) {
      const meta = _.get(this.doctorHeader, 'meta');
      if (!meta) return [];
      if (meta.enabledSets && (meta.enabledSets[set] === false)) return [];
      const items = _.get(meta, 'items') || [];
      return items.filter((item) => item.set === set);
    },
  },
};
</script>
