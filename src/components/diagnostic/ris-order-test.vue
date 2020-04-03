<template lang="pug">
  v-container(fluid)
    v-progress-linear(v-if="loading" indeterminate)
    v-card(v-else)
      v-toolbar(flat)
        h2 {{testName}}
        v-chip(:color="statusColor" dark).ml-2 {{statusText}}
        v-chip(v-if="readOnly" dark).ml-2 READ ONLY
        v-spacer
        v-btn(
          v-if="canCancel"
          color="error"
          @click="authenticateAction('cancel')"
        )
          v-icon mdi-close
          | Cancel Order
        v-menu
          v-btn(slot="activator" color="success")
            v-icon mdi-printer
            |  Print
          v-list
            v-list-tile(@click="onReportPrint")
              v-list-tile-title Print Report
            v-list-tile(@click="onClaimStubPrint")
              v-list-tile-title Print Claim Stub
            v-list-tile(@click="onSpecimenIdPrint")
              v-list-tile-title Print Control ID
      v-alert(:value="displaySentOutTo" type="info")
        | Sent out to: {{sentOutTo}}
      v-alert(:value="displayCancelledBy" type="error")
        | Cancelled by: {{cancelledByName | prettify-name-first}}
      v-card-text
        .mc-border
          patient-details(
            v-if="patientId"
            :id="patientId"
            flat
            read-only
          )
        form(@submit.prevent="submit").my-2
          v-layout(row wrap)
            v-flex(xs12 md4).pa-1
              v-text-field(
                :value="orderTags"
                label="Exam Type"
                outline
                readonly
              )
            v-flex(xs12 md4).pa-1
              v-text-field(
                :value="testReason"
                label="Test Reason"
                outline
                readonly
              )
            v-flex(xs12 md4).pa-1
              v-text-field(
                :value="requestingPhysician"
                label="Requesting Physician"
                outline
                readonly
              )

          v-layout(row wrap)
            v-flex(xs12 md6).pa-1
              v-layout(row)
                v-text-field(
                  v-model="orderTestModel.specimen"
                  label="Control ID"
                  outline
                  append-icon="mdi-plus"
                  @change="updateSpecimenCollectedAt"
                  @click:append="generateSpecimenId"
                  :readonly="readOnly"
                )

            v-flex(xs12 md6).pa-1
              v-text-field(
                v-if="readOnly"
                :value="estimatedReleaseDate"
                label="Est. Release Date"
                outline
                readonly
              )
              date-picker-menu(
                v-else
                v-model="orderTestModel.estimatedReleaseAt"
                label="Est. Release Date"
                :min="minDate"
                format="MM/DD/YYYY h:mm A"
                outline
                datetime
              )

          v-layout(row wrap)
            v-flex(xs12 md6).pa-1.mb-4
              generic-search(
                v-model="orderTestModel.technician"
                :items="imagingMembersItems"
                item-text="name"
                item-value="uid"
                label="Select Technologist"
                outline
                slotted
                :read-only="readOnly"
                no-filter
                @search="searchImagingMembers"
              )
                template(slot="selection" slot-scope="props")
                  v-chip
                    v-avatar
                      img(v-if="props.item.picURL" :src="props.item.picURL")
                      img(v-else src="@/assets/images/person-placeholder.png")
                    | {{props.item.name | prettifyNameFirst}}
                template(slot="item" slot-scope="props")
                  v-list-tile-avatar
                    img(v-if="props.item.picURL" :src="props.item.picURL")
                    img(v-else src="@/assets/images/person-placeholder.png")
                  v-list-tile-content
                    v-list-tile-title {{props.item.name | prettifyNameFirst}}
                    v-list-tile-sub-title {{prettifyRoles(props.item.roles)}}
            v-flex(v-if="!hideRadiologist" xs12 md6).pa-1.mb-4
              generic-search(
                v-model="orderTestModel.radiologist"
                :items="radiologistMembersItems"
                item-text="name"
                item-value="uid"
                label="Select Radiologist"
                outline
                slotted
                :read-only="readOnly"
                no-filter
                @search="serachRadiologistMembers"
              )
                template(slot="selection" slot-scope="props")
                  v-chip
                    v-avatar
                      img(v-if="props.item.picURL" :src="props.item.picURL")
                      img(v-else src="@/assets/images/person-placeholder.png")
                    | {{props.item.name | prettifyNameFirst}}
                template(slot="item" slot-scope="props")
                  v-list-tile-avatar
                    img(v-if="props.item.picURL" :src="props.item.picURL")
                    img(v-else src="@/assets/images/person-placeholder.png")
                  v-list-tile-content
                    v-list-tile-title {{props.item.name | prettifyNameFirst}}
                    v-list-tile-sub-title {{prettifyRoles(props.item.roles)}}
            v-flex(v-if="!hideSonologist" xs12 md6).pa-1.mb-4
              generic-search(
                v-model="orderTestModel.sonologist"
                :items="sonologistMembersItems"
                item-text="name"
                item-value="uid"
                label="Select Sonologist"
                outline
                slotted
                :read-only="readOnly"
                no-filter
                @search="searchSonologist"
              )
                template(slot="selection" slot-scope="props")
                  v-chip
                    v-avatar
                      img(v-if="props.item.picURL" :src="props.item.picURL")
                      img(v-else src="@/assets/images/person-placeholder.png")
                    | {{props.item.name | prettifyNameFirst}}
                template(slot="item" slot-scope="props")
                  v-list-tile-avatar
                    img(v-if="props.item.picURL" :src="props.item.picURL")
                    img(v-else src="@/assets/images/person-placeholder.png")
                  v-list-tile-content
                    v-list-tile-title {{props.item.name | prettifyNameFirst}}
                    v-list-tile-sub-title {{prettifyRoles(props.item.roles)}}
            v-flex(v-if="!hideCardiologist" xs12 md6).pa-1.mb-4
              generic-search(
                v-model="orderTestModel.cardiologist"
                :items="cardiologistMembersItems"
                item-text="name"
                item-value="uid"
                label="Select Cardiologist"
                outline
                slotted
                :read-only="readOnly"
                no-filter
                @search="searchCardiologist"
              )
                template(slot="selection" slot-scope="props")
                  v-chip
                    v-avatar
                      img(v-if="props.item.picURL" :src="props.item.picURL")
                      img(v-else src="@/assets/images/person-placeholder.png")
                    | {{props.item.name | prettifyNameFirst}}
                template(slot="item" slot-scope="props")
                  v-list-tile-avatar
                    img(v-if="props.item.picURL" :src="props.item.picURL")
                    img(v-else src="@/assets/images/person-placeholder.png")
                  v-list-tile-content
                    v-list-tile-title {{props.item.name | prettifyNameFirst}}
                    v-list-tile-sub-title {{prettifyRoles(props.item.roles)}}

          v-layout(row wrap).my-4
            v-flex(xs12 v-if="!readOnly")
              v-toolbar(flat).bordered-toolbar.py-1
                generic-search(
                  label="Select Template"
                  :items="imagingTemplates"
                  item-value="id"
                  outline
                  slotted
                  width="100%"
                  :filter="v => v"
                  @select="selectTemplate"
                  @search="searchTemplates"
                )
                  template(slot="selection" slot-scope="props")
                    span {{props.item.name}}
                  template(slot="item" slot-scope="props")
                    v-list-tile-content
                      v-list-tile-title {{props.item.name}}
                      v-list-tile-sub-title Tags: {{prettifyTags(props.item.tags)}}
              mc-wysiwyg(
                v-model="resultHTML"
                :key="templateId"
                :height="350"
                style="margin-top: 0px;"
              )
            v-flex(xs12 md12 v-else).pa-1
              div(v-html="resultHTML").result-preview
          v-layout(v-if="hasAttachments || !readOnly" row).mt-2
            v-flex(xs12).pa-1
              h3 Attachments
              v-layout(row wrap)
                diagnostic-order-test-attachment(
                  :attachments="attachmentURLs"
                  @delete="index => removeAttachmentURL(index)"
                )
                diagnostic-order-test-attachment(
                  :attachments="attachmentsModel"
                  @delete="index => removeAttachmentModel(index)"
                )
          v-layout(v-if="canAttach" row)
            v-flex(shrink).mr-2
              img-pickropper(
                ref="pickropper"
                fullscreen
                @done="pushAttachment"
              )
                template(slot="picker")
                  v-btn(
                    outline
                    color="primary"
                    large
                    block
                    @click="$refs.pickropper.selectFile()"
                  )
                    v-icon mdi-cloud-upload
                    | &nbsp;Upload
            v-flex(shrink)
              img-picker(
                ref="imgPickerRef"
                @select="openDrawingboard"
              )
                template(slot="activator")
                  v-btn(
                    outline
                    color="primary"
                    large
                    block
                    @click="$refs.imgPickerRef.openFileInput()"
                  )
                    v-icon mdi-pencil
                    | &nbsp;Draw

          v-layout(row).mt-2
            v-flex(xs12).pa-1
              v-textarea(
                v-model="orderTestModel.remarks"
                label="Remarks"
                outline
                :readonly="isAttachReadOnly"
              )

          v-layout(row)
            v-spacer
            v-btn(
              v-if="canComplete"
              color="gray"
              large
              @click="sendOutDialog = true"
            )
              v-icon mdi-lock
              | Send Out
            v-btn(
              v-if="canFinalize"
              color="success"
              large
              @click="authenticateAction('finalize')"
            )
              v-icon mdi-lock
              | {{ getActionText('finalize') }}
            v-btn(
              v-if="canVerify"
              color="success"
              large
              @click="authenticateAction('verify')"
            )
              v-icon mdi-lock
              | {{ getActionText('verify') }}
            v-btn(
              v-if="canComplete"
              color="success"
              large
              @click="authenticateAction('complete')"
            )
              v-icon mdi-lock
              | {{ getActionText('complete') }}
            v-btn(
              v-if="canAttach"
              type="submit"
              color="primary"
              large
            ) Save
            v-btn(
              color="error"
              flat
              large
              @click="!isAttachReadOnly ? goBackDialog = true : $router.go(-1)"
            ) Go Back

        async-confirm-dialog(ref="confirmDialog")
        center-picker-dialog(
          :dialog.sync="sendOutDialog"
          @select="authenticateAction('send-out', $event)"
        )
        authenticate-dialog(
          :dialog.sync="authDialog"
          :email="user.email"
          password-only
          @auth="validate($event)"
          title="Authenticate"
          login-text="Authenticate"
        )
        yes-or-no(
          title="Go Back"
          message="Are you sure you want to discard changes?"
          :dialog="goBackDialog"
          @close="goBackDialog = $event"
          @yes="$router.go(-1)"
        )

        drawing-dialog(
          :dialog.sync="drawingDialog"
          :template="imgToDrawOn"
          @save="attachmentsModel.push($event)"
        )
