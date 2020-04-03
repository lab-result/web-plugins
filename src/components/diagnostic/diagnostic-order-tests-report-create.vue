<template lang="pug">
  v-card
    v-toolbar(flat)
      h2 Specimen Tracking Report
    v-card-text
      v-form(ref="form")
        //- metadata
        v-layout(row)
          v-flex(xs12 sm6).pa-1
            v-select(
              v-model="report.preparedFor"
              :items="reportTargets"
              label="Prepared for"
              outline
            )
        v-layout(row)
          v-flex(xs12 sm4).pa-1
            generic-search(
              v-model="report.preparedBy"
              :items="members"
              label="Prepared by"
              :filter="filterMember"
              item-value="uid"
              outline
              slotted
              @search="searchMember"
            )
              template(slot="selection" slot-scope="props")
                v-chip
                  v-avatar
                    img(v-if="props.item.picURL" :src="props.item.picURL")
                    img(v-else src="@/assets/images/person-placeholder.png")
                  | {{props.item.name | prettify-name-first}}
              template(slot="item" slot-scope="props")
                v-list-tile-avatar
                  img(v-if="props.item.picURL" :src="props.item.picURL")
                  img(v-else src="@/assets/images/person-placeholder.png")
                v-list-tile-content
                  v-list-tile-title {{props.item.name | prettify-name-first}}
                  v-list-tile-sub-title {{props.item.roles | prettify-roles}}
          v-flex(xs12 sm4).pa-1
            date-picker-menu(
              v-model="report.preparedAt"
              :max="maxDate"
              label="Preparation Date"
              format="MM/DD/YYYY h:mm A"
              outline
              datetime
            )
        v-layout(row)
          v-flex(xs12 sm4).pa-1
            v-text-field(
              v-model="report.pickedUpBy"
              label="Picked up by"
              outline
            )
          v-flex(xs12 sm4).pa-1
            date-picker-menu(
              v-model="report.pickedUpAt"
              label="Pick Up Date"
              format="MM/DD/YYYY h:mm A"
              outline
              datetime
            )

        v-divider

        //- order tests
        v-layout(row align-center).my-3
          h3 Order Tests
          v-chip(
            v-if="hasSelected"
            color="primary"
            dark
            @click="selectedDialog = true"
          ).ml-2 {{selectedCount}} Selected (click to view)
        v-layout(column)
          generic-table(
            :items="orderTests"
            :headers="headers"
            :loading="loading"
            :pagination.sync="paginationModel"
            :total-items="orderTestsTotal"
            date-filterable
            :date-filter.sync="dateFilterModel"
            :date-filter-options="dateFilterOptions"
            filterable
            :filter.sync="filterModel"
            :filter-items="filterItems"
            filter-label="Send Out To"
            :filter-options="filterOptions"
            flat
          )
            tr(slot="items" slot-scope="props")
              td
                v-checkbox(
                  color="primary"
                  :input-value="!!selectedMap[props.item.id]"
                  @change="onSelectionToggle(props.item, $event)"
                  hide-details
                )
              td {{props.item.createdAt | morph-date('MM/DD/YY h:mm A')}}
              td {{props.item.specimen}}
              td {{props.item.patient | extract-prop('name') | prettify-name}}
              td {{props.item.test | extract-prop('name')}}
              td {{props.item.sentOutTo | extract-prop('name')}}

        v-dialog(v-model="selectedDialog" width="750" lazy)
          v-card
            v-toolbar(flat)
              h2 Selected Order Tests
            v-card-text
              v-data-table(
                :items="selectedItems"
                :headers="selectedHeaders"
              )
                tr(slot="items" slot-scope="props")
                  td
                    v-checkbox(
                      :key="props.item.id"
                      color="primary"
                      :input-value="!!selectedMap[props.item.id]"
                      @change="onSelectionToggle(props.item, $event)"
                      hide-details
                    )
                  td {{props.item.createdAt | morph-date('MM/DD/YY h:mm A')}}
                  td {{props.item.patient | extract-prop('name') | prettify-name}}
                  td {{props.item.test | extract-prop('name')}}

        v-footer(
          app
          height="60"
          inset
        )
          v-spacer
          v-btn(
            color="primary"
            large
            @click="onSave"
          ) Save
          v-btn(
            flat
            large
            @click="onCancel"
          ) Cancel
</template>

<script>
// components
import GenericTable from '../commons/generic-table';
import GenericSearch from '../commons/generic-search';
import DatePickerMenu from '../commons/date-picker-menu';
import GenericFreeTextDialogChooser from '../commons/generic-free-text-dialog-chooser';
// constants
// utils
import _ from 'lodash';
import datefns from 'date-fns';
import { syncProp } from '../../utils/vue';
import { genericTransform } from '../../utils/obj';

/**
 * @typedef {import('@mycure/sdk').Organization} Organization
 */

/**
 * @typedef {import('@mycure/sdk').OrganizationMember} OrganizationMember
 */

/**
 * @typedef {import('@mycure/sdk').DiagnosticOrderTest} DiagnosticOrderTest
 */

/**
 * @typedef {Object} Pagination
 * @property {number} pageNo
 * @property {number} rowsPerPage
 */

