<template lang="pug">
  v-dialog(
    v-model="dialogModel"
    scrollable
    persistent
    width="1000"
  )
    v-card
      v-toolbar(flat)
        v-btn(
          icon
          :disabled="loading"
          @click.stop="dialogModel = false"
        )
          v-icon mdi-arrow-left
        v-toolbar-title
          h4(v-if="!isEditingMeasure") Test Measure Details
          h4(v-else) Update Measure
      v-card-text
        v-form(ref="formMeasure" v-model="validMeasure" lazy-validation)
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="newMeasure.name"
                flat
                outline
                label="* Measure Name"
                placeholder="e.g. RBC"
                :rules="genericFieldRules"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="newMeasure.set"
                flat
                outline
                label="* Measure Set"
              )
          v-layout(row wrap)
            v-flex(xs3).py-1.px-3
              v-text-field(
                v-model="newMeasure.unit"
                flat
                outline
                label="Measure Conventional Unit"
                placeholder="e.g. %"
              )
            v-flex(xs3).py-1.px-3
              v-text-field(
                v-model="newMeasure.siunit"
                flat
                outline
                label="Measure SI Unit"
                placeholder="e.g. %"
              )
            v-flex(xs6).py-1.px-3
              v-select(
                v-model="newMeasure.type"
                :items="measureType"
                item-text="name"
                item-value="value"
                flat
                outline
                label="Measure Type"
                @change="checkIfMultiple"
              )
          template(v-if="newMeasure.type === 'multiplechoice'")
            v-layout(row wrap v-for="(choice, key) in newMeasure.choices" :key="key")
              v-flex(xs1).pl-4.pt-3
                v-icon(small) mdi-radiobox-blank
              v-flex(xs5).pt-3
                h3 {{ choice }}
              v-flex(xs1)
                v-btn(icon @click.stop="deleteChoice(choice)")
                  v-icon(small).error--text mdi-close
            v-layout(row)
              v-flex(xs1).pl-4.pt-3
                v-icon(small) mdi-radiobox-blank
              v-flex(xs5)
                v-text-field(
                  v-model="newChoice"
                  outline
                  label="Add Choice"
                )
              v-flex(xs1)
                v-btn(icon :disabled="!newChoice" @click.stop="addNewChoice(newChoice)")
                  v-icon.success--text mdi-check
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="newMeasure.hl7IdentifierCod"
                flat
                outline
                label="HL7 Identifier Code"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model="newMeasure.hl7IdentifierSys"
                flat
                outline
                label="HL7 Identifier System"
              )
          v-layout(row wrap)
            v-flex(xs12).py-1.px-3
              v-textarea(
                v-model="newMeasure.description"
                flat
                outline
                label="Measure Description"
              )
        v-card(v-if="isEditingMeasure")
          v-toolbar(flat)
            v-toolbar-title
              h5 Lab Test Reference Values
          generic-table(
            :headers="headersRef"
            :items="labTestRefValues"
            :loading="loading"
            internal-searchable
            addable
            flat
            add-label="Add New Ref Value"
            @add="openDialogRef(false)"
          )
            tr(slot="items" slot-scope="props")
              td.text-uppercase {{ props.item.sex }}
              td {{ props.item.min }} - {{ props.item.max }}
              td {{ props.item.simin }} - {{ props.item.simax }}
              td {{ props.item.ageMin }} - {{ props.item.ageMax }}
              td.justify-end.layout.px-0
                v-btn(icon @click.stop="editItemRef(props.item)")
                  v-icon(small).primary--text mdi-pencil
                v-btn(icon @click.stop="deleteDialogRef = true; deleteRefId = props.item")
                  v-icon(small).error--text mdi-trash-can-outline
          confirm-dialog(
            :dialog.sync="deleteDialogRef"
            title="Delete Test Reference Level"
            message="Are you sure you want to delete this item?"
            primary-action="Yes"
            secondary-action="No"
            primary-color="error"
            @yes="deleteItemRef(deleteRefId)"
          )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          :loading="loading"
          color="primary"
          @click.stop="saveItemMeasure"
        ) {{ isEditingMeasure ? 'Update' : 'Save' }}
    lab-test-ref(
      :new-ref.sync="newRef"
      :dialog.sync="templateDialogRef"
      :loading="loading"
      :is-si-required="isSiRequired"
      :is-editing-ref="isEditingRef"
      :measure-id="measureId"
      @saveItemRef="v => $emit('saveItemRef', v)"
    )
