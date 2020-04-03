<template lang="pug">
  v-combobox(
    v-model="model"
    :items="items"
    :label="label"
    :box="box"
    :clearable="clearable"
    :hint="hint"
    :outline="outline"
    :rules="rules"
    :solo="solo"
    :hide-details="hideDetails"
    :disabled="disabled"
    @input.native="updateModel($event.srcElement.value)"
    height="60"
  )
    template(slot="label")
      slot(name="label")
        span {{label}}
  //- v-text-field(
  //-   v-model="model"
  //-   :box="box"
  //-   :clearable="clearable"
  //-   :hint="hint"
  //-   :outline="outline"
  //-   :rules="rules"
  //-   :solo="solo"
  //-   :hide-details="hideDetails"
  //- )
  //-   template(slot="label")
  //-     span {{label}}
  //-       strong(v-if="required" style="font-size: 24px").error--text *
  //-   template(slot="append" v-if="showChoose")
  //-     v-tooltip(bottom)
  //-       template(slot="activator" slot-scope="props")
  //-         v-icon(
  //-           v-if="hasItems"
  //-           v-on="props.on"
  //-           @click="dialog = true"
  //-         ).black--text mdi-file-document-box-outline
  //-       span View all
  //-     v-dialog(v-model="dialog" width="500" scrollable)
  //-       v-card
  //-         v-toolbar(flat dense)
  //-           v-toolbar-title Choose {{label}}
  //-         v-card-text(style="height: 300px;").pa-0
  //-           v-list
  //-             v-list-tile(
  //-               v-for="(item, key) in items"
  //-               @click="model = item; dialog = false;"
  //-               :key="key"
  //-             )
  //-               v-list-tile-title {{item}}
  //-         v-divider
  //-         v-card-actions
  //-           v-spacer
  //-           v-btn(@click="dialog = false" color="error" depressed small) Close
</template>

<script>
/**
 * Designed for v-model
 * @emits model
 * @return {Object}
 */
export default {
  props: {
    box: Boolean,
    clearable: Boolean,
    hint: {
      type: String,
      default: undefined,
    },
    items: {
      type: Array,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    outline: Boolean,
    rules: { type: Array, default: () => [] },
    solo: Boolean,
    value: {
      type: [String, Object],
      default: undefined,
    },
    hideDetails: Boolean,
    disabled: Boolean,
  },
  data () {
    return {
      dialog: false,
    };
  },
  computed: {
    required () {
      return !!this.rules.length;
    },
    hasItems () {
      return this.items && this.items.length;
    },
    model: {
      get () {
        return this.value;
      },
      set (val) {
        this.$emit('input', val);
      },
    },
    showChoose () {
      return this.items && this.items.length;
    },
  },
  methods: {
    updateModel (value) {
      this.model = value;
    },
  },
};
</script>
