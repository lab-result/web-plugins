<template lang="pug">
  div
    v-dialog(v-model="model" width="700" scrollable)
      v-card
        v-toolbar(flat)
          h2 Encounter Logs
          v-spacer
          v-btn(icon @click="model = false")
            v-icon mdi-close
        v-card-text(v-if="!recordHistories.length" style="height: 100px;").text-xs-center
          h3.grey--text No encounter logs found.
          p Medical record amendments will appear here.
        v-card-text(v-else)
          v-list(two-line)
            v-list-tile(v-for="(record, key) in recordHistories" :key="key" style="cursor: default")
              v-list-tile-avatar
                img(:src="record.historyCreatedBy | get-pic")
              v-list-tile-content
                v-list-tile-title {{record.historyCreatedBy.name | prettify-name}}&nbsp;
                  span.grey--text {{record._type | get-history-type}}&nbsp;
                  span.grey--text {{record.type | articulate-record-name}}&nbsp;
                  span.custom-chip {{record.type | get-record-name}}
                  span.grey--text &nbsp;record.
                v-list-tile-sub-title {{record._createdAt | morph-date('MMM DD, YYYY [at] hh:mm A')}}
            v-list-tile(@click="loadMore" v-show="hasMore && !paginating")
              v-list-tile-title.text-xs-center Load more
</template>

<script>
import _ from 'lodash';
import { ALL_RECORD_TYPES } from './constants';
import { paginateQuery } from '../../utils/store';

export default {
  filters: {
    filterByType (records, type, name) {
      const record = records.find(record => record.type === type);
      return record ? { ...record, recordName: name } : null;
    },
    getPic (obj) {
      return obj.picURL;
    },
    getHistoryType (type) {
      let action;
      switch (type) {
        case 'create': action = 'created'; break;
        case 'update': action = 'updated'; break;
        case 'remove': action = 'removed'; break;
      }
      return action;
    },
    getRecordName (type) {
      const record = ALL_RECORD_TYPES.find(record => record.type === type);
      if (_.isEmpty(record)) return '';
      return record.name;
    },
    articulateRecordName (type) {
      const record = ALL_RECORD_TYPES.find(record => record.type === type);
      if (_.isEmpty(record)) return '';
      return record.article;
    },
  },
  props: {
    dialog: Boolean,
    encounter: {
      type: Object,
      default: undefined,
    },
  },
  data () {
    return {
      model: this.dialog,
      total: 0,
      pageNo: 1,
      recordHistories: [],
      paginating: false,
    };
  },
  computed: {
    hasMore () {
      return this.total > (this.pageNo * 20);
    },
  },
  watch: {
    dialog (val) {
      this.model = val;
    },
    model (val) {
      if (!val) {
        this.$emit('close', false);
        this.recordHistories = [];
        this.pageNo = 1;
      } else {
        this.init();
      }
    },
  },
  methods: {
    async init () {
      await this.fetchRecordHistories();
    },
    async fetchRecordHistories () {
      try {
        this.paginating = true;
        const query = {
          encounter: this.encounter.id,
          $history: true,
          $populate: {
            createdByDetails: {
              service: 'organization-members',
              method: 'findOne',
              localKey: 'createdBy',
              foreignKey: 'uid',
            },
            _createdByDetails: {
              service: 'organization-members',
              method: 'findOne',
              localKey: '_createdBy',
              foreignKey: 'uid',
            },
          },
        };

        const { items, total } = await this.$sdk.service('medical-records')
          .find(paginateQuery({ query, pageNo: this.pageNo, pageSize: 20 }));
        const result = items?.map(item => {
          const obj = {
            createdByDetails: item.$populated.createdByDetails,
            historyCreatedBy: item.$populated._createdByDetails,
            ...item,
          };
          delete obj.$populated;
          return obj;
        });

        this.recordHistories = this.recordHistories.concat(result);
        this.total = total;
      } catch (error) {
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'There was an error. Please try again later.',
          color: 'error',
        });
      } finally {
        this.paginating = false;
      }
    },
    async loadMore () {
      this.pageNo += 1;
      await this.fetchRecordHistories();
    },
  },
};
</script>

<style scoped>
  .custom-chip {
    background-color: #E3E6E7;
    padding: 5px;
  }
  .default-cursor {
    cursor: default !important;
  }
</style>
