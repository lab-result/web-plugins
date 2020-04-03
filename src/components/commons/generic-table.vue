<template lang="pug">
  div
    v-card(:flat="flat")
      v-toolbar(
        flat
        v-bind="toolbarOptions"
        v-if="!hideToolbar"
      )
        v-layout(row align-center)
          slot(name="left-action")
          template(v-if="toolbarTitle")
            v-flex(grow v-show="!hideToolbarTitle").px-1
              span.title {{ toolbarTitle }}
          template(v-if="dateFilterable")
            v-flex(xs3 v-show="!hideDateFilter").px-1
              slot(name="date-filter" :date-filter-model="dateFilterModel")
                date-filter(
                  v-model="dateFilterModel"
                  flat
                  solo
                  v-bind="dateFilterOptions"
                )
          template(v-if="filterable")
            v-flex(v-bind="filterBindOptions" v-show="!hideFilter" data-test="filter").px-1
              slot(name="filter" :filterModel="filterModel" :filterItems="filterItems")
                v-select(
                  v-model="filterModel"
                  :items="filterItems"
                  :label="filterLabel"
                  v-bind="filterOptions"
                  flat
                  solo
                  hide-details
                )
          slot(name="middle-action")
          v-spacer
          template(v-if="internalSearchable")
            v-flex(xs3 v-show="!hideInternalSearch").px-1
              slot(name="internal-search")
                v-text-field(
                  :value="internalSearchModelEnabled ? internalSearchModel : guardedInternalSearchText"
                  @input="onInternalSearchTextChange"
                  :append-icon="searchIcon"
                  :label="searchLabel"
                  v-bind="searchOptions"
                  single-line
                  hide-details
                  solo
                  flat
                  clearable
                )
          template(v-if="searchable")
            v-flex(v-bind="searchBindOptions" v-show="!hideSearch" data-test="search").px-1
              slot(name="search" :searchTextModel="searchTextModel")
                v-text-field(
                  v-model="searchTextModel"
                  :append-icon="searchIcon"
                  :label="searchLabel"
                  v-bind="searchOptions"
                  single-line
                  hide-details
                  solo
                  flat
                  clearable
                )
          template(v-if="refreshable")
            v-tooltip(bottom)
              template(slot="activator")
                slot(name="refresh")
                  v-btn(
                    color="primary"
                    flat
                    icon
                    large
                    @click="$emit('refresh')"
                  )
                    v-icon mdi-refresh
              | {{refreshLabel}}
          template(v-if="addable")
            v-tooltip(bottom v-show="!hideAdd")
              template(slot="activator")
                slot(name="add")
                  v-btn(
                    color="primary"
                    flat
                    icon
                    large
                    @click="$emit('add')"
                  )
                    v-icon mdi-plus
              | {{addLabel}}
          template(v-if="importable")
            slot(name="import" :hide-import="hideImport")
              v-tooltip(bottom v-show="!hideImport")
                v-menu(offset-y left slot="activator")
                  v-btn(color="primary" flat icon large slot="activator")
                    v-icon mdi-import
                  import-xlsx(
                    :download-link="importTemplateLink"
                    :headers="importHeaders"
                    :import-text="importText"
                    :utils="xlsxUtils"
                    @result="$emit('import', $event)"
                  )
                | {{importLabel}}
          template(v-if="exportable")
            v-tooltip(bottom v-show="!hideExport")
              v-menu(slot="activator")
                v-btn(slot="activator" color="primary" flat icon large)
                  v-icon mdi-download
                v-list
                  v-list-tile(@click="exportFile('csv')")
                    | Export CSV
                  v-list-tile(@click="exportFile('xlsx')")
                    | Export XLSX
              | {{exportLabel}}
          slot(name="right-action")
      v-divider(light)
      v-card-text.pa-0
        template(v-if="slottedHeader")
          v-data-table(
            v-model="guardedSelectedItemsModel"
            :headers="headers"
            :items="items"
            :item-key="itemKey"
            :select-all="selectAll"
            :total-items="totalItems"
            :hide-actions="hideActions"
            :pagination.sync="paginationModel"
            :loading="loading"
            :rows-per-page-items="rowsPerPageItems"
            :search="internalSearchModelEnabled ? internalSearchModel : guardedInternalSearchText"
            :custom-filter="guardedInternalFilter"
          )
            template(slot="headers" slot-scope="props")
              slot(
                name="headers"
                v-bind="props"
              )
            template(slot="items" slot-scope="props")
              slot(
                name="items"
                v-bind="props"
              )
            template(v-if="slottedFooter")
              template(slot="footer")
                slot(name="footer")
        template(v-else)
          v-data-table(
            v-model="guardedSelectedItemsModel"
            :headers="headers"
            :items="items"
            :item-key="itemKey"
            :select-all="selectAll"
            :total-items="totalItems"
            :hide-actions="hideActions"
            :pagination.sync="paginationModel"
            :loading="loading"
            :rows-per-page-items="rowsPerPageItems"
            :search="internalSearchModelEnabled ? internalSearchModel : guardedInternalSearchText"
            :custom-filter="guardedInternalFilter"
          )
            template(slot="items" slot-scope="props")
              slot(
                name="items"
                v-bind="props"
              )
            template(v-if="slottedFooter")
              template(slot="footer")
                slot(name="footer")
</template>

<script>
import _ from 'lodash';
import DateFilter from './date-filter';
import ImportXlsx from './import-xlsx';
import { initLogger } from '../../utils/logger';

const log = initLogger('GenericTable');

/**
 * @typedef {Object} XlsxUtils
 * @desc Injected xlsx utils dependency, to avoid importing for every consumer
 * @property {function} convertXlsxToJson
 * @property {function} convertJsonToXlsx
 */