</template>

<script>
// components
import YesOrNo from '../dialogs/yes-no';
import ImgPicker from '../commons/img-picker';
import { McWysiwyg } from '@mycure/vue-wysiwyg';
import PatientDetails from '../patient/details';
import GenericSearch from '../commons/generic-search';
import ImgPickropper from '../commons/img-pickropper';
import DatePickerMenu from '../commons/date-picker-menu';
import AuthenticateDialog from '../dialogs/authenticate';
import AsyncConfirmDialog from '../commons/async-confirm-dialog';
import CenterPickerDialog from './diagnostic-center-picker-dialog';
import DrawingDialog from '../medical-records/attachment/draw-dialog';
import DiagnosticOrderTestAttachment from './diagnostic-order-test-attachment';
// constants
import {
  STATUS_COLOR_MAP,
  RIS_COMPLETE_ROLES,
  RIS_VERIFY_ROLES,
  RIS_FINALIZE_ROLES,
  RIS_CANCEL_ROLES,
  RIS_ORDER_TEST_MODEL_MAPPINGS,
  RIS_MODEL_ORDER_TEST_MAPPINGS,
  ORDER_TEST_ACTIONS,
} from './constants';
// utils
import _ from 'lodash';
import cruMixin from '../../mixins/cru';
import { removeIndex } from '../../utils/list';
import { initLogger } from '../../utils/logger';
import { format, addMilliseconds } from 'date-fns';
import { getPatient } from '../../services/patients';
import { permitRoles } from '../../utils/permissions';
import { generateSpecimenId, getInjectedValue } from './utils';
import { genericAssign, genericTransform } from '../../utils/obj';