</template>

<script>
import _ from 'lodash';
import labTestRef from './lab-test-ref';
import GenericTable from '../../commons/generic-table';
import ConfirmDialog from '../../commons/confirm-dialog';

export const COMPONENT_NAME = 'LabTestMeasure';

export default {
  components: {
    labTestRef,
    GenericTable,
    ConfirmDialog,
  },
  props: {
    labTestRefValues: {
      type: Array,
      default: undefined,
    },
    newMeasure: {
      type: Object,
      default: undefined,
    },
    dialog: Boolean,
    loading: Boolean,
    isEditingMeasure: {
      type: Boolean,
      default: false,
    },
    testId: {
      type: String,
      default: undefined,
    },
    measureId: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      templateDialogRef: false,
      deleteDialogRef: false,
      newRef: {},
      newChoice: '',
      isEditingRef: false,
      validMeasure: false,
      headersRef: [
        { text: 'Type', value: 'sex' },
        { text: 'Min-Max (Value)', value: 'minMaxVal' },
        { text: 'SI Min-Max (Value)', value: 'siMinMaxVal' },
        { text: 'Min-Max (Age)', value: 'minMaxAge' },
        { text: '', value: 'action', sortable: false },
      ],
      measureType: [
        { name: 'Numeric (number)', value: 'numeric' },
        { name: 'Positive/Negative (±)', value: 'posneg' },
        { name: 'Text', value: 'text' },
        { name: 'Rich Text (HTML)', value: 'html' },
        { name: 'Multiple Choice', value: 'multiplechoice' },
      ],
      noRules: [],
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
    measureModel: {
      set (val) {
        this.$emit('update:newMeasure', val);
      },
      get () {
        return this.newMeasure;
      },
    },
    isSiRequired () {
      return !_.isNil(this.newMeasure.siunit);
    },
  },
  watch: {
    dialogModel (val) {
      if (val) {
        this.$refs.formMeasure.resetValidation();
      }
    },
  },
  methods: {
    saveItemMeasure () {
      this.validMeasure = this.$refs.formMeasure.validate() &&
        this.multipleChoiceValidate();
      if (this.validMeasure) {
        let data = {};
        if (!this.isEditingMeasure) {
          this.newMeasure.test = this.testId;
          const values = _.pickBy(_.pick(this.newMeasure, ['name', 'set', 'type',
            'description', 'choices', 'unit', 'test', 'siunit', 'hl7IdentifierCod',
            'hl7IdentifierSys']), Boolean);
          data = {
            isEditingMeasure: this.isEditingMeasure,
            values: values,
          };
        } else {
          const values = _.pickBy(_.pick(this.newMeasure, ['name', 'set', 'type',
            'description', 'choices', 'unit', 'siunit', 'hl7IdentifierCod',
            'hl7IdentifierSys']), Boolean);
          data = {
            isEditingMeasure: this.isEditingMeasure,
            id: this.measureId,
            values: values,
          };
        }
        this.$emit('saveItemMeasure', data);
        this.$emit('update:dialog', false);
      } else {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Please fill out all required fields',
        });
      }
    },
    openDialogRef (isEditing) {
      this.templateDialogRef = true;
      this.isEditingRef = isEditing;
      if (!isEditing) {
        this.newRef = _.mapValues(this.newRef, () => '');
      }
    },
    editItemRef (item) {
      this.newRef = _.clone(item);
      this.openDialogRef(true);
    },
    deleteItemRef (item) {
      const data = {
        id: this.measureId,
        refValue: item,
      };
      this.$emit('deleteItemRef', data);
    },
    checkIfMultiple () {
      if (this.newMeasure.type === 'multiplechoice') this.newMeasure.choices = [];
    },
    multipleChoiceValidate () {
      if (this.newMeasure.type === 'multiplechoice' &&
        this.newMeasure.choices.length < 2) {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Please include at least 2 choices!',
        });
        return false;
      }
      return true;
    },
    addNewChoice (newChoice) {
      this.$emit('addChoice', newChoice);
      this.newChoice = '';
    },
    deleteChoice (choice) {
      const index = this.newMeasure.choices.indexOf(choice);
      this.$emit('deleteChoice', index);
    },
  },
};
</script>
