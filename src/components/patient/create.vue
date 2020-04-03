<template lang="pug">
  v-card(:class="{'elevation-0': hideCardElevation, 'elevation-2': !hideCardElevation}").pa-3
    v-card-text
      v-form(ref="formRef" v-model="valid")
        v-layout(row wrap)
          v-flex(xs12 md12).text-xs-center
            img-pickropper(
              ref="pickropper"
              @done="cropImage"
              force-crop
              :aspect-ratio="1"
            )
              template(slot="picker")
                img(
                  v-if="subject.pic"
                  width="150"
                  height="150"
                  :src="subject.pic"
                  @click="!loading && $refs.pickropper.selectFile()"
                ).pic-url.elevation-1.pa-1
                img(
                  v-else
                  width="150"
                  height="150"
                  src="../../assets/images/person-placeholder.png"
                  @click="!loading && $refs.pickropper.selectFile()"
                ).pic-url.elevation-1.pa-1
            input(
              ref="fileInput"
              type="file"
              hidden
              @change="updateImage($event)"
            )
        v-layout(row wrap)
          v-flex(grow v-if="isFieldVisible('first_name')").pa-1
            v-text-field(
              v-model="subject.firstName"
              outline
              flat
              :label="`First Name ${isFieldRequired('first_name') ? '*' : ''}`"
              required
              :disabled="loading"
              :rules="getFieldRule('first_name')"
            )
          v-flex(grow v-if="isFieldVisible('middle_name')").pa-1
            v-text-field(
              v-model="subject.middleName"
              outline
              flat
              :label="`Middle Name ${isFieldRequired('middle_name') ? '*' : ''}`"
              :disabled="loading"
              :rules="getFieldRule('middle_name')"
            )
          v-flex(grow v-if="isFieldVisible('last_name')").pa-1
            v-text-field(
              v-model="subject.lastName"
              outline
              flat
              :label="`Last Name ${isFieldRequired('last_name') ? '*' : ''}`"
              required
              :disabled="loading"
              :rules="getFieldRule('last_name')"
            )
          v-flex(grow v-if="isFieldVisible('suffix')").pa-1
            v-text-field(
              v-model="subject.suffix"
              outline
              flat
              :label="`Suffix ${isFieldRequired('suffix') ? '*' : ''}`"
              label="Suffix"
              :disabled="loading"
              :rules="getFieldRule('suffix')"
            )
        v-layout(row wrap)
          v-flex(grow xs6 md3 v-if="isFieldVisible('date_of_birth')").pa-1
            v-menu(
              v-model="dateMenu"
              :close-on-content-click="false"
              :rules="getFieldRule('date_of_birth')"
            )
              v-text-field(
                slot="activator"
                :value="formattedDateOfBirth"
                outline
                flat
                :label="`Date of Birth ${isFieldRequired('date_of_birth') ? '*' : ''}`"
                prepend-inner-icon="mdi-calendar"
                required
                readonly
                :disabled="loading"
                :rules="getFieldRule('date_of_birth')"
                width="100%"
              )
              v-date-picker(
                v-model="subject.dateOfBirth"
                color="primary"
                :max="maxDate"
                @input="dateMenu = false"
              )
          v-flex(grow xs6 md3 v-if="isFieldVisible('blood_type')").pa-1
            v-select(
              v-model="subject.bloodType"
              outline
              :label="`Blood Type ${isFieldRequired('blood_type') ? '*' : ''}`"
              :items="bloodTypes"
              :rules="getFieldRule('blood_type')"
            )
              template(slot="selection" slot-scope="props")
                span {{props.item | morph-capitalize}}
              template(slot="item" slot-scope="props")
                span {{props.item | morph-capitalize}}
          v-flex(grow xs6 md3 v-if="isFieldVisible('sex')").pa-1
            v-radio-group(
              v-model="subject.sex"
              :column="false"
              :rules="getFieldRule('sex')"
            )
              v-radio(
                color="primary"
                label="Male"
                value="male"
              )
              v-radio(
                color="primary"
                label="Female"
                value="female"
              )
          v-flex(grow xs6 md3 v-if="isFieldVisible('marital_status')").pa-1
            v-select(
              v-model="subject.maritalStatus"
              outline
              :label="`Marital Status ${isFieldRequired('marital_status') ? '*' : ''}`"
              :items="maritalStatuses"
              :rules="getFieldRule('marital_status')"
            )
              template(slot="selection" slot-scope="props")
                span {{props.item | morph-capitalize}}
              template(slot="item" slot-scope="props")
                span {{props.item | morph-capitalize}}
        v-layout(row wrap)
          v-flex(grow xs6 md6 v-if="isFieldVisible('mobile_num')")
            v-layout(row)
              v-flex(xs3).pa-1
                v-select(
                  v-model="mobileNoPrefix"
                  label="Code"
                  item-value="callingCode"
                  :items="callingCodes"
                  :disabled="loading"
                  :rules="getFieldRule('mobile_num')"
                  outline
                  required
                  width="60"
                  height="58"
                )
                  template(slot="selection" slot-scope="props")
                    span {{props.item.alpha3}}
                  template(slot="item" slot-scope="props")
                    v-list-tile-title {{props.item.name}}
              v-flex(xs9).pa-1
                v-text-field(
                  v-model="subject.mobileNo"
                  :label="`Mobile No ${isFieldRequired('mobile_num') ? '*' : ''}`"
                  :prefix="mobileNoPrefix"
                  mask="###-###-####"
                  outline
                  required
                  :disabled="loading"
                  :rules="getFieldRule('mobile_num')"
                )

        v-expansion-panel(v-model="panel" expand)
          v-expansion-panel-content(v-if="!$isCreating")
            div(slot="header") PATIENT ACCOUNT
            v-alert(:value="true" type="info").ma-1
              | Attach an email so you can send results directly to the patient
            v-layout(row wrap).mt-2.px-2
              v-flex(xs12 md4).pa-1
                v-text-field(
                  v-model="subject.account.email"
                  label="Email"
                  outline
                  :disabled="loading"
                )

          v-expansion-panel-content(v-if="isAddressPanelEnabled")
            div(slot="header") ADDRESS
            div.mt-2.px-2
              v-layout(row wrap)
                v-flex(v-if="isFieldVisible('add_line_1')").pa-1
                  v-text-field(
                    ref="street1Ref"
                    v-model="subject.street1"
                    :label="`Street 1 ${isFieldRequired('add_line_1') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('add_line_1')"
                  )
                v-flex(v-if="isFieldVisible('add_line_2')").pa-1
                  v-text-field(
                    ref="street2Ref"
                    v-model="subject.street2"
                    :label="`Street 2 ${isFieldRequired('add_line_2') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('add_line_2')"
                  )
              v-layout(row wrap)
                v-flex(v-if="isFieldVisible('add_city')").pa-1
                  v-text-field(
                    ref="cityRef"
                    v-model="subject.city"
                    :label="`City/Municipality ${isFieldRequired('add_city') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('add_city')"
                  )
                v-flex(v-if="isFieldVisible('add_province')").pa-1
                  v-text-field(
                    ref="provinceRef"
                    v-model="subject.province"
                    :label="`Province ${isFieldRequired('add_province') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('add_province')"
                  )
                v-flex(v-if="isFieldVisible('add_country')").pa-1
                  v-autocomplete(
                    ref="countryRef"
                    v-model="subject.country"
                    :label="`Country ${isFieldRequired('add_country') ? '*' : ''}`"
                    item-text="name"
                    item-value="alpha3"
                    outline
                    :items="countries"
                    :rules="getFieldRule('add_country')"
                  )

          v-expansion-panel-content(v-if="isTaggingPanelEnabled")
            div(slot="header") TAGGING
            v-layout(row wrap).mt-2.px-2
              v-flex(xs12 md12).pa-1
                v-autocomplete(
                  v-model="subject.tags"
                  :items="tags"
                  outline
                  chips
                  :label="`Group Patients ${isFieldRequired('tagging') ? '*' : ''}`"
                  multiple
                  v-if="isFieldVisible('tagging')"
                  :rules="getFieldRule('tagging')"
                )
                  //- TODO: enable or disable required
                  //- depending on settings
                  //- :rules="genericFieldRules"
                  template(slot="selection" slot-scope="data")
                    v-chip(
                      :selected="data.selected"
                      close
                      @input="removeTag(data.item)"
                    ) {{data.item}}
            v-layout(row wrap).px-2
              v-flex(v-if="isFieldVisible('osca_id')").pa-1
                v-text-field(
                  ref="oscaIdRef"
                  v-model="subject.OSCASeniorCitizenId"
                  :label="`OSCA Id No. ${isFieldRequired('osca_id') ? '*' : ''}`"
                  outline
                  :rules="getFieldRule('osca_id')"
                )
              v-flex(v-if="isFieldVisible('pwd_id')").pa-1
                v-text-field(
                  ref="pwdRef"
                  v-model="subject.PWDId"
                  :label="`PWD Id No. ${isFieldRequired('pwd_id') ? '*' : ''}`"
                  outline
                  :rules="getFieldRule('pwd_id')"
                )

          v-expansion-panel-content(v-if="isContactInfoPanelEnabled")
            div(slot="header") CONTACT INFO
            div.mt-2.px-2
              v-layout(row wrap)
                v-flex(xs12 md4 v-if="isFieldVisible('cont_home_num')").pa-1
                  v-text-field(
                    ref="homeNoRef"
                    v-model="subject.homeNo"
                    :label="`Home No. ${isFieldRequired('cont_home_num') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('cont_home_num')"
                  )
                v-flex(xs12 md4 v-if="isFieldVisible('cont_work_num')").pa-1
                  v-text-field(
                    ref="workNoRef"
                    v-model="subject.workNo"
                    :label="`Work No. ${isFieldRequired('cont_work_num') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('cont_work_num')"
                  )
                v-flex(xs12 md4 v-if="isFieldVisible('cont_emergency_num')").pa-1
                  v-text-field(
                    ref="emergencyNoRef"
                    v-model="subject.emergencyNo"
                    :label="`Emergency No. ${isFieldRequired('cont_emergency_num') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('cont_emergency_num')"
                  )

          v-expansion-panel-content(v-if="isCompanyPartnerPanelEnabled")
            div(slot="header") COMPANY PARTNER DETAILS
            v-layout(row wrap).mt-2.px-2
              v-flex(xs12 md12).pa-1
                addable-list(
                  :items="subject.companies || []"
                  add-label="Add Company"
                  :extract-key="['name', 'company.id', 'company']"
                  @add="addCompanyPartner"
                  @delete="removeCompanyPartner"
                )
                  template(slot-scope="props")
                    v-layout(row align-center wrap)
                      v-flex(xs12).pa-1
                        h3(v-if="props.item.name") {{ props.item.name }}
                        search-insurance-contracts(
                          v-else
                          v-model="props.item.company"
                          type="company"
                          :label="`Company Partner ${isFieldRequired('company_partners') ? '*' : ''}`"
                          item-text="insurerName"
                          item-value="insurer"
                          return-object
                          outline
                          :rules="getFieldRule('company_partners')"
                        )
                      v-flex(xs12).pa-1
                        v-text-field(
                          v-model="props.item.companyId"
                          outline
                          label="Company Id/No."
                          :disabled="!props.item.company || loading"
                        )

          v-expansion-panel-content(v-if="isEmergencyInfoPanelEnabled")
            div(slot="header") IN CASE OF EMERGENCY
            div.mt-2.px-2
              v-layout(row wrap)
                v-flex(xs12 md4 v-if="isFieldVisible('emergency_person')").pa-1
                  v-text-field(
                    ref="emergencyContactNameRef"
                    v-model="subject.emergencyContactName"
                    :label="`Company Person ${isFieldRequired('emergency_person') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('emergency_person')"
                  )
                v-flex(xs12 md4 v-if="isFieldVisible('emergency_contact_num')").pa-1
                  v-text-field(
                    ref="emergencyContactMobileNoRef"
                    v-model="subject.emergencyContactMobileNo"
                    :label="`Contact No ${isFieldRequired('emergency_contact_num') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('emergency_contact_num')"
                  )
                v-flex(xs12 md4 v-if="isFieldVisible('emergency_relationship')").pa-1
                  v-text-field(
                    ref="emergencyContactRelationshipRef"
                    v-model="subject.emergencyContactRelationship"
                    :label="`Relationship ${isFieldRequired('emergency_relationship') ? '*' : ''}`"
                    outline
                    :rules="getFieldRule('emergency_relationship')"
                  )

        v-layout(row v-if="!hideActions")
          v-flex(xs12 md12).pa-1
            v-btn(
              @click="cancel"
              :loading="loading"
              :disabled="loading"
              flat
              large
              color="error"
            ).mr-0.right Cancel
            v-btn(
              large
              color="primary"
              :loading="loading"
              :disabled="loading || loadingAccount"
              @click="submit"
            ).mr-0.right Save
