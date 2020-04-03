<template lang="pug">
  v-text-field(
    type="time"
    v-model="time"
    :label="label"
    :hide-details="hideDetails"
    :outline="outline"
  )
</template>

<script>
import _ from 'lodash';
import {
  format,
  getTime,
  setHours,
  setMinutes,
} from 'date-fns';
export default {
  props: {
    value: {
      type: Number,
      default: undefined,
    },
    label: {
      type: String,
      default: 'Time',
    },
    hideDetails: Boolean,
    outline: Boolean,
  },
  computed: {
    time: {
      get () {
        if (!this.value) return '--:-- --';
        return format(this.value, 'HH:mm');
      },
      set (val) {
        if (!this.value) {
          this.$emit('input', '--:-- --');
          return;
        }

        const [hours, minutes] = _.split(val, ':');
        const withHour = setHours(this.value || new Date(), hours);
        const withMinutes = setMinutes(withHour, minutes);

        this.$emit('input', getTime(withMinutes));
      },
    },
  },
};
</script>
