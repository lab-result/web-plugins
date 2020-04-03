<template lang="pug">
  .mc-input
    select(
      v-if="measure.type && measure.type === 'multiplechoice'"
      v-model="model"
    ).mc-input.pl-2
      option(value="")
      option(
        v-for="(choice,key) in measure.choices"
        :key="key"
        :value="choice"
      ).text-center {{ choice }}
    input(
      v-else
      v-model="model"
      placeholder="Type here"
    ).mc-input
</template>

<script>
import { useModel } from '../../utils/vue';

export default {
  props: {
    // FIXME: set proper type
    value: null, // eslint-disable-line
    measure: {
      type: Object,
      default: undefined,
    },
    readOnly: Boolean,
  },
  computed: {
    model: useModel(),
  },
};
</script>

<style scoped>
.mc-input {
  width: 100%;
  height: 100%;
  text-align: center;
  background-color: #ffffaa;
}

.mc-input::placeholder {
  font-size: 12px;
}

select {
  text-align: center;
  text-align-last: center;
}

option {
  text-align: left;
}
</style>
