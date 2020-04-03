<template lang="pug">
  v-dialog(
    v-model="dialogModel"
    scrollable
    persistent
    width="1000"
  )
    v-card
      v-toolbar(flat)
        v-toolbar-title
          h4(v-if="!isEditingTest") Add New Lab Test
          h4(v-else) Edit Lab Test
        v-spacer
        v-btn(
          icon
          :disabled="loading || loadingMeasures"
          @click.stop="dialogModel = false"
        )
          v-icon mdi-close
      v-card-text
        v-form(ref="formTest" v-model="validTest" lazy-validation)
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="testModel.name"
                flat
                outline
                label="* Lab Test Name"
                placeholder="e.g. CBC with Platelet Count"
                :rules="genericFieldRules"
                :disabled="loading"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="testModel.section"
                flat
                outline
                label="* Lab Test Section"
                placeholder="e.g. Hematology"
                :rules="genericFieldRules"
                :disabled="loading"
              )
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="testModel.hl7IdentifierCod"
                flat
                outline
                label="HL7 Identifier Code"
                :disabled="loading"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="testModel.hl7IdentifierSys"
                flat
                outline
                label="HL7 Identifier System"
                :disabled="loading"
              )
          v-layout(row wrap)
            v-flex(xs12).py-1.px-3
              v-textarea(
                v-model="testModel.description"
                outline
                label="Lab Test Description"
                :disabled="loading"
              )
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-checkbox(
                v-model="testModel.isConfidential"
                color="primary"
                label="Confidential"
                :disabled="loading"
              )
              span
                | Confidential lab tests will not send results
                | to requesting physicians automatically.
            v-flex(xs6).py-1.px-3
              v-checkbox(
                v-model="testModel.isWhitelisted"
                color="primary"
                label="Whitelisted"
                :disabled="loading"
              )
              span
                | Whitelisted lab tests are tests whose results can only be
                | viewed by the original creator of the results, as well as
                | an optional whitelist of members.
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              //- pre {{ whitelistedMembersUid(testModel.whitelist) }}
            v-flex(xs6).py-1.px-3
              org-members-search(
                v-if="testModel.isWhitelisted"
                v-model="testModel.whitelist"
                label="Select Whitelisted Members"
                :filter-roles="ROLES"
                :disabled="loading"
                outline
                multiple
              )
        v-card(v-if="isEditingTest")
          v-toolbar(flat)
            v-toolbar-title
              h5 Lab Test Measures
          generic-table(
            :headers="headersMeasure"
            :items="labTestMeasures"
            :total-items="labTestMeasuresTotal"
            :loading="loadingMeasures"
            :pagination.sync="pagination"
            searchable
            :search-text.sync="searchText"
            search-label="Search by Name"
            :search-bind-options="{ xs4: true }"
            addable
            flat
            addLabel="Add New Measure"
            @add="() => openDialogMeasure(false)"
          )
            tr(slot="items" slot-scope="props")
              td {{ props.item.name }}
              td {{ props.item.unit }}
              td {{ props.item.siunit }}
              td {{ measureTypeText(props.item.type) }}
              td.justify-end.layout.px-0
                v-btn(icon @click.stop="editItemMeasure(props.item)")
                  v-icon(small).primary--text mdi-pencil
                v-btn(icon @click.stop="deleteDialogMeasure = true; deleteMeasureId = props.item.id")
                  v-icon(small).error--text mdi-trash-can-outline
          confirm-dialog(
            :dialog.sync="deleteDialogMeasure"
            title="Delete Test Measure"
            message="Are you sure you want to delete this item?"
            primary-action="Yes"
            secondary-action="No"
            primary-color="error"
            @yes="deleteItemMeasure(deleteMeasureId)"
          )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          color="primary"
          depressed
          :loading="loading || loadingMeasures"
          @click.stop="saveItemTest"
        ) {{ isEditingTest ? 'Update' : 'Save' }}
        v-btn(
          color="error"
          flat
          :disabled="loading || loadingMeasures"
          @click.stop="dialogModel = false;"
        ) Close
    lab-test-measure(
      :lab-test-ref-values="labTestRefValues"
      :new-measure.sync="newMeasure"
      :dialog.sync="templateDialogMeasure"
      :loading="loading"
      :is-editing-measure="isEditingMeasure"
      :test-id.sync="testId"
      :measure-id="measureId"
      @saveItemMeasure="saveItemMeasure"
      @saveItemRef="v => $emit('saveItemRef', v)"
      @deleteItemRef="v => $emit('deleteItemRef', v)"
      @addChoice="v => newMeasure.choices.push(v)"
      @deleteChoice="v => newMeasure.choices.splice(v,1)"
    )
</template>

<script>
// components
import LabTestMeasure from './lab-test-measure';
import GenericTable from '../../commons/generic-table';
import GenericSearch from '../../commons/generic-search';
import ConfirmDialog from '../../commons/confirm-dialog';
import OrgMembersSearch from '../../org/org-members-search';
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';
import { checkRoles } from '../../../utils/permissions';

const log = initLogger('LabTestDialog');

