<template lang="pug">
  div
    v-select(
      item-text="insurerName"
      item-value="id"
      :box="box"
      :outline="outline"
      :single-line="outline"
      :flat="flat"
      :solo="solo"
      :solo-inverted="soloInverted"
      :hide-details="hideDetails"
      :label="label"
      :disabled="disabled"
      :clearable="!readonly && clearable"
      :readonly="readonly"
      :items="insuranceContracts"
      :value="value"
      :rules="rules"
      :return-object="returnObject"
      :menu-props="menuProps"
      @change="selectContract"
    )
</template>

<script>
export default {
  props: {
    box: Boolean,
    outline: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    hideDetails: Boolean,
    value: {
      type: [Object, String],
      default: undefined,
    },
    disabled: Boolean,
    readonly: Boolean,
    returnObject: Boolean,
    label: {
      type: String,
      default: 'Select Insurer',
    },
    contractType: {
      type: String,
      default: 'all',
      required: true,
      validator: (value) => {
        return ['all', 'company', 'hmo', 'government']
          .indexOf(value) !== -1;
      },
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    rules: {
      type: Array,
      default: undefined,
    },
    menuProps: {
      type: [String, Object],
      default: undefined,
    },
  },
  data () {
    return {
      loading: false,
    };
  },
  computed: {
    insuranceContracts () {
      if (this.contractType === 'hmo') {
        return this.$store.getters['insurance-contracts/hmoInsuranceContracts'] || [];
      } else if (this.contractType === 'government') {
        return this.$store.getters['insurance-contracts/governmentInsuranceContracts'] || [];
      } else if (this.contractType === 'company') {
        return this.$store.getters['insurance-contracts/companyInsuranceContracts'] || [];
      }

      return this.$store.state['insurance-contracts'].insuranceContracts || [];
    },
  },
  created () {
    this.$initLogger('insurance-contract-picker');
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        await this.$store.dispatch('insurance-contracts/getInsuranceContracts', this.$activeOrganization.id);
      } catch (error) {
        this.$log('init#error', error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
    selectContract (value) {
      this.$log('selectContract', value);
      this.$emit('select', value);
    },
  },
};
</script>
