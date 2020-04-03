<template lang="pug">
  generic-search(
    v-model="model"
    item-text="name"
    item-value="id"
    no-filter
    :items="items"
    :loading="loading"
    :label="label"
    :return-object="returnObject"
    :multiple="multiple"
    :chips="chips"
    :outline="outline"
    :no-data-text="noDataText"
    :read-only="readOnly"
    @search="fetchBranches"
  )
</template>

<script>
import GenericSearch from '../commons/generic-search';
import { useModel } from '../../utils/vue';
import { initLogger } from '../../utils/logger';
import _ from 'lodash';

const log = initLogger('SearchBranches');

export default {
  components: { GenericSearch },
  props: {
    // FIXME: assign type
    value: null, // eslint-disable-line
    type: {
      type: String,
      default: undefined,
    },
    label: {
      type: String,
      default: undefined,
    },
    returnObject: Boolean,
    multiple: Boolean,
    chips: Boolean,
    outline: Boolean,
    noDataText: {
      type: String,
      default: undefined,
    },
    readOnly: Boolean,
    filterOutBranches: {
      type: Array,
      default: undefined,
    },
  },
  data () {
    return {
      fetchedBranches: [],
      fetchedBranchesModelArray: null,
      loading: false,
    };
  },
  computed: {
    // model is meant to be either a queue or an array of branches, controlled by v-model
    model: useModel(),
    // normalizedModelArray is always an array,
    // normalizing the two cases of this.multiple
    normalizedModelArray () {
      return this.multiple ? this.model : [this.model];
    },
    // populatedModel is always populated as a object, never a raw id
    // normalizing the two cases of whether normalizedModelArray contains ids or objects
    populatedModelArray () {
      if (this.returnObject) return this.normalizedModelArray;
      // if some items in normalizedModelArray are not objects,
      // fetchBranchesModel will fetch an array of populated branches
      // and place it into fetchedBranchesModelArray
      return _.every(this.normalizedModelArray, _.isObject)
        ? this.normalizedModelArray
        : this.fetchedBranchesModelArray;
    },
    items () {
      // always keep model in items
      // to avoid disappearing model when searching
      return _.isEmpty(this.model)
        ? this.fetchedBranches
        // make sure to use populatedModelArray here
        // because model can sometimes be an unpopulated id or an array of unpopulated ids
        : _.unionBy(this.fetchedBranches, this.populatedModelArray, 'id');
    },
  },
  watch: {
    model (model) {
      // mirror other common-search components' interface: emit 'select' on select
      this.$emit('select', model);

      // re-fetch if needed
      this.fetchBranchesModel();
    },
  },
  mounted () {
    this.fetchBranches();
    this.fetchBranchesModel();
  },
  methods: {
    async fetchBranches (searchText) {
      this.loading = true;
      try {
        const query = {};
        switch (this.$activeOrganization.type) {
          case 'personal-clinic': {
            query.createdBy = this.$activeOrganization.createdBy;
            break;
          }
          case 'cms': {
            query.parent = this.$activeOrganization.id;
            break;
          }
        }
        if (this.filterOutBranches?.length) {
          query.id = { $nin: this.filterOutBranches.map(b => b.id) };
        }

        // configure search
        if (typeof searchText === 'string' && searchText) {
          query.name = {
            $regex: `^${searchText}`,
            $options: 'i',
          };
        }

        // TODO: configure pagination

        // execute ops
        const result = await this.$sdk.service('organizations').find(query);
        log('fetchBranches#items: %O', result.items);
        this.fetchedBranches = result.items;
      } catch (error) {
        log('fetchBranches#error: %O', error);
        this.$enqueueSnack({
          message: 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
    async fetchBranchesModel () {
      log('fetchBranchesModel#model: %O', this.model);
      if (_.isEmpty(this.model)) return;

      // fetch only if branches are ids and place into fetchedBranchesModelArray
      // use normalizedModelArray for simplicity, which is always an array
      if (this.returnObject) return;
      if (_.every(this.normalizedModelArray, _.isObject)) return;

      this.loading = true;
      try {
        const promises = _.map(
          this.normalizedModelArray,
          // fetch only if item is an id
          item => _.isString(item)
            ? this.$sdk.service('organizations').get(item)
            : item
        );
        this.fetchedBranchesModelArray = await Promise.all(promises);
        log('fetchBranchesModel#fetchedBranchesModelArray: %O', this.fetchedBranchesModelArray);
      } catch (error) {
        log('fetchBranchesModel#error: %O', error);
        this.$enqueueSnack({
          message: 'Something went wrong! Please try again.',
          color: 'error',
        });
      }
      this.loading = false;
    },
  },
};
</script>