</template>

<script>
// components
import AddableList from '../commons/addable-list';
import ImgPickropper from '../commons/img-pickropper';
import DatePickerMenu from '../commons/date-picker-menu';
import SearchInsuranceContracts from '../common-search/search-insurance-contracts';
// mixins
import cruMixin from '../../mixins/cru';
// constants
import { PATIENT_FIELDS } from './constants';
import { countries } from '../../assets/fixtures/countries';
import placeholderImg from '../../assets/images/person-placeholder.png';
// utils
import _ from 'lodash';
import {
  genericAssign,
  genericTransform,
  pickByDeep,
} from '../../utils/obj';
import { format, getTime } from 'date-fns';
import { initLogger } from '../../utils/store';
import { readInputFile } from '../../utils/file';
import { getPatient } from '../../services/patients';

export const COMPONENT_NAME = 'PatientCreate';
const log = initLogger(COMPONENT_NAME);

const bloodTypes = ['unknown', 'o+', 'o-', 'a+', 'a-', 'b+', 'b-', 'ab+', 'ab-'];
const maritalStatuses = ['separated', 'single', 'single-parent', 'married', 'widow', 'widower'];
const insuranceCardStatuses = ['active', 'inactive'];

const PATIENT_SUBJECT_MAPPINGS = [
  { from: 'account.email' },
  { from: 'address.city', to: 'city' },
  { from: 'address.country', to: 'country' },
  { from: 'address.province', to: 'province' },
  { from: 'address.street1', to: 'street1' },
  { from: 'address.street2', to: 'street2' },
  { from: 'bloodType', to: 'bloodType' },
  { from: 'maritalStatus', to: 'maritalStatus' },
  { from: 'dateOfBirth', format: d => d && format(new Date(d), 'YYYY-MM-DD') },
  { from: 'mobileNo' },
  { from: 'name.firstName', to: 'firstName' },
  { from: 'name.lastName', to: 'lastName' },
  { from: 'name.middleName', to: 'middleName' },
  { from: 'name.suffix', to: 'suffix' },
  { from: 'picURL', to: 'pic' },
  { from: 'sex' },
  { from: 'homeNo' },
  { from: 'workNo' },
  { from: 'emergencyNo' },
  { from: 'company' },
  { from: 'companyPosition' },
  { from: 'companyAddress' },
  { from: 'emergencyContactName' },
  { from: 'emergencyContactMobileNo' },
  { from: 'emergencyContactRelationship' },
  { from: 'fathersName' },
  { from: 'fathersMobileNo' },
  { from: 'fathersReligion' },
  { from: 'fathersNationality' },
  { from: 'mothersName' },
  { from: 'mothersMobileNo' },
  { from: 'mothersReligion' },
  { from: 'mothersNationality' },
  { from: 'tags', to: 'tags' },
  {
    from: 'insuranceCards',
    format: i => (i || []).filter(item => !_.isEmpty(item)),
  },
  {
    from: 'companies',
    format: i => (i || []).filter(item => !_.isEmpty(item)),
  },
  { from: 'OSCASeniorCitizenId' },
  { from: 'PWDId' },
  { from: 'medicalNote.text', to: 'additionalNote' },
];
const SUBJECT_PATIENT_MAPPINGS = [
  { from: 'bloodType', to: 'bloodType' },
  { from: 'maritalStatus', to: 'maritalStatus' },
  { from: 'city', to: 'address.city' },
  { from: 'country', to: 'address.country' },
  { from: 'dateOfBirth', format: d => d && getTime(new Date(d)) },
  { from: 'firstName', to: 'name.firstName' },
  { from: 'lastName', to: 'name.lastName' },
  { from: 'middleName', to: 'name.middleName' },
  { from: 'mobileNo' },
  { from: 'province', to: 'address.province' },
  { from: 'sex' },
  { from: 'suffix', to: 'name.suffix' },
  { from: 'street1', to: 'address.street1' },
  { from: 'street2', to: 'address.street2' },
  { from: 'homeNo' },
  { from: 'workNo' },
  { from: 'emergencyNo' },
  { from: 'company' },
  { from: 'companyPosition' },
  { from: 'companyAddress' },
  { from: 'emergencyContactName' },
  { from: 'emergencyContactMobileNo' },
  { from: 'emergencyContactRelationship' },
  { from: 'fathersName' },
  { from: 'fathersMobileNo' },
  { from: 'fathersReligion' },
  { from: 'fathersNationality' },
  { from: 'mothersName' },
  { from: 'mothersMobileNo' },
  { from: 'mothersReligion' },
  { from: 'mothersNationality' },
  { from: 'tags', to: 'tags' },
  {
    from: 'insuranceCards',
    format: i => (i || [])
      .map(item => _.pickBy(item, Boolean))
      .filter(item => !_.isEmpty(item))
      .map(item => ({
        ...item,
        // normalize insurance to id
        insurance: _.isString(item.insurance)
          ? item.insurance
          : item.insurance.insurer,
      })),
  },
  {
    from: 'companies',
    format: i => (i || [])
      .map(item => _.pickBy(item, Boolean))
      .filter(item => !_.isEmpty(item))
      .map(item => ({
        ...item,
        // normalize company
        ..._.isString(item.company)
          ? { company: item.company }
          : { company: item.company.insurer, name: item.company.insurerName },
      })),
  },
  { from: 'OSCASeniorCitizenId' },
  { from: 'PWDId' },
];

