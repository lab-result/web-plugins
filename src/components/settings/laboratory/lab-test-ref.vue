<template lang="pug">
  v-dialog(
    v-model="dialogModel"
    persistent
    width="900"
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
          h4 {{ !isEditingRef ? 'Add Ref Value' : 'Edit Ref Value' }}
      v-card-text
        v-form(ref="formRef" v-model="validRef" lazy-validation)
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-select(
                v-model="refModel.sex"
                :items="refSex"
                item-text="name"
                item-value="value"
                outline
                label="* Reference Value Type"
                placeholder="e.g. RBC"
                required
                :rules="genericFieldRules"
              )
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.min"
                flat
                outline
                label="* Minimum Value"
                type="number"
                :rules="numberRules"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.max"
                flat
                outline
                label="* Maximum Value"
                type="number"
                :rules="numberRules"
              )
          v-layout(row wrap v-if="isSiRequired")
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.simin"
                flat
                outline
                label="SI Minimum Value"
                type="number"
                :rules="numberRules"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.simax"
                flat
                outline
                label="SI Maximum Value"
                type="number"
                :rules="numberRules"
              )
          v-layout(row wrap)
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.ageMin"
                flat
                outline
                label="Minimum Age"
                type="number"
                :rules="refModel.ageMin ? numberRules : noRules"
              )
            v-flex(xs6).py-1.px-3
              v-text-field(
                v-model.number="refModel.ageMax"
                flat
                outline
                label="Maximum Age"
                type="number"
                :rules="refModel.ageMax ? numberRules : noRules"
              )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          color="primary"
          :loading="loading"
          @click.stop="saveItemRef"
        ) {{ isEditingRef ? 'Update' : 'Save' }}
</template>

<script>
import { initLogger } from '../../../utils/logger';

export const COMPONENT_NAME = 'LabTestRef';
const log = initLogger(COMPONENT_NAME);

export default {
  props: {
    newRef: {
      type: Object,
      default: undefined,
    },
    dialog: Boolean,
    loading: Boolean,
    isEditingRef: {
      type: Boolean,
      default: false,
    },
    measureId: {
      type: String,
      default: undefined,
    },
    isSiRequired: Boolean,
  },
  data () {
    return {
      validRef: false,
      refSex: [
        { name: 'All', value: 'all' },
        { name: 'Gender (MALE)', value: 'male' },
        { name: 'Gender (FEMALE)', value: 'female' },
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
    refModel: {
      set (val) {
        this.$emit('update:newRef', val);
      },
      get () {
        return this.newRef;
      },
    },
  },
  watch: {
    dialogModel (val) {
      if (val) {
        this.$refs.formRef.resetValidation();
      }
    },
  },
  methods: {
    async saveItemRef () {
      this.validRef = this.$refs.formRef.validate() && this.validateNumbers();
      if (this.validRef) {
        const data = {
          id: this.measureId,
          data: this.refModel,
          isEditingRef: this.isEditingRef,
        };
        log('saveItemRef#data: %O', data);
        this.$emit('saveItemRef', data);
        this.$emit('update:dialog', false);
      }
    },
    validateNumbers () {
      if (+this.refModel.min > +this.refModel.max) {
        this.$enqueueSnack({
          color: 'warning',
          message: 'Minimum value should be less than maximum',
        });
        return false;
      } else if (this.refModel.ageMin || this.refModel.ageMax) {
        if (this.refModel.ageMin && !this.refModel.ageMax) {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Please provide a maximum age',
          });
          return false;
        } else if (!this.refModel.ageMin && this.refModel.ageMax) {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Please provide a minimum age',
          });
          return false;
        } else if (+this.refModel.ageMin > +this.refModel.ageMax) {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Minimum value should be less than maximum',
          });
          return false;
        }
      }
      if (this.isSiRequired) {
        if (+this.refModel.simin > +this.refModel.simax) {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Minimum value should be less than maximum',
          });
          return false;
        }
      }
      return true;
    },
  },
};
</script>
