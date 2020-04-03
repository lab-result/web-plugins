<template lang="pug">
  v-select(
    v-model="time"
    :items="times"
    :label="label"
    :hide-details="hideDetails"
    :outline="outline"
    click:append="foo"
  )
</template>

<script>
import _ from 'lodash';
import { format } from 'date-fns';
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
    times () {
      const hours = 11;
      const times = [];
      // AM
      times.push('12:00 AM');
      for (let i = 1; i <= hours; i++) {
        times.push(`${('0' + i).slice(-2)}:00 AM`);
      }
      // PM
      times.push('12:00 PM');
      for (let i = 1; i <= hours; i++) {
        times.push(`${('0' + i).slice(-2)}:00 PM`);
      }
      return times;
    },
    time: {
      get () {
        if (!this.value) return '';
        return format(this.value, 'hh:mm A');
      },
      set (val) {
        const [hours, part2] = _.split(val, ':');
        const [minutes, AMPM] = _.split(part2, ' ');
        let final;
        const date = new Date(0);
        if (AMPM === 'AM') {
          final = date.setHours(parseInt(hours) % 12, parseInt(minutes));
        } else if (AMPM === 'PM') {
          final = date.setHours((parseInt(hours) % 12) + 12, parseInt(minutes));
        }
        this.$emit('input', final);
      },
    },
  },
};
</script>