const log = initLogger('RisOrderTest');

export default {
  components: {
    DrawingDialog,
    AuthenticateDialog,
    GenericSearch,
    DatePickerMenu,
    ImgPicker,
    ImgPickropper,
    AsyncConfirmDialog,
    DiagnosticOrderTestAttachment,
    YesOrNo,
    PatientDetails,
    CenterPickerDialog,
    McWysiwyg,
  },
  mixins: [cruMixin],
  props: {
    user: {
      type: Object,
      default: undefined,
    },
    imagingMembers: {
      type: Array,
      default: undefined,
    },
    radiologistMembers: {
      type: Array,
      default: undefined,
    },
    cardiologistMembers: {
      type: Array,
      default: undefined,
    },
    sonologistMembers: {
      type: Array,
      default: undefined,
    },
  },
  data () {
    return {
      loading: true,
      patient: {},
      orderTest: {},
      orderTestModel: {
        specimen: null,
        specimenCollectedAt: null,
        specimenHarvestMethod: null,
        estimatedReleaseAt: null,
        technician: null,
        radiologist: null,
        sonologist: null,
        cardiologist: null,
        remarks: null,
      },
      attachmentURLs: [],
      attachmentsModel: [],
      resultsModel: [],
      sendOutCenter: null,
      sendOutDialog: false,
      authDialog: false,
      goBackDialog: false,
      drawingDialog: false,
      imgToDrawOn: '',
      pendingValidateAction: null,
      selectedTemplate: null,
      fetchedImagingTemplates: [],
      resultHTML: '',
      configRIS: {},
    };
  },
  computed: {
    organization () {
      return this.$activeOrganization || {};
    },
    languagesConfig () {
      return _.get(this.organization, 'configFacility.languages');
    },
    baseFilterItems () {
      return ORDER_TEST_ACTIONS
        .map(i => {
          if (i.languageSetting) {
            i.name = _.get(this.languagesConfig, i.languageSetting) || i.name;
          }
          return i;
        });
    },
    imagingTemplates () {
      if (!this.selectedTemplate) return this.fetchedImagingTemplates;
      return _.unionBy([this.selectedTemplate], this.fetchedImagingTemplates, 'id');
    },
    status () {
      if (!this.orderTest) return;
      const {
        completedAt,
        verifiedAt,
        finalizedAt,
        sentOutAt,
        cancelledAt,
      } = this.orderTest;

      if (cancelledAt) return 'cancelled';
      if (sentOutAt && !completedAt && !finalizedAt) return 'sent-out';
      if (!completedAt) return 'pending';
      if (!verifiedAt) return 'completed';
      if (!finalizedAt) return 'verified';
      return 'finalized';
    },
    statusText () {
      const i = this.baseFilterItems.findIndex(x => x.status === this.status);
      return i > -1 ? this.baseFilterItems[i].name : _.startCase(this.status);
    },
    statusColor () {
      return STATUS_COLOR_MAP[this.status];
    },
    order () {
      return _.get(this.orderTest, 'order');
    },
    testReason () {
      return _.get(this.order, 'reason') || 'None provided.';
    },
    requestingPhysician () {
      return _.get(this.order, 'requestingPhysician') || 'None provided.';
    },
    minDate () {
      return format(Date.now(), 'YYYY-MM-DD');
    },
    testName () {
      return _.get(this.$store.state.diagnostic.diagnosticTest, 'name');
    },
    orderTags () {
      const tags = _.get(this.orderTest, 'tags') || [];
      return _.uniq(tags).join(', ');
    },
    hideRadiologist () {
      return _.get(this.$store.state.diagnostic.diagnosticTest, 'hideRadiologist');
    },
    hideSonologist () {
      return _.get(this.$store.state.diagnostic.diagnosticTest, 'hideSonologist');
    },
    hideCardiologist () {
      return _.get(this.$store.state.diagnostic.diagnosticTest, 'hideCardiologist');
    },
    hasAttachments () {
      return _.size(this.attachmentsModel) || _.size(this.attachmentURLs);
    },
    estimatedReleaseDate () {
      if (_.isNil(this.orderTestModel.estimatedReleaseAt)) return;

      return format(this.orderTestModel.estimatedReleaseAt, 'MM/DD/YYYY hh:mm A');
    },
    sentOutTo () {
      return _.get(this.orderTest, 'sentOutTo.name');
    },
    displaySentOutTo () {
      return this.status === 'sent-out' && !_.isEmpty(this.sentOutTo);
    },
    cancelledByName () {
      return _.get(this.orderTest, 'cancelledBy.name');
    },
    displayCancelledBy () {
      return this.status === 'cancelled' && !_.isEmpty(this.cancelledByName);
    },
    imagingMembersItems () {
      if (!this.orderTestModel.technician) return this.imagingMembers;
      return _.unionBy([this.orderTestModel.technician], this.imagingMembers, 'id');
    },
    radiologistMembersItems () {
      if (!this.orderTestModel.radiologist) return this.radiologistMembers;
      return _.unionBy([this.orderTestModel.radiologist], this.radiologistMembers, 'id');
    },
    sonologistMembersItems () {
      if (!this.orderTestModel.sonologist) return this.sonologistMembers;
      return _.unionBy([this.orderTestModel.sonologist], this.sonologistMembers, 'id');
    },
    cardiologistMembersItems () {
      if (!this.orderTestModel.cardiologist) return this.cardiologistMembers;
      return _.unionBy([this.orderTestModel.cardiologist], this.cardiologistMembers, 'id');
    },
    patientId () {
      return _.get(this.orderTest, 'patient.id');
    },
    canComplete () {
      const isPrivileged = permitRoles(this.$activeMembership, RIS_COMPLETE_ROLES);

      return isPrivileged && this.status === 'pending';
    },
    canVerify () {
      const isPrivileged = permitRoles(this.$activeMembership, RIS_VERIFY_ROLES);
      const isUnverified = this.status === 'pending' ||
        this.status === 'completed';

      return isPrivileged && isUnverified;
    },
    canFinalize () {
      const isPrivileged = permitRoles(this.$activeMembership, RIS_FINALIZE_ROLES);
      const isUnfinalized = this.status === 'pending' ||
        this.status === 'completed' ||
        this.status === 'verified';

      return isPrivileged && isUnfinalized;
    },
    canCancel () {
      const isPrivileged = permitRoles(this.$activeMembership, RIS_CANCEL_ROLES);
      const isUnfinalized = this.status === 'pending' ||
        this.status === 'completed' ||
        this.status === 'verified';

      return isPrivileged && isUnfinalized;
    },
    editable () {
      return this.canComplete || this.canVerify || this.canFinalize;
    },
    readOnly () {
      return !this.editable;
    },
    canAttach () {
      return this.editable || this.status === 'sent-out';
    },
    isAttachReadOnly () {
      return !this.canAttach;
    },
    diagnosticTest () {
      return this.$store.state.diagnostic.diagnosticTest;
    },
    templateId () {
      return this.selectedTemplate?.id;
    },
  },
  watch: {
    resultHTML (val) {
      this.resultsModel[0].value = val;
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;

        log('init#id', this.$id);
        this.orderTest = await this.$store.dispatch('diagnostic/getOrderTest', this.$id);
        log('init#orderTest: %O', this.orderTest);

        const [patient] = await Promise.all([
          getPatient(this.$sdk, { id: this.patientId }),
          this.$store.dispatch('diagnostic/getDiagnosticTest', this.orderTest.test.id),
        ]);
        log('init#patient: %O', patient);

        this.configRIS = this.$activeOrganization.configRIS || {};
        log('init#configRIS: %O', this.configRIS);

        this.patient = patient;
        log('init#patient: %O', this.patient);
        log('init#diagnosticTest: %O', this.diagnosticTest);

        genericAssign(RIS_ORDER_TEST_MODEL_MAPPINGS,
          this.orderTest, this.orderTestModel);
        log('init#orderTest: %O', this.orderTest);
        log('init#orderTestModel: %O', this.orderTestModel);

        // prefill estimatedReleaseAt if null
        // based on service normal time
        const normalTime = this.orderTest?.test?.service?.normalTime;
        if (!this.orderTestModel.estimatedReleaseAt && normalTime) {
          this.orderTestModel.estimatedReleaseAt = addMilliseconds(Date.now(), normalTime);
        }

        this.resultsModel = _.isEmpty(this.orderTest?.results)
          ? [{ value: null }]
          : [...this.orderTest.results];

        const attachmentURLs = this.orderTest?.attachmentURLs;
        if (attachmentURLs) {
          this.attachmentURLs = [...attachmentURLs];
        }

        const items = await Promise.resolve().then(async () => {
          const query = {
            facility: this.$activeOrganization.id,
            type: 'imaging-result',
            $sort: { name: 1 },
            hiddenAt: { $exists: false },
          };
          // TODO: configure pagination
          const result = await this.$sdk.service('form-templates').find(query);
          return result.items;
        });
        log('init#imagingTemplates#items: %O', items);
        this.fetchedImagingTemplates = items;

        this.resultHTML = this.resultsModel[0].value;
        log('init#resultsModel: %O', this.resultsModel);
      } catch (error) {
        console.error(error);
        log('init#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    getActionText (action) {
      const i = this.baseFilterItems.findIndex(x => x.action === action);
      return i > -1 ? this.baseFilterItems[i].name : _.startCase(action);
    },
    prettifyRoles (roles) {
      return _.map(roles, _.startCase)
        .join(', ');
    },
    async generateSpecimenId () {
      if (_.isEmpty(this.$id)) return;
      if (this.readOnly) return;
      if (!_.isEmpty(this.orderTestModel.specimen)) {
        const confirm = await this.$refs.confirmDialog.open(
          'Overwrite Control ID',
          'Do you want to overwrite the control ID? The old ID will be lost after generating a new one.',
          {
            primaryAction: 'Overwrite',
            primaryColor: 'error',
          }
        );
        if (!confirm) return;
      }
      try {
        if (!this.configRIS.customControlIdEnabled) {
          this.orderTestModel.specimen = generateSpecimenId(this.$id);
        } else {
          const query = {
            organization: this.$activeOrganization.id,
            type: 'ris',
          };
          query.name = this.configRIS.useSectionFixtures ? this.orderTest.sectionCode : 'ris';
          log('generateSpecimenId#query: %O', query);
          const counter = await this.$sdk.service('counters').findOne(query)
            .then(counter => {
              if (!counter) {
                const error = new Error('There is currently no control specimen id set. Kindly check your organization\'s settings and reconfigure.');
                error.name = 'no-config-set';
                throw error;
              }
              // get next value
              return this.$sdk.service('counters').update(counter.id, { $nextValue: true });
            })
            .then(counter => counter.value - counter.valueStep);
          log('generateSpecimenId#counter: %O', counter);

          const payload = {
            controlIdFormat: this.configRIS.customControlIdFormat,
            dateFormat: this.configRIS.customControlIdDateFormat,
            type: 'ris',
            customIdSettings: {
              paddingPosition: this.configRIS.customControlIdPaddingPosition,
              paddingLength: this.configRIS.customControlIdLength,
              paddingCharacter: this.configRIS.customControlIdPaddingCharacter,
              counter,
            },
          };
          if (this.configRIS.useSectionFixtures) payload.sectionCode = this.orderTest.sectionCode;
          this.orderTestModel.specimen = getInjectedValue(payload);
        }
        this.orderTestModel.specimenCollectedAt = Date.now();
        log('generateSpecimenId#specimen: %O', this.orderTestModel.specimen);
        this.$enqueueSnack({
          message: 'Control ID generated successfully.',
          color: 'success',
        });
      } catch (e) {
        if (e.name === 'no-config-set') {
          this.$enqueueSnack({
            message: e.message,
            color: 'error',
          });
        } else {
          this.$enqueueSnack({
            message: 'Something went wrong! Try again.',
            color: 'error',
          });
        }
        log('generateSpecimenId#error: %O', e);
      }
    },
    updateSpecimenCollectedAt () {
      this.orderTestModel.specimenCollectedAt = Date.now();
    },
    selectTemplate (template) {
      this.selectedTemplate = template;
      this.resultHTML = template ? template.template : '';
      log('selectTemplate#resultHTML: %O', this.resultHTML);
    },
    pushAttachment (attachment) {
      log('pushAttachment#attachment', attachment);
      this.attachmentsModel = [
        ...this.attachmentsModel,
        attachment,
      ];
      log('pushAttachment#attachmentsModel', this.attachmentsModel);
    },
    removeAttachmentURL (index) {
      this.attachmentURLs = removeIndex(this.attachmentURLs, index);
    },
    removeAttachmentModel (index) {
      this.attachmentsModel = removeIndex(this.attachmentsModel, index);
    },
    async authenticateAction (action, sendOutCenter) {
      this.pendingValidateAction = action;
      this.sendOutCenter = sendOutCenter;
      this.authDialog = true;
    },
    onReportPrint () {
      this.$router.push({
        name: 'ris-print-test',
        params: { id: this.$id },
      });
    },
    onClaimStubPrint () {
      this.$router.push({
        name: 'ris-print-claim-stub',
        params: { id: _.get(this.orderTest, 'order.id') },
      });
    },
    onSpecimenIdPrint () {
      this.$router.push({
        name: 'ris-print-specimen-id',
        params: { specimen: _.get(this.orderTest, 'specimen') },
      });
    },
    async submit (popRoute = true) {
      try {
        this.loading = true;

        log('submit#orderTestModel: %O', this.orderTestModel);
        log('submit#resultsModel: %O', this.resultsModel);

        const results = [...this.resultsModel];
        const orderTest = {
          ...genericTransform(RIS_MODEL_ORDER_TEST_MAPPINGS, this.orderTestModel),
          results,
        };

        log('submit#orderTest: %O', orderTest);
        log('submit#results: %O', results);

        await this.$store.dispatch('diagnostic/updateOrderTest', { id: this.$id, orderTest });

        // handle attachments
        log('submit#attachmentsModel', this.attachmentsModel);
        if (!_.isEmpty(this.attachmentsModel)) {
          const attachmentURLs = await Promise.all(_.map(
            this.attachmentsModel,
            attachment => this.$store.dispatch('diagnostic/uploadOrderTestAttachment', {
              id: this.$id,
              attachment,
            })
          ));
          log('submit#attachmentURLs', attachmentURLs);
          await this.$store.dispatch('diagnostic/updateOrderTest', {
            id: this.$id,
            orderTest: {
              attachmentURLs: [
                ...this.attachmentURLs,
                ...attachmentURLs,
              ],
            },
          });
        } else {
          await this.$store.dispatch('diagnostic/updateOrderTest', {
            id: this.$id,
            orderTest: {
              attachmentURLs: this.attachmentURLs,
            },
          });
        }

        this.$enqueueSnack({
          message: `Order test successfully ${this.$cruMode}d!`,
          color: 'success',
        });
        if (popRoute) this.$router.go(-1);
      } catch (e) {
        log('submit#error', e);
        this.$enqueueSnack({
          message: 'Something went wrong! Try again.',
          color: 'error',
        });
      } finally {
        log('submit: done');
        this.loading = false;
      }
    },
    async validate ({ accessToken }) {
      try {
        await this.submit(false);
        this.loading = true;

        if (this.pendingValidateAction === 'complete') {
          await this.$store.dispatch('diagnostic/completeOrderTest', { id: this.$id, accessToken });
        } else if (this.pendingValidateAction === 'verify') {
          await this.$store.dispatch('diagnostic/verifyOrderTest', { id: this.$id, accessToken });
        } else if (this.pendingValidateAction === 'finalize') {
          await this.$store.dispatch('diagnostic/finalizeOrderTest', { id: this.$id, accessToken });
        } else if (this.pendingValidateAction === 'cancel') {
          await this.$store.dispatch('diagnostic/cancelOrderTest', { id: this.$id, accessToken });
        } else if (this.pendingValidateAction === 'send-out') {
          const payload = _.get(this.sendOutCenter, 'id') || true;
          await this.$store.dispatch('diagnostic/sendOutOrderTest', {
            id: this.$id,
            payload,
            accessToken,
          });
        }
        this.authDialog = false;
        this.$router.go(-1);
      } catch (e) {
        log('validate#error', e);
        this.$enqueueSnack({
          message: 'Something went wrong! Try again.',
          color: 'error',
        });
      } finally {
        log('validate: done');
        this.loading = false;
      }
    },
    openDrawingboard (urls) {
      this.imgToDrawOn = urls[0];
      this.drawingDialog = true;
    },
    async searchTemplates (searchText) {
      log(`searchTemplates#searchText: ${searchText}`);

      const query = {
        facility: this.$activeOrganization.id,
        type: 'imaging-result',
        hiddenAt: { $exists: false },
        $sort: { name: 1 },
        $limit: 100,
      };

      // configure search
      if (typeof searchText === 'string' && searchText) {
        query.$or = [
          { tags: { $regex: `^${searchText}`, $options: 'i' } },
          { name: { $regex: `^${searchText}`, $options: 'i' } },
        ];
      }

      // execute ops
      const { items } = await this.$sdk.service('form-templates').find(query);
      this.fetchedImagingTemplates = items;
    },
    prettifyTags (tags) {
      return _.map(tags)
        .join(', ');
    },
    searchImagingMembers (searchString) {
      this.$emit('searchImagingMembers', searchString);
    },
    serachRadiologistMembers (searchString) {
      this.$emit('serachRadiologistMembers', searchString);
    },
    searchCardiologist (searchString) {
      this.$emit('searchCardiologist', searchString);
    },
    searchSonologist (searchString) {
      this.$emit('searchSonologist', searchString);
    },
  },
};
</script>

<style scoped>
.mc-border {
  border: 5px solid #f5f5f5;
}

.bordered-toolbar {
  border-top: 1px solid rgba(0,0,0,0.12);
  border-left: 1px solid rgba(0,0,0,0.12);
  border-right: 1px solid rgba(0,0,0,0.12);
}

.result-preview {
  border: 1px solid rgba(0,0,0,0.12);
  padding: 10px;
  min-height: 600px
}

.mc-attachment {
  object-fit: cover;
}
</style>
