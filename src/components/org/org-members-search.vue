<template lang="pug">
  div
    generic-search(
      :box="box"
      :outline="outline"
      :single-line="outline"
      :flat="flat"
      :solo="solo"
      :solo-inverted="soloInverted"
      :label="label"
      :loading="loading"
      :slotted="true"
      :items="items || []"
      :item-value="itemValue"
      :value="value"
      :disabled="disabled"
      :rules="rules"
      @select="selectMember"
      @search="searchOrgMember"
      no-filter
      chips
      :return-object="returnObject"
      :hide-details="hideDetails"
      :multiple="multiple"
    )
      template(slot="selection" slot-scope="props")
        v-chip {{props.item.name | prettify-name}}
      template(slot="item" slot-scope="props")
        v-list-tile-avatar
          v-avatar(:size="40").mr-2
            img(:src="props.item.picURL" v-if="props.item.picURL")
            img(src="@/assets/images/person-placeholder.png" v-else)
        v-list-tile-content
          v-list-tile-title {{props.item.name | prettify-name}}
          v-list-tile-sub-title
            v-layout(row wrap).ma-0.pa-0
              template(v-for="(role, key) in filRoles(props.item)")
                kbd.font-weight-thin.mr-1 {{role}}
        v-list-tile-action(v-if="showTags")
          v-layout(row)
            v-chip(
              v-for="tag in props.item.tags"
              :key="tag"
              small
            ) {{tag | get-tag-name}}
</template>

<script>
// components
import GenericSearch from '../commons/generic-search';
// constants
import * as constants from '../../constants/organizations';
// utils
import _ from 'lodash';
import { initLogger } from '../../utils/logger';
import * as organizationMembers from '../../services/organization-members';

const log = initLogger('OrgMembersSearch');
const TAG_NAME_MAP = {
  'per-patient-consult': 'Per Patient',
  'per-hour-consult': 'Per Hour',
};

export default {
  components: {
    GenericSearch,
  },
  filters: {
    getTagName (str) {
      return _.get(TAG_NAME_MAP, str);
    },
  },
  props: {
    box: Boolean,
    outline: Boolean,
    flat: Boolean,
    solo: Boolean,
    soloInverted: Boolean,
    // FIXME: set proper type
    value: null, // eslint-disable-line
    filterRoles: {
      type: Array,
      default: null,
    },
    label: {
      type: String,
      default: 'Search staff by name',
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
    showTags: Boolean,
    itemValue: {
      type: String,
      default: 'uid',
    },
  },
  data () {
    return {
      loading: false,
      data: [],
    };
  },
  computed: {
    selectedItem: {
      get () {
        return this.value;
      },
      set (value) {
        log('selectMember', value);
        this.$emit('input', value);
        this.$emit('select', value);
      },
    },
    items () {
      if (this.value) {
        return _.union(this.data, _.isArray(this.value) ? this.value : _.unionBy(this.data, [this.value], this.itemValue));
      } else {
        return this.data;
      }
    },
  },
  watch: {
    filterRoles () {
      this.loadMembers('');
    },
  },
  mounted () {
    this.loadMembers();
  },
  methods: {
    async loadMembers (searchString) {
      try {
        this.loading = true;
        const opts = {
          organization: this.$activeOrganization.id,
          searchString,
          limit: 20,
        };
        if (this.filterRoles) opts.roles = { $in: this.filterRoles };
        const { items: members } = await organizationMembers.getOrganizationMembers(this.$sdk, opts);
        if (!_.isEmpty(this.items)) {
          this.combineMembers(members, this.items);
        } else if (!_.isEmpty(this.selectedItem)) {
          if (_.isArray(this.selectedItem)) {
            this.combineMembers(this.data, this.selectedItem);
          } else {
            this.data.push(this.selectedItem);
          }
        } else {
          this.data = members;
        }
      } catch (error) {
        log('loadMembers#error', error);
        this.$enqueueSnack({
          color: 'error',
          message: 'Something went wrong! Please try again.',
        });
      } finally {
        this.loading = false;
      }
    },
    combineMembers (firstItemSet, secondItemSet) {
      if (!_.isEmpty(this.filterRoles)) {
        this.data = _.unionBy(firstItemSet, secondItemSet, this.itemValue)
          .filter(member => {
            return !_.isEmpty(_.intersection(member.roles, this.filterRoles));
          });
      } else {
        this.data = _.unionBy(firstItemSet, secondItemSet, this.itemValue);
      }
    },
    searchOrgMember (searchString) {
      this.loadMembers(searchString);
    },
    selectMember (value) {
      this.selectedItem = _.cloneDeep(value);
    },
    filRoles (member) {
      return (member.roles || [])
        .map(role => constants.ROLES_MAP[role])
        .filter(role => !!role)
        .map(role => role.name);
    },
  },
};
</script>
