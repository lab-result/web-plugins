<template lang="pug">
  div
    h1 Specimen ID Customization
    p Configure your clinic's Specimen ID format
    v-card
      v-progress-linear(v-if="loading" indeterminate)
      v-card-text
        v-layout(row)
          v-flex(xs3 align-self-center)
            v-switch(
              v-model="configLIS.customControlIdEnabled"
              label="Use custom Specimen ID"
              hide-details
              color="primary"
            ).pa-0.ma-0
          v-flex(xs4)
            span Default sample:
              v-chip(small disabled).primary.white--text {{ generateSpecimenId }}
      v-divider(v-if="configLIS.customControlIdEnabled")
      v-card-text(v-if="configLIS.customControlIdEnabled")
        div.mb-3
          span Currently active format:
            v-chip(
              small
              disabled
            ).primary.white--text {{ getTokenLabels(configLIS.customControlIdFormat) || 'none' }}
          br(v-show="idFormat.length !== 0")
          span(v-show="idFormat.length !== 0") New format:
            v-chip(
              small
              label
              v-for="(token, key) in idFormat"
              :key="key"
              close
              @input="removeItem(key, token)"
            ).warning.white--text.mr-1 {{ getTokenLabels(token) }}
          br
          span Counter's current value:
            v-chip(
              small
              disabled
            ).primary.white--text {{ counter.value >= 0 ? counter.value : 'none' }}
        v-layout(row).mb-3
          v-flex(xs4).mx-2
            v-select(
              v-model="selectedField"
              :items="fields"
              label="Select a field to include"
              hide-details
              outline
              clearable
              @change="resetForms()"
            )
        v-layout(v-if="!!selectedField" row).mb-3
          v-flex(xs12)
            span Customize {{ selectedField }} format:
              v-chip(
                v-if="selectedField === 'Specimen Counter'"
                outline
                label
                color="primary"
                small
              ) {{ generateCustomId() }}
        v-form(ref="customTextForm" v-model="validForm").mb-3
          v-layout(v-if="selectedField === 'Custom Text'" row)
            v-flex(xs2).mx-2
              v-text-field(
                outline
                hide-details
                label="Value"
                v-model="customInput"
                :rules="[v => !!v || 'Please enter a value']"
              )
            v-flex(shrink justify-center align-self-center)
              v-btn(
                color="success"
                depressed
                :ripple="false"
                @click.stop="pushText(customInput)"
                :disabled="!validForm"
              ) Add
            v-flex(shrink justify-center align-self-center)
              v-btn(
                color="error"
                outline
                depressed
                :ripple="false"
                @click.stop="resetSelected()"
              ) Cancel
        v-form(ref="dateForm").mb-3
          v-layout(v-if="selectedField === 'Date Time'" row).mb-2
            v-flex(xs3).mx-2
              v-select(
                outline
                hide-details
                :items="dateSamples"
                v-model="dateSelections[0]"
                clearable
              )
            v-flex(xs3).mx-2
              v-select(
                outline
                hide-details
                :items="dateSamples"
                v-model="dateSelections[1]"
                clearable
              )
            v-flex(xs3).mx-2
              v-select(
                outline
                hide-details
                :items="dateSamples"
                v-model="dateSelections[2]"
                clearable
              )
            v-flex(shrink justify-center align-self-centerr)
              v-btn(
                color="success"
                depressed
                :ripple="false"
                @click.stop="pushText(`###${difference()}###`)"
                :disabled="!difference()"
              ) Add
            v-flex(shrink justify-center align-self-centerr)
              v-btn(
                color="error"
                outline
                depressed
                :ripple="false"
                @click.stop="resetSelected()"
              ) Cancel
        v-layout(v-if="selectedField === 'Specimen Counter'" row)
          v-flex(xs12).mx-2.mb-2
            v-checkbox(
              v-model="showCounterAdditionalFields"
              label="Use additional counter settings"
              color="primary"
              hide-details
            ).mt-0
        v-form(ref="controlCounterForm" v-model="validForm").mb-3
          v-layout(v-if="selectedField === 'Specimen Counter'" row)
            v-flex(xs2 v-if="showCounterAdditionalFields").mx-2
              v-text-field(
                outline
                hide-details
                label="Specimen ID Length (min: 4)"
                v-model.number="length"
                type="number"
                min="4"
                :rules="[v => v > 3 || 'Value must be greater than 4']"
              )
            v-flex(xs2 v-if="showCounterAdditionalFields").mx-2
              v-text-field(
                outline
                hide-details
                label="Padding Character"
                placeholder="e.g. 0"
                v-model="characters"
                :rules="[v => v.length === 1 || 'Must be one character only']"
              )
            v-flex(xs2 v-if="showCounterAdditionalFields").mx-2
              v-select(
                outline
                hide-details
                label="Padding Position"
                :items="positions"
                v-model="position"
                :rules="[v => !!v || 'Selection is needed']"
              )
            v-flex(shrink justify-center align-self-center)
              v-btn(
                color="success"
                depressed
                :ripple="false"
                @click.stop="pushText('###specimen_counter###')"
                :disabled="!validForm"
              ) Add
            v-flex(shrink justify-center align-self-center)
              v-btn(
                color="error"
                outline
                depressed
                :ripple="false"
                @click.stop="resetSelected()"
              ) Cancel
        v-form(ref="mainForm" v-model="mainFormValid")
          v-layout(row).mb-3
            v-flex(xs3).mx-2
              v-select(
                v-model="counter.resetInterval"
                :items="resetIntervals"
                label="Reset Interval"
                hide-details
                outline
                clearable
              )
            v-flex(xs2).mx-2
              v-text-field(
                v-model.number="counter.valueStart"
                label="Start Value*"
                hide-details
                outline
                min="0"
                type="number"
                :rules="[v => v >= 0 || 'Start value must not be less than 0']"
              )
            v-flex(xs2).mx-2
              v-text-field(
                v-model.number="counter.valueStep"
                label="Increment Value*"
                hide-details
                outline
                min="1"
                type="number"
                :rules="[v => v > 0 || 'Increment value must be atleast 1']"
              )
      v-divider
      v-card-actions
        v-spacer
        v-btn(
          large
          color="success"
          :loading="loading"
          :disabled="loading || (configLIS.customControlIdEnabled && !mainFormValid)"
          @click.stop="clickSave"
        ).px-2 Update
    async-confirm-dialog(ref="confirmDialog")
