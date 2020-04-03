<template lang="pug">
  div
    generic-search(
      :items="contractItems"
      :value="value"
      :item-value="itemValue"
      :return-object="returnObject"
      :multiple="multiple"
      :hide-details="hideDetails"
      :chips="multiple"
      no-filter
      :rules="rules"
      :disabled="disabled"
      :slotted="true"
      :loading="loading"
      :label="label"
      :solo-inverted="soloInverted"
      :solo="solo"
      :flat="flat"
      :single-line="outline"
      :outline="outline"
      :box="box"
      @select="selectContract"
      @search="searchContract"
    )
      template(slot="selection" slot-scope="props")
        v-tooltip(top :disabled="!truncateLength")
          template(#activator="{ on }")
            v-chip(v-on="on") {{ truncateName(props.item.insurerName) }}
          span {{ props.item.insurerName }}
      template(slot="item" slot-scope="props")
        v-list-tile-content
          v-list-tile-title {{props.item.insurerName}}
</template>

<script>
import _ from 'lodash';
import GenericSearch from '../commons/generic-search';
import { initLogger } from '../../utils/logger';

const log = initLogger('insurance-contract-search');

const FILTER_QUERY_MAPPER = (filter) => {
  if (filter === 'hmo') {
    return { type: 'insurance-facility', insurerSubtype: 'hmo' };
  } else if (filter === 'company') {
    return { type: 'corporate-partner-facility' };
  } else if (filter === 'government') {
    return { type: 'insurance-facility', insurerSubtype: 'government' };
  }

  return null;
};

export default {
  components: { GenericSearch },
  props: {
    // FIXME: set proper type
    value: null, // eslint-disable-line
    // hmo, company
    // FIXME: set proper type
    filter: null, // eslint-disable-line
    box: Boolean,
    outline: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    label: {
      type: String,
      default: 'Search partner by name',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    rules: {
      type: Array,
      default: () => [],
    },
    hideDetails: Boolean,
    multiple: Boolean,
    returnObject: {
      type: Boolean,
      default: true,
    },
    itemValue: {
      type: String,
      default: 'insurer',
    },
    truncateLength: {
      type: Number,
      default: undefined,
    },
  },
  data () {
    return {
      loading: false,
      contracts: [],
    };
  },
  computed: {
    organization () {
      return this.$activeOrganization || {};
    },
    selectedContract: {
      get () {
        return this.value;
      },
      set (value) {
        log('selectContract', value);
        this.$emit('input', value);
        this.$emit('select', value);
      },
    },
    contractItems () {
      if (_.isEmpty(this.value)) return this.contracts;

      return _.unionBy([this.value], this.contracts, 'id');
    },
  },
  watch: {
    filter () {
      this.loadContracts();
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;
        await this.loadContracts();
        await this.loadSelectedContract(this.selectedContract);
      } catch (error) {
        log('init#error', error);
        this.$enqueueSnack({
          color: 'error',
          message: error.message,
        });
      } finally {
        this.loading = false;
      }
    },
    async loadSelectedContract (selectedContract) {
      // normalize contract id: selectedContract may either be an object or a string
      const contractId = _.get(selectedContract, 'id') || selectedContract;
      log('loadSelectedContract#contractId: %O', contractId);
      try {
        // check if contractId has a value
        if (!contractId) return;

        // check cached contracts
        const match = _.find(this.contracts, c => c.id === contractId);
        if (match) {
          this.selectedContract = _.cloneDeep(match);
          return;
        }

        // if not found, query from server
        this.loading = true;
        const result = await this.$store.dispatch(
          'insurance-contracts/loadInsuranceContract',
          { id: contractId }
        );
        log('loadSelectedContract#result: %O', result);
        if (!_.isEmpty(result)) this.selectedContract = result;
        this.loading = false;
      } catch (error) {
        log('loadSelectedContract#error', error);
      }
    },
    async loadContracts (searchString) {
      try {
        this.loading = true;
        const filter = FILTER_QUERY_MAPPER(this.filter) || {};
        const insured = this.organization.id;
        const query = { insured, limit: 20, ...filter };

        if (searchString) query.searchString = searchString;
        const result = await this.$store.dispatch('insurance-contracts/loadInsuranceContracts', query);
        this.contracts = (result || {}).items || [];
      } catch (e) {
        log('loadContracts#e', e);
      } finally {
        this.loading = false;
      }
    },
    searchContract (searchString) {
      this.loadContracts(searchString);
    },
    selectContract (value) {
      this.selectedContract = _.cloneDeep(value);
    },
    truncateName (name) {
      if (_.isEmpty(name)) return '';
      if (_.isNil(this.truncateLength)) return name || '';
      return name.length > this.truncateLength + 3
        ? `${name.substring(0, this.truncateLength - 1)}...`
        : name;
    },
  },
};
</script>
