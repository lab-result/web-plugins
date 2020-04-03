<template lang="pug">
  v-menu(
    left
    ref="menu"
    v-model="menu"
    :return-value.sync="time"
    :close-on-content-click="false"
    :disabled="readOnly"
    transition="scale-transition"
    offset-y
  )
    v-text-field(
      slot="activator"
      v-model="timeFormatted"
      prepend-inner-icon="mdi-clock-outline"
      :label="label"
      :box="box"
      :solo="solo"
      :outline="outline"
      :hide-details="hideDetails"
      :disabled="disabled"
      :loading="loading"
      style="width: 100%"
      readonly
    ).white
    div.text-xs-center.white
      v-time-picker(
        v-model="time"
        color="primary"
        scrollable
        @click:minute="$refs.menu.save(time)"
      ).elevation-0
</template>

<script>
import {
  format,
  getTime,
  // getHours,
  // getMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import _ from 'lodash';

export default {
  props: {
    readOnly: Boolean,
    label: {
      type: String,
      default: 'Select Time',
    },
    value: {
      type: Number,
      default: undefined,
    },
    format: {
      type: String,
      default: 'hh:mm A',
    },
    formatterOverride: {
      type: Function,
      default: undefined,
    },
    box: Boolean,
    solo: Boolean,
    outline: Boolean,
    hideDetails: Boolean,
    prependIcon: {
      type: String,
      default: 'mdi-alarm-clock',
    },
    disabled: Boolean,
    loading: Boolean,
  },
  data () {
    return {
      menu: false,
    };
  },
  computed: {
    time: {
      get () {
        if (!this.value) return;
        // internal: format used by v-time-picker
        return format(this.value, 'HH:mm');
      },
      set (val) {
        this.$log('computed#time#set#val', val);
        const [hours, minutes] = _.split(val, ':');
        const withHour = setHours(this.value || new Date(), hours);
        const withMinutes = setMinutes(withHour, minutes);

        this.$emit('input', getTime(withMinutes));
      },
    },
    timeFormatted () {
      if (!this.value) return;
      if (this.formatterOverride) return this.formatterOverride(this.value);
      return this.$morphDate(this.value, this.format);
    },
  },
  created () {
    this.$initLogger('time-picker-menu');
  },
};
</script>

<style scoped>

</style>
