import Vue from 'vue';
import Vuetify from 'vuetify';
import faker from 'faker';
import FusionForm from '../fusion-form';
import flushPromises from 'flush-promises';
import { mount, createLocalVue } from '@vue/test-utils';

const ORG = { id: faker.random.uuid(), name: 'org' };
const PATIENT = {
  id: faker.random.uuid(),
  name: { lastName: 'last', firstName: 'first' },
  sex: 'm',
};
const DOCTOR_UID = faker.random.uuid();
const DOCTOR = {
  id: DOCTOR_UID,
  uid: DOCTOR_UID,
  doc_PRCLicenseNo: 'prc',
};
const TEMPLATE = {
  template: '<div>{attending_doc_prc} {patient_sex_0} {custom_text_test_0} {custom_choices_test_0}</div>',
  items: [{
    id: '0',
    question: 'custom_choices_test_0',
    type: 'multiplechoice',
    choices: ['choice 1', 'choice 2'],
  }],
};
const VALUES = [
  { id: 'attending_doc_prc', answer: DOCTOR.id },
  { id: 'patient_sex_0', answer: PATIENT.id },
  { id: 'custom_text_test_0', answer: 'custom text' },
  { id: 'custom_choices_test_0', answer: 'choice 2' },
];

const $sdk = {
  service: (name) => {
    const personalDetails = [DOCTOR, PATIENT];
    switch (name) {
      case 'personal-details':
        return {
          find: (query) => {
            const ids = query?.id?.$in || [];
            const items = personalDetails
              .filter(detail => ids.includes(detail.id));
            return { items };
          },
        };
    }
  },
};

beforeEach(() => {
  // handling transient components such as VMenu and VTooltip
  // see: https://github.com/vuetifyjs/vuetify/issues/3456
  const el = document.createElement('div');
  el.setAttribute('data-app', true);
  document.body.appendChild(el);
});

describe('FusionForm', () => {
  Vue.use(Vuetify);

  describe('props', () => {
    it('renders blank form', () => {
      const localVue = createLocalVue();
      const wrapper = mount(FusionForm, {
        localVue,
        mocks: {
          $activeOrganization: ORG,
          $enqueueSnack: jest.fn(),
        },
      });

      expect(wrapper.contains('[data-test="form"]')).toBe(true);
      expect(wrapper.contains('[data-test="readOnlyHtmlPreview"]')).toBe(false);
      expect(wrapper.contains('[data-test="tokenItem"]')).toBe(false);
    });

    it('renders appropriate input fields in form', async () => {
      const localVue = createLocalVue();
      const wrapper = mount(FusionForm, {
        localVue,
        mocks: {
          $activeOrganization: ORG,
          $enqueueSnack: jest.fn(),
        },
        propsData: {
          template: TEMPLATE.template,
          templateItems: TEMPLATE.items,
        },
      });

      await wrapper.vm.$nextTick();
      expect(wrapper.contains('[data-test="form"]')).toBe(true);
      expect(wrapper.contains('[data-test="readOnlyHtmlPreview"]')).toBe(false);
      expect(wrapper.findAll('[data-test="tokenItem"]').length).toBe(4);

      expect(wrapper.findAll('[data-test="memberSearch"]').length).toBe(1);
      expect(wrapper.findAll('[data-test="anonymized"]').length).toBe(1);
      expect(wrapper.findAll('[data-test="textInput"]').length).toBe(1);
      expect(wrapper.findAll('[data-test="comboboxInput"]').length).toBe(1);
    });

    it('renders read only html preview', () => {
      const localVue = createLocalVue();
      const wrapper = mount(FusionForm, {
        localVue,
        mocks: {
          $activeOrganization: ORG,
          $enqueueSnack: jest.fn(),
        },
        propsData: {
          readOnly: true,
        },
      });

      expect(wrapper.contains('[data-test="form"]')).toBe(false);
      expect(wrapper.contains('[data-test="readOnlyHtmlPreview"]')).toBe(true);
      expect(wrapper.contains('[data-test="tokenItem"]')).toBe(false);
    });

    it('renders read only html preview with template and values', async () => {
      const localVue = createLocalVue();
      const wrapper = mount(FusionForm, {
        localVue,
        mocks: {
          $activeOrganization: ORG,
          $enqueueSnack: jest.fn(),
          $sdk,
        },
        propsData: {
          value: VALUES,
          template: TEMPLATE.template,
          templateItems: TEMPLATE.items,
          readOnly: true,
        },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();

      expect(wrapper.contains('[data-test="readOnlyHtmlPreview"]')).toBe(true);
      const preview = wrapper.find('[data-test="readOnlyHtmlPreview"]');
      expect(preview.text()).toContain(DOCTOR.doc_PRCLicenseNo);
      expect(preview.text()).toContain('Male');
      expect(preview.text()).toContain('custom text');
      expect(preview.text()).toContain('choice 2');
    });
  });

  describe('events', () => {
    it('emits @input', async () => {
      const localVue = createLocalVue();
      localVue.filter('prettifyName', jest.fn(() => ''));
      const wrapper = mount(FusionForm, {
        localVue,
        mocks: {
          $activeOrganization: ORG,
          $enqueueSnack: jest.fn(),
          $sdk,
        },
        propsData: {
          template: TEMPLATE.template,
          templateItems: TEMPLATE.items,
          patient: PATIENT,
        },
      });

      await flushPromises();
      await wrapper.vm.$nextTick();

      expect(wrapper.contains('[data-test="form"]')).toBe(true);
      expect(wrapper.contains('[data-test="readOnlyHtmlPreview"]')).toBe(false);
      expect(wrapper.findAll('[data-test="tokenItem"]').length).toBe(4);

      expect(wrapper.findAll('[data-test="memberSearch"]').length).toBe(1);
      expect(wrapper.findAll('[data-test="anonymized"]').length).toBe(1);
      expect(wrapper.findAll('[data-test="textInput"]').length).toBe(1);
      expect(wrapper.findAll({ ref: 'comboboxInput' }).length).toBe(1);
      const memberSearch = wrapper.find('[data-test="memberSearch"]');
      const textInput = wrapper.find('[data-test="textInput"]');
      const comboboxInput = wrapper.find({ ref: 'comboboxInput' });

      memberSearch.vm.$emit('select', DOCTOR);
      await wrapper.vm.$nextTick();

      textInput.vm.$emit('debounce', 'custom text');
      await wrapper.vm.$nextTick();

      comboboxInput.vm.$emit('input', 'choice 2');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted().input.length).toBeGreaterThan(0);
      const emitted = wrapper.emitted().input;
      const lastEmit = emitted[emitted.length - 1];
      const finalResult = lastEmit[0];
      expect(finalResult).toEqual(VALUES);
    });
  });
});
