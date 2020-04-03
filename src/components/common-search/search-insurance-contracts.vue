<template lang="pug">
  generic-search(
    v-model="model"
    :items="items"
    :label="label"
    :item-text="itemText"
    :item-value="itemValue"
    :return-object="returnObject"
    :loading="loading"
    :disabled="disabled"
    :hide-details="hideDetails"
    :multiple="multiple"
    :flat="flat"
    :box="box"
    :outline="outline"
    :single-line="outline"
    :solo="solo"
    :solo-inverted="soloInverted"
    :rules="rules"
    chips
    no-filter
    @search="fetchContracts"
  )
</template>

<script>
import GenericSearch from '../commons/generic-search';
import { useModel } from '../../utils/vue';
import { initLogger } from '../../utils/logger';
import _ from 'lodash';

const log = initLogger('SearchInsuranceContracts');

const TYPE_QUERY_MAP = {
  hmo: { type: 'insurance-facility', insurerSubtype: 'hmo' },
  company: { type: 'corporate-partner-facility' },
};

/**
 * @desc
 * Meant as an alternative and possibly eventual replacement for
 * {@link InsuranceContractSearch}, with more explicit handling of state:
 * normalizedModel and items always behave the same way regardless of special
 * cases encountered.
 *
 * The variables are also more clearly named and commented to explicitly
 * delineate the two supported use cases: insurance contract objects and IDs.
 */
export default {
  components: { GenericSearch },
  props: {
    type: {
      type: String,
      required: true,
    },
    // FIXME: assign proper type
    value: null, // eslint-disable-line
    label: {
      type: String,
      default: undefined,
    },
    itemText: {
      type: String,
      default: undefined,
    },
    itemValue: {
      type: String,
      default: 'id',
    },
    returnObject: Boolean,
    disabled: Boolean,
    hideDetails: Boolean,
    multiple: Boolean,
    flat: Boolean,
    box: Boolean,
    outline: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    rules: {
      type: Array,
      default: () => [],
    },
    required: Boolean,
  },
  data () {
    return {
      fetchedContracts: [],
      fetchedModel: null,
      loading: false,
    };
  },
  computed: {
    // model is meant to be an insurance contract, controlled by v-model
    model: useModel(),
    // normalizedModel is always an Object
    // even if model is provided with an unpopulated id
    normalizedModel () {
      // if model is an id, fetchContractModel will fetch the actual contract
      // and place it into fetchedModel
      return _.isString(this.model) ? this.fetchedModel : this.model;
    },
    items () {
      // always keep model in items
      // to avoid disappearing model when searching
      return _.isEmpty(this.model)
        ? this.fetchedContracts
        // make sure to use normalizedModel here
        // because model can sometimes be an unpopulated id
        : _.union(this.fetchedContracts, [this.normalizedModel]);
    },
  },
  watch: {
    model (model) {
      // mirror other common-search components' interface: emit 'select' on select
      this.$emit('select', model);

      // re-fetch if needed
      this.fetchContractModel();
    },
  },
  mounted () {
    this.fetchContracts();
    this.fetchContractModel();
  },
  methods: {
    async fetchContracts (searchString) {
      this.loading = true;
      try {
        const queryOpts = TYPE_QUERY_MAP[this.type];
        const query = {
          ...queryOpts,
          insured: this.$activeOrganization.id,
          limit: 20,
        };
        if (searchString) query.searchString = searchString;
        log('fetchContracts#query: %O', query);

        const { items } = await this.$store.dispatch(
          'insurance-contracts/loadInsuranceContracts',
          query
        );
        log('fetchContracts#items: %O', items);
        this.fetchedContracts = items;
      } catch (error) {
        log('fetchContracts#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    async fetchContractModel () {
      log('fetchContractModel#model: %O', this.model);
      // fetch only if model is currently an id
      // and place into fetchedModel
      if (_.isEmpty(this.model)) return;
      if (!_.isString(this.model)) return;

      this.loading = true;
      try {
        this.fetchedModel = await this.$store.dispatch(
          'insurance-contracts/loadInsuranceContract',
          { id: this.model }
        );
        log('fetchContractModel#fetchedModel: %O', this.fetchedModel);
      } catch (error) {
        log('fetchContractModel#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
  },
};
</script>
