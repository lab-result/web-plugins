<template lang="pug">
  v-menu(
    left
    ref="menu"
    v-model="menu"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    full-width
    min-width="290px"
    :disabled="readOnly"
  )
    v-text-field(
      slot="activator"
      v-model="dateFormatted"
      :label="label"
      prepend-inner-icon="mdi-calendar"
      :readonly="!readOnly"
      :disabled="readOnly"
      :box="box"
      :outline="outline"
      :single-line="singleLine"
      :flat="flat"
      :solo="solo"
      :solo-inverted="soloInverted"
      :hide-details="hideDetails"
      :rules="rules"
      :height="height"
    )
    v-date-picker(
      v-if="mode === 'date'"
      v-model="date"
      :type="type"
      color="primary"
      scrollable
      :max="max"
      :min="min"
      :allowedDates="allowedDates"
    )
      v-spacer
      v-btn(flat color="primary" @click="confirmDate") OK
    v-time-picker(
      v-model="time"
      v-if="mode === 'time'"
      color="primary"
    )
      v-spacer
      v-btn(flat @click="mode = 'date'") Back
      v-btn(flat color="primary" @click="confirmTime") OK
</template>

<script>
import _ from 'lodash';
import {
  format,
  getTime,
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
} from 'date-fns';
import { initLogger } from '../../utils/logger';

const log = initLogger('DatePickerMenu');

export default {
  props: {
    readOnly: Boolean,
    label: {
      type: String,
      default: 'Select Date',
    },
    value: {
      type: [Number, Date, String],
      default: undefined,
    },
    format: {
      type: String,
      default: undefined,
    },
    formatterOverride: {
      type: Function,
      default: undefined,
    },
    type: {
      type: String,
      default: 'date',
    },
    height: {
      type: String,
      default: undefined,
    },
    datetime: Boolean,
    box: Boolean,
    outline: Boolean,
    singleLine: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    max: {
      type: String,
      default: undefined,
    },
    min: {
      type: String,
      default: undefined,
    },
    hideDetails: {
      type: Boolean,
      default: true,
    },
    rules: {
      type: Array,
      default: undefined,
    },
    allowedDates: { // eslint-disable-line
      // FIXME: assign proper type
      default: undefined,
    },
  },
  data () {
    return {
      menu: false,
      mode: 'date',
    };
  },
  computed: {
    date: {
      get () {
        if (!this.value) return;
        // internal: format used by v-date-picker
        return format(this.value, 'YYYY-MM-DD');
      },
      set (val) {
        log('computed#date#set#val', val);
        const [year, month, date] = _.split(val, '-');
        const withYear = setYear(this.value, year);
        const withMonth = setMonth(withYear, month - 1); // month is 0 based
        const withDate = this.type === 'date'
          ? setDate(withMonth, date)
          : withMonth;

        const result = getTime(withDate);
        this.$emit('input', result);
        if (!this.datetime) this.$emit('change', result);
      },
    },
    time: {
      get () {
        if (!this.value) return;
        // internal: format used by v-time-picker
        return format(this.value, 'HH:mm');
      },
      set (val) {
        log('computed#time#set#val', val);
        const [hours, minutes] = _.split(val, ':');
        const withHour = setHours(this.value, hours);
        const withMinutes = setMinutes(withHour, minutes);

        const result = getTime(withMinutes);
        this.$emit('input', result);
      },
    },
    typedFormat () {
      if (this.format) return this.format;
      if (this.type === 'month') return 'MM/YYYY';
      return 'MM/DD/YYYY';
    },
    dateFormatted () {
      if (!this.value) return;
      if (this.formatterOverride) return this.formatterOverride(this.value);
      return this.$morphDate(this.value, this.typedFormat);
    },
  },
  watch: {
    menu (val, prev) {
      if (val && !prev) this.mode = 'date';
    },
    date () {
      if (this.type === 'month') this.menu = false;
    },
  },
  methods: {
    confirmDate () {
      if (this.datetime) {
        this.mode = 'time';
      } else {
        this.$emit('change', this.value);
        this.menu = false;
      }
    },
    confirmTime () {
      this.$emit('change', this.value);
      this.menu = false;
    },
  },
};
</script>