export default {
  name: 'GenericTable',
  components: {
    DateFilter,
    ImportXlsx,
  },
  props: {
    items: {
      type: Array,
      default: undefined,
    },
    itemKey: {
      type: String,
      default: undefined,
    },
    selectAll: Boolean,
    selectedItems: {
      type: Array,
      default: undefined,
    },
    headers: {
      type: Array,
      default: undefined,
    },
    loading: Boolean,
    hideActions: Boolean,
    hideToolbar: {
      type: Boolean,
      default: false,
    },
    flat: Boolean,
    slottedHeader: Boolean,
    slottedFooter: Boolean,
    // toolbar title props
    toolbarTitle: {
      type: String,
      default: undefined,
    },
    hideToolbarTitle: Boolean,
    toolbarOptions: {
      type: Object,
      default: () => ({}),
    },
    // pagination props
    pagination: {
      type: Object,
      default: undefined,
    },
    totalItems: {
      type: Number,
      default: undefined,
    },
    rowsPerPageItems: {
      type: Array,
      default: () => [20, 50, 100],
    },
    // filter props
    filterable: Boolean,
    hideFilter: Boolean,
    // FIXME: assign proper type
    filter: null, // eslint-disable-line
    filterItems: {
      type: Array,
      default: undefined,
    },
    filterLabel: {
      type: String,
      default: 'Filter',
    },
    filterOptions: {
      type: Object,
      default: () => ({}),
    },
    // date filter props
    dateFilterable: Boolean,
    hideDateFilter: Boolean,
    dateFilter: {
      type: Object,
      default: undefined,
    },
    dateFilterOptions: {
      type: Object,
      default: () => ({}),
    },
    // search props
    internalSearchable: Boolean,
    internalSearchModelEnabled: Boolean,
    hideInternalSearch: Boolean,
    internalSearch: {
      type: String,
      default: undefined,
    },
    internalFilter: {
      type: Function,
      default: undefined,
    },
    searchable: Boolean,
    hideSearch: Boolean,
    searchText: {
      type: String,
      default: undefined,
    },
    searchLabel: {
      type: String,
      default: 'Search',
    },
    searchOptions: {
      type: Object,
      default: () => ({}),
    },
    // refresh props
    refreshable: Boolean,
    refreshLabel: {
      type: String,
      default: 'Refresh',
    },
    // add props
    addable: Boolean,
    hideAdd: Boolean,
    addLabel: {
      type: String,
      default: 'Add',
    },
    // import props
    importable: Boolean,
    hideImport: Boolean,
    importTemplateLink: {
      type: String,
      default: undefined,
    },
    importHeaders: {
      type: Array,
      default: undefined,
    },
    importLabel: {
      type: String,
      default: 'Import',
    },
    importText: {
      type: String,
      default: undefined,
    },
    /** @type {XlsxUtils} */
    xlsxUtils: {
      type: Object,
      default: undefined,
    },
    // export props
    exportable: Boolean,
    hideExport: Boolean,
    exportFilename: {
      type: String,
      default: 'data',
    },
    exportFormat: {
      type: Function,
      default: () => {},
    },
    exportHeaders: {
      type: Array,
      default: undefined,
    },
    exportLabel: {
      type: String,
      default: 'Export',
    },
    searchBindOptions: {
      type: Object,
      default: () => ({
        xs3: true,
      }),
    },
    filterBindOptions: {
      type: Object,
      default: () => ({
        xs3: true,
      }),
    },
  },
  data () {
    return {
      internalSearchText: '',
    };
  },
  computed: {
    paginationModel: {
      get () {
        return this.pagination;
      },
      set (val) {
        this.$emit('update:pagination', val);
      },
    },
    filterModel: {
      get () {
        return this.filter;
      },
      set (val) {
        this.$emit('update:filter', val);
      },
    },
    dateFilterModel: {
      get () {
        return this.dateFilter;
      },
      set (val) {
        this.$emit('update:dateFilter', val);
      },
    },
    searchTextModel: {
      get () {
        return this.searchText;
      },
      set (val) {
        this.$emit('update:searchText', val);
      },
    },
    searchIcon () {
      return _.isEmpty(this.searchTextModel) ? 'mdi-magnify' : null;
    },
    guardedInternalSearchText () {
      if (!this.internalSearchable) return;

      return this.internalSearchText;
    },
    guardedSelectedItemsModel: {
      get () {
        if (!this.selectAll) return;

        return this.selectedItems;
      },
      set (val) {
        this.$emit('update:selectedItems', val);
      },
    },
    internalSearchModel: {
      get () {
        if (!this.internalSearchable) return;

        return this.internalSearch;
      },
      set (val) {
        this.$emit('update:internalSearch', val);
      },
    },
    guardedInternalFilter () {
      if (!this.internalSearchable) return;

      return this.internalFilter;
    },
  },
  methods: {
    exportFile (bookType) {
      if (!this.xlsxUtils || !this.xlsxUtils.convertXlsxToJson) {
        log('exportFile: no xlsxUtils passed!');
        throw new Error('XLSX utils dependency must be injected');
      }

      const exportData = _.map(this.items, this.exportFormat);
      this.xlsxUtils.convertJsonToXlsx(exportData, this.exportHeaders, {
        filename: `${this.exportFilename}.${bookType}`,
        bookType,
      });
    },
    onInternalSearchTextChange (val) {
      if (this.internalSearchModelEnabled) this.internalSearchModel = val;
      else this.internalSearchText = val;
    },
  },
};
</script>

<style scoped>
  tr {
    cursor: pointer !important;
  }
  td {
    white-space: pre-wrap !important;
  }
</style>
