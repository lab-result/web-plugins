<template lang="pug">
  v-form(
    ref="formRef"
    lazy-validation
  )
    v-layout(row wrap).pl-2
      v-flex(xs12 md6 offset-md6).pa-1
        date-picker-menu(
          v-model="model.createdAt"
          label="Date of record"
          style="width: 100%"
          outline
        )
      v-flex(xs12).pa-1
        search-diagnostic-tests(
          v-model="tests"
          type="laboratory"
          label="Laboratory Test/s"
          multiple
          outline
          include-test-packages
          include-custom-tests
        )
    v-layout(row wrap).pl-2
      v-flex(xs12).pa-1
        search-diagnosis-code(
          v-model="selectedICD10"
          label="Search ICD10*"
          item-text="text"
          item-value="code"
          outline
          @select="icd10Selected"
          :required="requireDiagnosisCode"
          :rules="requireDiagnosisCode ? genericFieldRules : []"
        )
      v-flex(xs12).pa-1
        v-textarea(
          v-model="model.reason"
          label="Diagnosis/Reason for Test Order"
          outline
        )
</template>

<script>
// components
import DatePickerMenu from '../../commons/date-picker-menu';
import SearchDiagnosisCode from '../../common-search/search-diagnosis-code';
import SearchDiagnosticTests from '../../common-search/search-diagnostic-tests';
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../../utils/logger';

const log = initLogger('LabOrderForm');

export default {
  components: {
    DatePickerMenu,
    SearchDiagnosisCode,
    SearchDiagnosticTests,
  },
  props: {
    model: {
      type: Object,
      default: undefined,
    },
    diagnoses: {
      type: Array,
      default: undefined,
    },
    isEdit: Boolean,
    dianosticTests: {
      type: Array,
      default: undefined,
    },
  },
  data () {
    return {
      valid: false,
      loading: false,
      tests: [],
      fields: [
        'createdAt',
        'reason',
        'tests',
        'icd10',
        'diagnosisCode',
        'diagnosisText',
      ],
      loadingICD10: false,
      selectedICD10: {},
    };
  },
  computed: {
    requireDiagnosisCode () {
      return _.get(this.$activeOrganization, 'configFacility.requireDiagnosisCode');
    },
    currentDiagnoses () {
      const assessments = _.cloneDeep(this.diagnoses);
      log('computed#currentDiagnoses#assessments: %O', assessments);
      return assessments?.map(diagnosis => {
        return {
          ..._.pick(diagnosis, ['id', 'diagnosisCode', 'diagnosisText']),
          reason: diagnosis.text,
        };
      });
    },
    diagnosesFixtures () {
      return _.map(this.diagnoses, 'diagnosisFixture');
    },
    icd10Fixtures () {
      return _.union(
        [this.selectedICD10],
        this.$store.state.fixtures.icd10,
        this.diagnosesFixtures,
        'code'
      ).filter(Boolean);
    },
    laboratoryTests () {
      return this.dianosticTests || [];
    },
  },
  watch: {
    valid (val) {
      this.$emit('valid', val);
    },
    loading (val) {
      this.$emit('loading', val);
    },
    tests (val) {
      this.model.tests = this.configureTests(val);
    },
  },
  created () {
    this.init();
  },
  methods: {
    async init () {
      if (!_.isEmpty(this.model.tests)) {
        this.tests = this.model.tests;
      }

      // Create
      if (!this.isEdit && !_.isEmpty(this.currentDiagnoses)) {
        this.selectedICD10 = {
          code: this.currentDiagnoses[0].diagnosisCode,
          text: this.currentDiagnoses[0].diagnosisText,
        };
        this.model.diagnosisCode = this.currentDiagnoses[0].diagnosisCode;
        this.model.diagnosisText = this.currentDiagnoses[0].diagnosisText;
      }

      // Update
      if (this.isEdit) {
        if (_.isEmpty(this.model.diagnosisCode) || _.isEmpty(this.model.diagnosisText)) return;
        this.selectedICD10 = {
          code: this.model.diagnosisCode,
          text: this.model.diagnosisText,
        };
      }
    },
    validate () {
      if (_.isEmpty(this.tests)) {
        this.valid = false;
        return;
      }

      this.valid = this.$refs.formRef.validate();
      if (this.requireDiagnosisCode && _.isEmpty(this.selectedICD10)) this.valid = false;
      if (this.valid) {
        this.model.tests = this.configureTests(this.tests);
        const payload = _.mapValues(
          _.pick(this.model, this.fields),
          v => typeof v === 'string' && _.isEmpty(v) ? null : v,
        );
        this.$emit('submit', {
          id: this.model.id,
          patient: this.model.patient,
          payload,
        });
      }
    },
    searchLabTests (searchString) {
      this.$emit('searchLabTests', searchString);
    },
    async searchICD10 (text) {
      try {
        this.loadingICD10 = true;
        await this.$store.dispatch('fixtures/getICD10Fixtures', {
          searchString: text,
          limit: 50,
        });
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingICD10 = false;
      }
    },
    icd10Selected (icd10) {
      if (_.isEmpty(icd10)) {
        this.model.diagnosis = null;
        return;
      }
      this.selectedICD10 = icd10;
      this.model.diagnosisCode = icd10.code;
      this.model.diagnosisText = icd10.text;
    },
    configureTests (tests) {
      const individualTests = _.map(_.filter(tests, test => _.isNil(_.get(test, 'tests'))), test => {
        return {
          name: test.name,
          id: test.id,
        };
      }) || [];
      log('lab-order-form#tests', individualTests);

      const testsFromPackages = _.map(_.flattenDeep(_.map(_.filter(tests, test => _.get(test, 'tests')), test => test.tests)), test => {
        return {
          name: test.name,
          id: test.id,
        };
      }) || [];
      log('lab-order-form#packagesTests', testsFromPackages);

      const mergedTests = _.unionBy(individualTests, testsFromPackages, 'id');
      log('lab-order-form#mergedTests', mergedTests);
      return mergedTests;
    },
  },
};
</script>