</template>

<script>
import _ from 'lodash';
import {
  DATE_FIELD_COMPONENTS,
  TIME_FIELD_COMPONENTS,
  TOKENS_WITH_LABEL,
  DEFAULT_LAB_FIELDS,
  POSITIONS,
  RESET_INTERVALS,
} from '../imaging/constants';
import AsyncConfirmDialog from '../../commons/async-confirm-dialog';
import { generateSpecimenId, injectValues, generateCustomId } from '../../diagnostic/utils';
import { initLogger } from '../../../utils/logger';

export const COMPONENT_NAME = 'LaboratoryOrderSpecimenId';
const log = initLogger(COMPONENT_NAME);

export default {
  components: { AsyncConfirmDialog },
  data () {
    return {
      loading: false,
      configLIS: {},
      idFormat: [],
      dateFormat: '',
      length: 4,
      characters: '0',
      position: 'before',
      customControlIdLength: 1,
      customControlIdPaddingCharacter: '0',
      customControlIdPaddingPosition: 'before',
      defaultFields: DEFAULT_LAB_FIELDS,
      fields: [],
      positions: POSITIONS,
      counter: {},
      resetIntervals: RESET_INTERVALS,
      dateSamples: _.flatten([DATE_FIELD_COMPONENTS, TIME_FIELD_COMPONENTS]),
      dateSelections: ['', '', ''],
      selectedField: '',
      divider: '',
      customInput: '',
      showCounterAdditionalFields: false,
      validForm: false,
      mainFormValid: false,
    };
  },
  computed: {
    generateSpecimenId () {
      return generateSpecimenId('tests');
    },
  },
  async created () {
    await this.init();
  },
  methods: {
    async init () {
      this.loading = true;
      try {
        this.configLIS = this.$activeOrganization.configLIS || {};
        this.fields = this.defaultFields;
        log('init#configLIS: %O', this.configLIS);
        log('init#activeMembership: %O', this.$activeMembership);

        const query = {
          organization: this.$activeOrganization.id,
          type: 'lis',
          $sort: { createdAt: -1 },
        };
        const counters = await this.$sdk.service('counters').find(query).then(r => r.items);
        log('init#counters: %O', counters);
        this.counter = _.head(counters) || {};
        log('init#counter: %O', this.counter);
      } catch (error) {
        log('init#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async clickSave () {
      if (this.configLIS.customControlIdEnabled) {
        const confirm = await this.$refs.confirmDialog.open(
          'Save Custom Specimen Id',
          `Saving will reset the counter to the counter's Start Value.
          If you wish to retain the counter's current value, kindly set
          the counter's Start Value to the Counter's Current Value given.`,
          { primaryAction: 'Confirm' }
        );
        if (!confirm) return;
      }
      if (!this.validate()) return;
      try {
        this.loading = true;
        let configLIS = {
          customControlIdFormat: this.idFormat.join(''),
          customControlIdEnabled: this.configLIS.customControlIdEnabled,
          customControlIdDateFormat: !this.dateFormat ? 'd' : this.dateFormat,
          customControlIdLength: this.showCounterAdditionalFields ? this.customControlIdLength : 1,
          customControlIdPaddingCharacter: this.showCounterAdditionalFields ? this.customControlIdPaddingCharacter : '0',
          customControlIdPaddingPosition: this.showCounterAdditionalFields ? this.customControlIdPaddingPosition : 'before',
        };
        if (this.configLIS.customControlIdEnabled) {
          if (this.idFormat.length === 0) {
            configLIS = this.configLIS.customControlIdFormat ? _.pick(configLIS, 'customControlIdEnabled') : configLIS;
          }
        } else {
          configLIS = _.pick(configLIS, 'customControlIdEnabled');
        }

        const org = await this.$store.dispatch('organizations/updateOrganization', { data: { configLIS } });
        this.configLIS = org.configLIS;
        log('clickSave#configLIS: %O', this.configLIS);

        if (this.configLIS.customControlIdEnabled) {
          if (this.counter.id) {
            if (this.counter.id) {
              await this.$sdk.service('counters').remove(this.counter.id);
            }

            const data = _.pickBy({
              ..._.pick(this.counter, ['resetInterval', 'valueStart', 'valueStep']),
              type: 'lis',
              name: 'lis',
              organization: this.$activeOrganization.id,
            }, v => v != null && v !== '');
            this.counter = await this.$sdk.service('counters').create(data);

            this.$enqueueSnack({
              message: 'Custom Specimen ID successfully updated!',
              color: 'success',
            });
          } else {
            const data = _.pickBy({
              ..._.pick(this.counter, ['resetInterval', 'valueStart', 'valueStep']),
              type: 'lis',
              name: 'lis',
              organization: this.$activeOrganization.id,
            }, v => v != null && v !== '');
            this.counter = await this.$sdk.service('counters').create(data);

            this.$enqueueSnack({
              message: 'Custom Specimen ID successfully created!',
              color: 'success',
            });
          }
        } else {
          if (this.counter.id) {
            await this.$sdk.service('counters').remove(this.counter.id);
          }
          this.$enqueueSnack({
            message: 'Custom Specimen ID successfully removed!',
            color: 'success',
          });
          this.counter = {};
        }
        log('clickSave#counter: %O', this.counter);

        this.$activeOrganization.configLIS = this.configLIS;
        log('clickSave#$activeOrganization: %O', this.$activeOrganization);

        this.resetSelected();
        this.resetFormat();
        this.customControlIdLength = 1;
        this.customControlIdPaddingCharacter = '0';
        this.customControlIdPaddingPosition = 'before';
        this.showCounterAdditionalFields = false;
      } catch (error) {
        log('clickSave#error: %O', error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Try again.',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    validate () {
      if (!this.configLIS.customControlIdEnabled) return true;
      if (this.idFormat.length !== 0) {
        if (_.indexOf(this.fields, 'Specimen Counter') >= 0) {
          this.$enqueueSnack({
            message: 'Missing required field: Specimen Counter.',
            color: 'warning',
          });
          return false;
        }
      }
      if (this.idFormat.length === 0 && !this.configLIS.customControlIdFormat) {
        this.$enqueueSnack({
          message: 'Missing required field: Specimen Counter.',
          color: 'warning',
        });
        return false;
      }
      return this.$refs.mainForm.validate();
    },
    resetForms () {
      if (this.$refs.customTextForm) this.$refs.customTextForm.reset();
      if (this.$refs.dateForm) this.$refs.dateForm.reset();
      if (this.$refs.controlCounterForm) this.$refs.controlCounterForm.reset();
      this.divider = '';
      this.customInput = '';
      this.dateSelections = ['', '', ''];
    },
    resetSelected () {
      this.selectedField = '';
      this.resetForms();
    },
    pushText (text) {
      if (this.selectedField === 'Date Time') this.dateFormat = text.split('###').join('');
      this.idFormat.push(text);
      if (this.selectedField !== 'Custom Text' && !!text) this.removeField();
      if (this.selectedField === 'Specimen Counter') {
        this.customControlIdLength = this.length;
        this.customControlIdPaddingCharacter = this.characters;
        this.customControlIdPaddingPosition = this.position;
      }
      this.resetSelected();
    },
    difference () {
      return _.difference(this.dateSelections, ['']).join('');
    },
    resetFormat () {
      this.idFormat = [];
      this.fields = this.defaultFields;
    },
    getTokenLabels (text) {
      text = injectValues(text, '###specimen_counter###', _.get(TOKENS_WITH_LABEL, '###specimen_counter###'));
      text = injectValues(text, `###${this.configLIS.customControlIdDateFormat}###`, this.configLIS.customControlIdDateFormat);
      return text ? text.split('#').join('') : text;
    },
    removeField () {
      this.fields.splice(_.findIndex(this.fields, item => item === this.selectedField), 1);
    },
    removeItem (index, token) {
      this.idFormat.splice(index, 1);
      if (token === '###specimen_counter###') {
        this.fields.push('Specimen Counter');
      }
      if (token.match(/^###[DMYHms]{1,}###$/g)) {
        this.fields.push('Date Time');
      }
    },
    generateCustomId () {
      const idLength = this.showCounterAdditionalFields ? this.length : 1;
      return generateCustomId({
        paddingPosition: this.position,
        paddingLength: idLength,
        paddingCharacter: this.characters,
        counter: 1,
      });
    },
  },
};
</script>