/**
 * @typedef {number} Timestamp
 * @desc Unix timestamp
 *
 * @typedef {Object} DateFilter
 * @property {Timestamp} start
 * @property {Timestamp} end
 */

/**
 * @typedef {Organization} DiagnosticCenter
 * @desc Organization with type diagnostic-center
 */

/**
 * @emits update:pagination
 * @return {Pagination}
 */

/**
 * @emits update:dateFilter
 * @return {DateFilter}
 */

/**
 * @emits update:filter
 * @return {DiagnosticCenter}
 */

const MODEL_REPORT_MAPPINGS = [
  { from: 'preparedFor' },
  { from: 'preparedBy.uid', to: 'preparedBy' },
  { from: 'preparedAt' },
  { from: 'pickedUpBy' },
  { from: 'pickedUpAt' },
];

export default {
  components: {
    GenericTable,
    GenericSearch,
    DatePickerMenu,
    GenericFreeTextDialogChooser,
  },
  filters: {
    extractProp (item, prop) {
      return _.get(item, prop);
    },
    prettifyRoles (roles) {
      return _.map(roles, _.startCase).join(', ');
    },
  },
  props: {
    /** @type {OrganizationMember[]} */
    members: {
      type: Array,
      default: undefined,
    },
    /** @type {string[]} */
    reportTargets: {
      type: Array,
      default: undefined,
    },
    /** @type {DiagnosticOrderTest[]} */
    orderTests: {
      type: Array,
      default: undefined,
    },
    /**
     * Use as :pagination.sync
     * @type {Pagination}
     */
    pagination: {
      type: Object,
      default: undefined,
    },
    orderTestsTotal: {
      type: Number,
      default: undefined,
    },
    /**
     * Use as :date-filter.sync
     * @type {DateFilter}
     */
    dateFilter: {
      type: Object,
      default: undefined,
    },
    /**
     * Use as :filter.sync
     * @type {DiagnosticCenter}
     */
    filter: {
      type: Object,
      default: undefined,
    },
    /** @type {DiagnosticCenter[]} */
    filterItems: {
      type: Array,
      default: undefined,
    },
    loading: Boolean,
  },
  data () {
    return {
      report: {
        preparedFor: null,
        preparedBy: null,
        preparedAt: Date.now(),
        pickedUpBy: null,
        pickedUpAt: Date.now(),
      },
      selectedDialog: false,
      selectedMap: {},
      headers: [
        { text: '', value: '', width: 20, sortable: false },
        { text: 'Date', value: 'createdAt', sortable: false },
        { text: 'Control No', value: 'specimen', sortable: false },
        { text: 'Name', value: 'patient.name', sortable: false },
        { text: 'Test Done', value: 'test.name', sortable: false },
        { text: 'Send Out Center', value: 'sentOutTo.name', sortable: false },
      ],
      selectedHeaders: [
        { text: '', value: '', width: 20, sortable: false },
        { text: 'Date', value: 'createdAt', sortable: false },
        { text: 'Name', value: 'patient.name', sortable: false },
        { text: 'Test Done', value: 'test.name', sortable: false },
      ],
      dateFilterOptions: {
        noFuture: true,
      },
      filterOptions: {
        returnObject: true,
        itemText: 'name',
        itemValue: 'id',
      },
    };
  },
  computed: {
    paginationModel: syncProp('pagination'),
    dateFilterModel: syncProp('dateFilter'),
    filterModel: syncProp('filter'),
    maxDate () {
      return datefns.format(Date.now(), 'YYYY-MM-DD');
    },
    selectedItems () {
      const selectedItems = _.values(this.selectedMap);
      this.$log('computed#selectedItems: %O', selectedItems);
      return selectedItems;
    },
    selectedCount () {
      return _.size(this.selectedItems);
    },
    hasSelected () {
      return this.selectedCount > 0;
    },
  },
  watch: {
    filterModel () {
      this.selectedMap = {};
    },
  },
  created () {
    this.$initLogger('diagnostic-order-tests-report-create');
  },
  methods: {
    filterMember (member, searchText) {
      const regex = new RegExp(searchText, 'i');
      const firstName = _.get(member, 'name.firstName') || '';
      const lastName = _.get(member, 'name.lastName') || '';
      return regex.test(firstName) || regex.test(lastName);
    },
    onSelectionToggle (orderTest, selected) {
      this.$log('onSelectionToggle#orderTest: %O', orderTest);
      this.$log(`onSelectionToggle#selected: ${selected}`);

      if (selected) {
        this.selectedMap = {
          ...this.selectedMap,
          [orderTest.id]: orderTest,
        };
      } else {
        this.selectedMap = _.omit(this.selectedMap, orderTest.id);
      }
    },
    onSave () {
      if (_.isEmpty(this.selectedMap)) {
        return this.$enqueueSnack({
          message: 'Must include at least 1 test in the report',
          color: 'warning',
        });
      }

      const report = {
        ...genericTransform(MODEL_REPORT_MAPPINGS, this.report),
        items: _.keys(this.selectedMap),
      };
      this.$log('onSave: %O', report);
      this.$emit('save', report);
    },
    onCancel () {
      this.$log('onCancel: emitting');
      this.$emit('cancel');
    },
    searchMember (searchText) {
      this.$emit('searchMember', searchText);
    },
  },
};
</script>
