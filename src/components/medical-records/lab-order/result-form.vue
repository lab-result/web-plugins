<template lang="pug">
  v-form(
    ref="formRef"
    v-model="valid"
    lazy-validation
  )
    v-layout(row wrap)
      v-flex(xs12 md12).pa-1
        table(width="100%").grey.lighten-4
          thead.grey.lighten-2
            tr
              th(rowspan="3" width="100").pa-1 TEST
            tr
              th(colspan="3").pa-1 CONV.
              th(colspan="3").pa-1 S.I.
            tr
              th(width="50").pa-1 RESULT
              th(width="50").pa-1 UNIT
              th(width="50").pa-1 REF. RANGE
              th(width="50").pa-1 RESULT
              th(width="50").pa-1 UNIT
              th(width="50").pa-1 REF. RANGE
          tbody
            //- v-form(v-model="valid" ref="formRef")
            template(v-for="(test, testKey) in record.tests")
              tr
                td(colspan="7").pa-2 {{test.name}}
              template(v-for="(measure, measureKey) in getMeasures(test.id)")
                tr(v-if="model")
                  td.pa-2.pl-4 {{measure.name}}
                  td.pa-2
                    v-text-field(
                      type="number"
                      v-model="model[`${measure.test}::${measure.id}`].value"
                      label="Write here"
                      flat
                      hide-details
                      :rules="[...genericFieldRules]"
                    )
                  td
                  td
                  td.pa-2
                    v-text-field(
                      type="number"
                      v-model="model[`${measure.test}::${measure.id}`].sivalue"
                      label="Write here"
                      flat
                      hide-details
                      :rules="[...genericFieldRules]"
                    )
                  td
                  td
</template>

<script>
import _ from 'lodash';
export default {
  props: {
    record: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      valid: false,
      loading: false,
      model: null,
    };
  },
  computed: {
    testMeasures () {
      if (this.record?.$populated?.measures) {
        return this.record.$populated.measures.map(measure => {
          return {
            ...measure,
            testName: (this.record.tests.find(test => test.id === measure.test) || {}).name,
          };
        });
      }
      return [];
    },
  },
  watch: {
    valid (val) {
      this.$emit('valid', val);
    },
    loading (val) {
      this.$emit('loading', val);
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    init () {
      this.model = {};
      _.forEach(this.testMeasures, measure => {
        this.model[`${measure.test}::${measure.id}`] = {
          measureName: measure.name,
          testName: measure.testName,
        };
      });
    },
    validate () {
      const valid = this.$refs.formRef.validate();
      if (valid) {
        const results = [];
        for (const key in this.model) {
          const test = key.split('::')[0];
          // const testName = (this.record.tests.find(test => test.id === test) || {}).name;
          const measure = key.split('::')[1];
          results.push({
            test,
            measure,
            testName: this.model[key].testName,
            measureName: this.model[key].measureName,
            value: this.model[key].value,
            sivalue: this.model[key].sivalue,
          });
        }
        this.$emit('results', results);
      }
    },
    getMeasures (test) {
      return this.testMeasures.filter(measure => measure.test === test);
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
</style>
