<template lang="pug">
  div
    v-tooltip(bottom)
      v-select(
        slot="activator"
        v-model="filter"
        :items="itemsWithCustom"
        :flat="flat"
        :box="box"
        :solo="solo"
        :outline="outline"
        :single-line="outline"
        :hide-details="hideDetails"
        :disabled="disabled"
        :readonly="readonly"
        item-text="text"
        item-value="text"
        return-object
        label="Select Date Filter"
        prepend-inner-icon="mdi-calendar"
        :rules="rules"
        :menu-props="menuProps"
      )
        template(#label)
          span(:class="filter.text && 'black--text'").py-2 {{ filter.text || 'Select Date Filter' }}
      | {{ tooltipText }}
    v-dialog(v-model="dialog" persistent width="650")
      v-card
        v-toolbar(flat)
          h2 Select Custom Date Range
          v-spacer
          v-btn(icon @click="close()")
            v-icon mdi-close
        v-card-text
          v-layout(row wrap)
            v-flex(xs12 md6).text-xs-center
              h3.mb-3 From Date {{customStart}}
              v-date-picker(
                v-model="customStart"
                color="primary"
                :allowed-dates="restrictStart"
                :max="maxDate"
                :min="minDate"
              )
            v-flex(xs12 md6).text-xs-center
              h3.mb-3 To Date {{customEnd}}
              v-date-picker(
                v-model="customEnd"
                color="primary"
                :allowed-dates="restrictEnd"
                :max="maxDate"
                :min="minDate"
              )
        v-divider
        v-card-actions
          v-spacer
          v-btn(
            large
            color="primary"
            :disabled="!hasSelected"
            @click="selectCustomDaterange"
          ) Confirm
          v-btn(
            flat
            large
            @click="close()"
          ) Cancel
</template>

<script>
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  isEqual,
  getTime,
  format,
} from 'date-fns';
import { isEmpty } from 'lodash';
import { initLogger } from '../../utils/logger';

const getDefaultItems = () => [
  {
    text: 'Today',
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    past: false,
  },
  {
    text: 'Yesterday',
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(subDays(new Date(), 1)),
    past: true,
  },
  {
    text: 'Last 7 Days',
    start: subDays(new Date(), 6),
    end: new Date(),
    past: true,
  },
  {
    text: 'Last 30 Days',
    start: subDays(new Date(), 29),
    end: new Date(),
    past: true,
  },
  {
    text: 'This Month',
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
    past: true,
  },
  {
    text: 'Last Month',
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
    past: true,
  },
];
const CUSTOM_ITEM = { text: 'Custom', custom: true };
const ALL_ITEM = { text: 'All', start: null, end: null };
const log = initLogger('DateFilter');

export default {
  props: {
    value: {
      type: Object,
      required: true,
    },
    default: {
      type: String,
      default: undefined,
    },
    items: {
      type: Array,
      default: getDefaultItems,
    },
    allowCustom: {
      type: Boolean,
      default: true,
    },
    allowAllOption: {
      type: Boolean,
      default: false,
    },
    noFuture: {
      type: Boolean,
      default: undefined,
    },
    noPast: {
      type: Boolean,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    flat: {
      type: Boolean,
      default: undefined,
    },
    box: {
      type: Boolean,
      default: undefined,
    },
    solo: {
      type: Boolean,
      default: undefined,
    },
    outline: {
      type: Boolean,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
    readonly: {
      type: Boolean,
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
    menuProps: {
      type: [String, Object],
      default: () => ({
        maxHeight: 'auto',
        bottom: true,
        offsetY: true,
      }),
    },
  },
  data () {
    return {
      filter: null,
      dialog: false,
      customStart: null,
      customEnd: null,
      oldVal: null,
      cancelled: false,
    };
  },
  computed: {
    model: {
      get () {
        return this.value;
      },
      set (val) {
        log('computed#model#set: %O', val);
        const range = {
          ...val,
          start: getTime(val.start),
          end: getTime(val.end),
        };

        log('computed#model#set#range: %O', range);
        if (!this.cancelled) this.$emit('input', range);
      },
    },
    itemsWithCustom () {
      let items = [
        ...this.allowAllOption ? [ALL_ITEM] : [],
        ...this.items,
        ...this.allowCustom ? [CUSTOM_ITEM] : [],
      ];

      if (this.default) {
        items = [items.find(i => i.text === this.default)]
          .filter(Boolean)
          .concat(items.filter(i => i.text !== this.default));
      }
      if (this.noPast) {
        items = items.filter(i => !i.past);
      }

      return items;
    },
    maxDate () {
      return this.noFuture ? format(new Date(), 'YYYY-MM-DD') : null;
    },
    minDate () {
      return this.noPast ? format(new Date(), 'YYYY-MM-DD') : null;
    },
    hasSelected () {
      return !isEmpty(this.customStart) && !isEmpty(this.customEnd);
    },
    tooltipText () {
      const index = this.itemsWithCustom.findIndex(item => item.text === this.filter.text);
      return ~index ? 'Date Filter' : this.filter.text;
    },
  },
  watch: {
    filter: {
      handler (val, oldVal) {
        this.oldVal = oldVal;

        if (val.custom && (!val.start && !val.end)) {
          this.dialog = true;
        } else {
          this.model = val;
          this.cancelled = false;
        }
      },
      deep: true,
    },
  },
  created () {
    this.init();
  },
  methods: {
    init () {
      log('init#model: %O', this.model);
      if (isEmpty(this.model)) this.filter = this.itemsWithCustom[0];
      else this.filter = { ...this.model };
      log('init#filter: %O', this.filter);
    },
    restrictStart (date) {
      if (!this.customEnd) return true;

      return isBefore(date, this.customEnd) || isEqual(date, this.customEnd);
    },
    restrictEnd (date) {
      if (!this.customStart) return true;

      return isAfter(date, this.customStart) || isEqual(date, this.customStart);
    },
    selectCustomDaterange () {
      log('selectCustomDaterange#customStart: %O', this.customStart);
      log('selectCustomDaterange#customEnd: %O', this.customEnd);
      if (this.hasSelected) {
        this.cancelled = false;
        this.filter = {
          text: `From: ${format(this.customStart, 'MMM DD, YYYY')}` +
            ` To: ${format(this.customEnd, 'MMM DD, YYYY')}`,
          custom: true,
          start: startOfDay(new Date(this.customStart)),
          end: endOfDay(new Date(this.customEnd)),
        };
        this.dialog = false;
      }
    },
    close () {
      this.dialog = false;
      this.cancelled = true;
      this.filter = this.oldVal;
    },
  },
};
</script>