export default {
  components: {
    LabTestMeasure,
    GenericTable,
    GenericSearch,
    ConfirmDialog,
    OrgMembersSearch,
  },
  props: {
    newTest: {
      type: Object,
      default: undefined,
    },
    dialog: Boolean,
    loading: Boolean,
    isEditingTest: {
      type: Boolean,
      default: false,
    },
    labTestRefValues: {
      type: Array,
      default: undefined,
    },
    testId: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      templateDialogMeasure: false,
      deleteDialogMeasure: false,
      validTest: false,
      measureId: null,
      newMeasure: {},
      isEditingMeasure: false,
      deleteMeasureId: {},
      headersMeasure: [
        { text: 'Name', value: 'name', sortable: false },
        { text: 'Unit', value: 'unit', sortable: false },
        { text: 'SI Unit', value: 'siunit', sortable: false },
        { text: 'Type', value: 'type', sortable: false },
        { text: '', value: 'action', sortable: false },
      ],
      pagination: {},
      searchText: '',
      debouncedInit: _.debounce(this.init, 250),
      loadingMeasures: false,
      // NOTE: moved from settings store
      labTestMeasures: [],
      labTestMeasuresTotal: 0,
    };
  },
  computed: {
    dialogModel: {
      set (val) {
        this.$emit('update:dialog', val);
      },
      get () {
        return this.dialog;
      },
    },
    testModel: {
      set (val) {
        this.$emit('update:newTest', val);
      },
      get () {
        return this.newTest;
      },
    },
    whitelistSelection () {
      return this.members.filter(m => checkRoles(m,
        ['lab_tech', 'lab_qc', 'lab_head', 'doctor_pathologist']));
    },
  },
  watch: {
    dialogModel (val) {
      if (val) {
        if (this.$refs.formTest) this.$refs.formTest.resetValidation();
      }
    },
    searchText () {
      this.pagination.page = 1;
      this.debouncedInit();
    },
    pagination: {
      handler () {
        this.init();
      },
      deep: true,
    },
  },
  created () {
    this.ROLES = ['lab_tech', 'lab_qc', 'lab_head', 'doctor_pathologist'];
  },
  methods: {
    async init () {
      try {
        this.loadingMeasures = true;
        const { rowsPerPage, page } = this.pagination;
        const query = {
          test: this.testId,
        };

        // build search
        if (typeof this.searchText === 'string' && this.searchText) {
          query.name = {
            $regex: `^${this.searchText}`,
            $options: 'i',
          };
        }

        // build pagination
        query.$limit = rowsPerPage || 20;
        query.$skip = query.$limit * ((page || 1) - 1);

        // execute ops
        const result = await this.$sdk.service('diagnostic-measures').find(query);
        this.labTestMeasures = result.items;
        this.labTestMeasuresTotal = result.total;
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'Something went wrong! Please try again.',
        });
      } finally {
        this.loadingMeasures = false;
      }
    },
    // FIXME: when editing an existing labtest, editing whitelisted members generates error
    whitelistedMembersUid (item) {
      return _.flatten(_.map(item, m => m.uid));
    },
    measureTypeText (value) {
      if (value === 'posneg') return 'Positive/Negative';
      if (value === 'text') return 'Text';
      if (value === 'numeric') return 'Numeric';
      if (value === 'html') return 'Rich Text (HTML)';
      if (value === 'multiplechoice') return 'Multiple Choice';
      return 'NA';
    },
    saveItemTest () {
      const whitelistedMembers = _.flatten(_.map(this.testModel.whitelist, m => m.uid));
      this.testModel.whitelist = whitelistedMembers;
      this.validTest = this.$refs.formTest.validate();
      if (this.validTest) {
        if (!this.isEditingTest) {
          this.$emit('add', this.testModel);
        } else {
          const testToEdit = _.pick(this.testModel, ['name', 'section', 'description',
            'hl7code', 'hl7system', 'isConfidential', 'isWhitelisted', 'whitelist']);
          this.$emit('add', testToEdit);
        }
      }
    },
    openDialogMeasure (isEditing) {
      this.isEditingMeasure = isEditing;
      if (!isEditing) { this.newMeasure = _.mapValues(this.newMeasure, () => ''); }
      if (this.measureId) { this.newMeasure.test = this.measureId; }
      this.templateDialogMeasure = true;
    },
    async editItemMeasure (item) {
      this.newMeasure = _.clone(item);
      await this.$emit('loadLabRef', item.id);
      this.measureId = item.id;
      this.openDialogMeasure(true);
    },
    prettifyRoles (roles) {
      return _.map(roles, _.startCase)
        .join(', ');
    },
    async saveItemMeasure (data) {
      try {
        this.loadingMeasures = true;
        const { isEditingMeasure } = data;
        const { values } = data;
        if (!isEditingMeasure) {
          await this.$sdk.service('diagnostic-measures').create(values);
        } else {
          const { id } = data;
          await this.$sdk.service('diagnostic-measures').update(id, values);
        }
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: `Measure successfully ${isEditingMeasure ? 'updated' : 'added'}!`,
        });
      } catch (error) {
        console.error(error);
        log(`saveItemMeasure#${data.isEditingMeasure ? 'edit' : 'create'}`);
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error. Please try again.',
        });
      } finally {
        this.loadingMeasures = false;
      }
    },
    async deleteItemMeasure (item) {
      try {
        this.loadingMeasures = true;
        await this.$sdk.service('diagnostic-measures').remove(item);
        await this.init();
        this.$enqueueSnack({
          color: 'success',
          message: 'Measure successfully deleted!',
        });
      } catch (error) {
        console.error(error);
        log('deleteItemMeasure#error');
        this.$enqueueSnack({
          color: 'error',
          message: error.message || 'There was an error in deleting. Please try again later.',
        });
      } finally {
        this.loadingMeasures = false;
      }
    },
  },
};
</script>