export default {
  components: {
    AddableList,
    DatePickerMenu,
    ImgPickropper,
    SearchInsuranceContracts,
  },
  mixins: [cruMixin],
  props: {
    editId: {
      type: String,
      default: undefined,
    },
    initialValue: {
      type: Object,
      default: undefined,
    },
    readOnly: Boolean,
    emitResult: Boolean,
    hideActions: Boolean,
    hideCardElevation: Boolean,
    goBackOnSuccess: {
      type: Boolean,
      default: true,
    },
  },
  data () {
    return {
      organization: {},
      loading: false,
      valid: false,
      patient: {},
      bloodTypes,
      maritalStatuses,
      insuranceCardStatuses,
      mobileNoPrefix: '+63',
      subject: {
        firstName: null,
        middleName: null,
        lastName: null,
        suffix: null,
        bloodType: null,
        maritalStatus: null,
        pic: placeholderImg,
        sex: null,
        dateOfBirth: null,
        mobileNo: null,
        street1: null,
        street2: null,
        city: null,
        province: null,
        country: 'PHL',
        tags: null,
        insuranceCards: [],
        companies: [],
        homeNo: null,
        workNo: null,
        emergencyNo: null,
        company: null,
        companyPosition: null,
        companyAddress: null,
        emergencyContactName: null,
        emergencyContactMobileNo: null,
        emergencyContactRelationship: null,
        fathersName: null,
        fathersMobileNo: null,
        fathersReligion: null,
        fathersNationality: null,
        mothersName: null,
        mothersMobileNo: null,
        mothersReligion: null,
        mothersNationality: null,
        additionalNote: null,
        account: {
          email: null,
          password: null,
          confirmPassword: null,
        },
      },
      dateMenu: false,
      cropDialog: false,
      panel: [true, true, false, false],
      defaultPatientFields: PATIENT_FIELDS,
    };
  },
  computed: {
    // organization () {
    //   return this.$activeOrganization || {};
    // },
    patientFields () {
      const fields = this.organization.mf_patientFields || this.defaultPatientFields || {};
      return fields;
    },
    countries () {
      return countries;
    },
    callingCodes () {
      return _.map(countries, (country) => {
        if (!_.isEmpty(country.countryCallingCodes)) {
          return {
            name: _.get(country, 'name'),
            callingCode: country.countryCallingCodes[0],
            alpha3: _.get(country, 'alpha3'),
          };
        }
      })
        .filter(country => !!country);
    },
    maxDate () {
      return format(Date.now(), 'YYYY-MM-DD');
    },
    formattedDateOfBirth () {
      return this.subject && this.subject.dateOfBirth
        ? format(new Date(this.subject.dateOfBirth), 'DD MMM YYYY')
        : null;
    },
    tags () {
      const defaultTags = ['VIP', 'Senior Citizen'];
      return _.concat(this.$activeOrganization.tags || [], defaultTags);
    },
    isAddressPanelEnabled () {
      return (
        this.isFieldVisible('add_line_1') ||
        this.isFieldVisible('add_line_2') ||
        this.isFieldVisible('add_country') ||
        this.isFieldVisible('add_province') ||
        this.isFieldVisible('add_city')
      );
    },
    isTaggingPanelEnabled () {
      return (
        this.isFieldVisible('tagging') ||
        this.isFieldVisible('PWDId') ||
        this.isFieldVisible('OSCASeniorCitizenId')
      );
    },
    isHmoPanelEnabled () {
      return this.isFieldVisible('hmo');
    },
    isCompanyPartnerPanelEnabled () {
      return this.isFieldVisible('company_partners');
    },
    isContactInfoPanelEnabled () {
      return (
        this.isFieldVisible('cont_home_num') ||
        this.isFieldVisible('cont_work_num') ||
        this.isFieldVisible('cont_emergency_num')
      );
    },
    isWorkInfoPanelEnabled () {
      return (
        this.isFieldVisible('work_company') ||
        this.isFieldVisible('work_position') ||
        this.isFieldVisible('work_address')
      );
    },
    isEmergencyInfoPanelEnabled () {
      return (
        this.isFieldVisible('emergency_person') ||
        this.isFieldVisible('emergency_contact_num') ||
        this.isFieldVisible('emergency_relationship')
      );
    },
    isFamilyInfoPanelEnabled () {
      return (
        this.isFieldVisible('fathers_name') ||
        this.isFieldVisible('fathers_contact_num') ||
        this.isFieldVisible('fathers_religion') ||
        this.isFieldVisible('fathers_nationality') ||
        this.isFieldVisible('mothers_name') ||
        this.isFieldVisible('mothers_contact_num') ||
        this.isFieldVisible('mothers_religion') ||
        this.isFieldVisible('mothers_nationality')
      );
    },
  },
  watch: {
    $cruMode () {
      this.$route.meta.title = `${this.$isEditing ? 'Update' : 'Create'} Patient`;
    },
    subject: {
      handler () {
        log('subject', this.subject);
      },
      deep: true,
    },
  },
  async created () {
    log(this.editId || this.$id);
    await this.init();
  },
  methods: {
    async init () {
      log('init');
      try {
        this.loading = true;

        /*
          For some reason, the mf_patientfields from directly $activeOrganization does not match with the retrieved
          data using the organization id as query.
        */
        // NOTE: use monorepo-frontend#organization store action loadActiveOrganizationConfiguration
        this.organization = await this.$sdk.service('organizations').get(this.$activeOrganization.id);
        if (this.editId || this.$id) {
          this.patient = await getPatient(this.$sdk, { id: this.editId || this.$id });
          genericAssign(PATIENT_SUBJECT_MAPPINGS, this.patient, this.subject);
          log('init#patient: %O', this.patient);
          log('init#subject: %O', this.subject);
        }
        if (this.initialValue) {
          genericAssign(PATIENT_SUBJECT_MAPPINGS, this.initialValue, this.subject);
        }
      } catch (error) {
        console.error(error);
        log('init#error');
      } finally {
        this.loading = false;
      }
    },
    isFieldVisible (key) {
      const field = (this.patientFields || {})[key] ||
        (this.defaultPatientFields || {})[key];
      return _.isEmpty(field) || field.enabled;
    },
    isFieldRequired (key) {
      const field = (this.patientFields || {})[key] ||
        (this.defaultPatientFields || {})[key];
      return _.isEmpty(field) || field.required;
    },
    getFieldRule (key) {
      const field = (this.patientFields || {})[key] ||
        (this.defaultPatientFields || {})[key];
      const rule = field && field.enabled && field.required
        ? this.genericFieldRules : [];
      return rule;
    },
    chooseImage () {
      this.$refs.fileInput.click();
    },
    async updateImage (event) {
      log(event);
      this.subject.pic = await readInputFile(event);
    },
    cropImage (result) {
      log(result);
      this.subject.pic = result;
    },
    removeTag (tag) {
      this.subject.tags = _.without(this.subject.tags, tag);
    },
    addHmo () {
      log('addHmo');
      this.subject.insuranceCards = _.concat(this.subject.insuranceCards,
        { insurance: null, number: '', validAt: null, expiresAt: null, status: null });
      log(this.subject.insuranceCards);
    },
    removeHmo ({ index }) {
      log('removeHmo');
      this.subject.insuranceCards = _.reject(
        this.subject.insuranceCards,
        (hmo, i) => i === index
      );
      log(this.subject.insuranceCards);
    },
    addCompanyPartner () {
      log('addCompanyPartner');
      if (_.isEmpty(this.subject.companies)) { this.subject.companies = []; }
      this.subject.companies = this.subject.companies.concat({ company: null, companyId: '' });
      log(this.subject.companies);
    },
    removeCompanyPartner ({ index }) {
      log('removeCompanyPartner');
      this.subject.companies = _.reject(
        this.subject.companies,
        (hmo, i) => i === index
      );
      log(this.subject.companies);
    },
    async cancel () {
      if (!this.emitResult) {
        this.$router.go(-1);
      } else {
        this.$emit('cancel', true);
      }
    },
    async submit () {
      try {
        const valid = this.$refs.formRef.validate();
        if (!valid) {
          this.$enqueueSnack({
            color: 'warning',
            message: 'Incomplete fields. Please fill up required fields.',
          });
          return;
        }

        this.loading = true;
        log('submit#subject: %O', this.subject);
        const patient = pickByDeep(
          genericTransform(SUBJECT_PATIENT_MAPPINGS, this.subject),
          _.negate(_.isNil)
        );
        log('submit#patient: %O', patient);

        log(`submit#mode: ${this.$cruMode}`);
        let patientId = this.editId || this.$id;
        if (this.$isCreating || (!this.editId && !this.$id)) {
          const { id } = await this.$sdk.service('medical-patients').create({
            facility: this.$activeOrganization.id,
            personalDetails: patient,
          });
          patientId = id;
        }
        if (this.editId || this.$id || this.$isEditing) {
          await this.$sdk.service('personal-details').update(this.editId || this.$id, patient);
          log('submit#updatePersonalDetails');
        }

        // handle special case: picURL
        if (this.subject.pic !== this.patient.picURL &&
          this.subject.pic !== placeholderImg) {
          // TODO: remove later
          const picURL = await this.$fbUploader({
            file: this.subject.pic,
            service: 'personal-details',
          });
          // const picURL = await this.$sdk.service('storage').uploadImage(this.subject.pic, {
          //   service: 'personal-details',
          //   // TODO: add path once supported by sdk
          // });
          await this.$sdk.service('personal-details').update(patientId, { picURL });
          log('submit#updatePicURL');
        }

        // handle special case: additionalNote
        if (!_.isEmpty(this.subject.additionalNote) &&
          this.subject.additionalNote !== _.get(this.patient, 'medicalNote.text')) {
          log(`submit#additionalNote: ${this.subject.additionalNote}`);

          const query = {
            type: 'medical-note',
            patient: patientId,
            facility: this.$activeOrganization.id,
          };
          log('submit#query: %O', query);
          const record = await this.$sdk.service('medical-records').findOne(query);
          log('submit#record: %O', record);

          if (_.isEmpty(record)) {
            log('submit: creating');
            const payload = {
              type: 'medical-note',
              patient: patientId,
              facility: this.$activeOrganization.id,
              text: this.subject?.additionalNote,
            };
            if (this.$currentUser?.isDoctor) {
              payload.provider = this.$currentUser.uid;
            }
            await this.$sdk.service('medical-records').create(payload);
          } else {
            log('submit#update#query: %O', query);
            await this.$sdk.service('medical-records').update(query, { text: this.subject?.additionalNote });
          }
        }

        // handle special case: account
        if (this.subject.account.email?.length &&
          this.subject.account.email !== this.patient?.account?.email) {
          await this.$sdk.service('account-invitations').create({
            type: 'patient',
            patient: patientId,
            email: this.subject.account.email,
          });
        }

        // force re-fetch
        if (this.editId || this.$id) {
          this.patient = await getPatient(this.$sdk, { id: this.editId || this.$id });
          if (!this.goBackOnSuccess) {
            genericAssign(PATIENT_SUBJECT_MAPPINGS, this.patient, this.subject);
            log('init#patient: %O', this.patient);
            log('init#subject: %O', this.subject);
          }
        }
        this.$enqueueSnack({
          message: `Patient successfully ${this.$cruMode}d!`,
          color: 'success',
        });
        this.$emit('success', { id: patientId });
        if (this.goBackOnSuccess) this.$router.go(-1);
      } catch (error) {
        console.error(error);
        log('submit#error');
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Try again.',
          color: 'error',
        });
      } finally {
        log('submit: done');
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.mc-width {
  width: 100%;
}

.mc-click:hover {
  cursor: pointer;
}

.pic-url:hover {
  cursor: pointer;
}
</style>
