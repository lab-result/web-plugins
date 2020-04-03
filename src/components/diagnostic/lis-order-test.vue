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
            v-list-tile(v-if="!areResultsRedacted" @click="onReportPrint")
              v-list-tile-title Print Report
            v-list-tile(@click="onClaimStubPrint")
              v-list-tile-title Print Claim Stub
            v-list-tile(@click="onSpecimenIdPrint")
              v-list-tile-title Print Specimen ID
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
          //- metadata
          v-layout(row wrap)
            v-flex(xs12 md6).pa-1
              v-text-field(
                :value="testReason"
                label="Test Reason"
                outline
                readonly
              )
            v-flex(xs12 md6).pa-1
              v-text-field(
                :value="requestingPhysician"
                label="Requesting Physician"
                outline
                readonly
              )

          v-layout(row wrap)
            v-flex(xs12 md4).pa-1
              v-layout(row align-center)
                v-text-field(
                  v-model="orderTestModel.specimen"
                  label="Specimen ID"
                  outline
                  :readonly="readOnly"
                  append-icon="mdi-plus"
                  @change="updateSpecimenCollectedAt"
                  @click:append="generateSpecimenId"
                )

            v-flex(xs12 md4).pa-1
              v-layout(row align-center)
                v-text-field(
                  v-model="orderTestModel.specimenNote"
                  label="Specimen Note"
                  outline
                  :readonly="readOnly"
                )

            v-flex(xs12 md4).pa-1
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
            v-flex(xs12 md6).pa-1
              generic-search(
                v-model="orderTestModel.technician"
                :items="labMembers"
                item-text="name"
                item-value="uid"
                label="Select Technologist"
                outline
                slotted
                :read-only="readOnly"
                @search="searchLabMembers"
                no-filter
              ).my-2
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
            v-flex(xs12 md6).pa-1
              generic-search(
                v-model="orderTestModel.pathologist"
                :items="pathologistMembers"
                item-text="name"
                item-value="uid"
                label="Select Pathologist"
                outline
                slotted
                :read-only="readOnly"
                @search="searchPathologistMembers"
                no-filter
              ).my-2
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

          //- results
          template(v-if="areResultsRedacted")
            div.mb-3.mt-3
              v-card
                v-card-text.text-xs-center
                  h3 This Record is Whitelisted.
                  p You have no permission to view or make changes to this file.
          template(v-else)
            lis-test-results(
              :read-only="readOnly"
              :results.sync="resultsModel"
              :html-results.sync="htmlResultsModel"
              :order-test="orderTest"
              :patient="patient"
              :diagnostic-test="diagnosticTest"
              :lab-templates="labReportTemplates"
              @searchLabReportTemplates="searchLabReportTemplates"
            ).my-4

          //- attachments
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

          v-layout(row)
            v-flex(xs12)
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
import LisTestResults from './lis-test-results';
import PatientDetails from '../patient/details';
import ImgPickropper from '../commons/img-pickropper';
import GenericSearch from '../commons/generic-search';
import DatePickerMenu from '../commons/date-picker-menu';
import AuthenticateDialog from '../dialogs/authenticate';
import AsyncConfirmDialog from '../commons/async-confirm-dialog';
import CenterPickerDialog from './diagnostic-center-picker-dialog';
import DrawingDialog from '../medical-records/attachment/draw-dialog';
import DiagnosticOrderTestAttachment from './diagnostic-order-test-attachment';
// constants
import {
  STATUS_COLOR_MAP,
  LIS_COMPLETE_ROLES,
  LIS_VERIFY_ROLES,
  LIS_FINALIZE_ROLES,
  LIS_CANCEL_ROLES,
  LIS_ORDER_TEST_MODEL_MAPPINGS,
  LIS_MODEL_ORDER_TEST_MAPPINGS,
  ORDER_TEST_ACTIONS,
  BREAKDOWN_ERROR,
} from './constants';
// utils
import _ from 'lodash';
import cruMixin from '../../mixins/cru';
import { removeIndex } from '../../utils/list';
import { format, addMilliseconds } from 'date-fns';
import { getPatient } from '../../services/patients';
import { permitRoles } from '../../utils/permissions';
import { generateSpecimenId, getInjectedValue } from './utils';
import { genericAssign, genericTransform } from '../../utils/obj';
import { initLogger } from '../../utils/store';

const log = initLogger('LisOrderTest');

export default {
  components: {
    DrawingDialog,
    AuthenticateDialog,
    ImgPicker,
    GenericSearch,
    DatePickerMenu,
    ImgPickropper,
    AsyncConfirmDialog,
    LisTestResults,
    CenterPickerDialog,
    DiagnosticOrderTestAttachment,
    PatientDetails,
    YesOrNo,
  },
  mixins: [cruMixin],
  props: {
    user: {
      type: Object,
      default: undefined,
    },
    labMembers: {
      type: Array,
      default: undefined,
    },
    pathologistMembers: {
      type: Array,
      default: undefined,
    },
    labReportTemplates: {
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
        pathologist: null,
        remarks: null,
      },
      attachmentURLs: [],
      attachmentsModel: [],
      resultsModel: [],
      htmlResultsModel: [],
      sendOutCenter: null,
      sendOutDialog: false,
      authDialog: false,
      goBackDialog: false,
      drawingDialog: false,
      imgToDrawOn: '',
      pendingValidateAction: null,
      configLIS: {},
      // NOTE: moved from settings store
      labTemplates: [],
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
    patientId () {
      return _.get(this.orderTest, 'patient.id');
    },
    areResultsRedacted () {
      return _.get(this.orderTest, '$resultsRedacted');
    },
    canComplete () {
      if (this.areResultsRedacted) return false;

      const isPrivileged = permitRoles(this.$activeMembership, LIS_COMPLETE_ROLES);

      return isPrivileged && this.status === 'pending';
    },
    canVerify () {
      if (this.areResultsRedacted) return false;

      const isPrivileged = permitRoles(this.$activeMembership, LIS_VERIFY_ROLES);
      const isUnverified = this.status === 'pending' ||
        this.status === 'completed';

      return isPrivileged && isUnverified;
    },
    canFinalize () {
      if (this.areResultsRedacted) return false;

      const isPrivileged = permitRoles(this.$activeMembership, LIS_FINALIZE_ROLES);
      const isUnfinalized = this.status === 'pending' ||
        this.status === 'completed' ||
        this.status === 'verified';

      return isPrivileged && isUnfinalized;
    },
    canCancel () {
      if (this.areResultsRedacted) return false;

      const isPrivileged = permitRoles(this.$activeMembership, LIS_CANCEL_ROLES);
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
  },
  created () {
    this.init();
  },
  methods: {
    async init () {
      try {
        this.loading = true;

        log('init#id: ', this.$id);
        this.orderTest = await this.$store.dispatch('diagnostic/getOrderTest', this.$id);
        log('init#orderTest: %O', this.orderTest);

        const [patient] = await Promise.all([
          getPatient(this.$sdk, { id: this.patientId }),
          this.$store.dispatch('diagnostic/getDiagnosticTest', this.orderTest.test.id),
          Promise.resolve().then(async () => {
            const query = {
              facility: this.$activeOrganization.id,
              type: 'lab-result',
              $sort: { name: 1 },
            };
            // TODO: configure pagination
            // execute ops
            const result = await this.$sdk.service('form-templates').find(query);
            this.labTemplates = result.items;
          }),
        ]);

        this.configLIS = this.$activeOrganization.configLIS || {};
        log('init#configLIS: %O', this.configLIS);

        this.patient = patient;
        const members = this.$store.state.organizations.activeOrganizationMembers;
        log('init#patient: %O', this.patient);
        log('init#members: %O', members);
        log('init#diagnosticTest: %O', this.diagnosticTest);

        genericAssign(LIS_ORDER_TEST_MODEL_MAPPINGS,
          this.orderTest, this.orderTestModel);
        log('init#orderTest: %O', this.orderTest);
        log('init#orderTestModel: %O', this.orderTestModel);

        // prefill estimatedReleaseAt if null
        // based on service normal time
        const normalTime = this.orderTest?.test?.service?.normalTime;
        if (!this.orderTestModel.estimatedReleaseAt && normalTime) {
          this.orderTestModel.estimatedReleaseAt = addMilliseconds(Date.now(), normalTime);
        }

        const combinedResultsModel = this.diagnosticTest?.measures?.map(measure => ({
          value: null,
          sivalue: null,
          test: this.diagnosticTest.id,
          ...this.getResult(measure) || {},
          measure,
        }));
        this.resultsModel = combinedResultsModel
          ?.filter(r => r.measure?.type !== 'html');
        this.htmlResultsModel = combinedResultsModel
          ?.filter(r => r.measure?.type === 'html');

        log('init#resultsModel: %O', this.resultsModel);
        log('init#htmlResultsModel: %O', this.htmlResultsModel);

        const attachmentURLs = this.orderTest?.attachmentURLs;
        if (attachmentURLs) {
          this.attachmentURLs = [...attachmentURLs];
        }
        log('init#attachmentURLs: %O', attachmentURLs);
      } catch (error) {
        console.error(error);
        log('init#error');
      } finally {
        this.loading = false;
      }
    },
    getActionText (action) {
      const i = this.baseFilterItems.findIndex(x => x.action === action);
      return i > -1 ? this.baseFilterItems[i].name : _.startCase(action);
    },
    getResult (measure) {
      return _.find(this.orderTest.results, r => r.measure.id === measure.id);
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
          'Overwrite Specimen ID',
          'Do you want to overwrite the specimen ID? The old ID will be lost after generating a new one.',
          {
            primaryAction: 'Overwrite',
            primaryColor: 'error',
          }
        );
        if (!confirm) return;
      }
      try {
        if (!this.configLIS.customControlIdEnabled) {
          this.orderTestModel.specimen = generateSpecimenId(this.$id);
        } else {
          const query = {
            organization: this.$activeOrganization.id,
            type: 'lis',
          };
          const counter = await this.$sdk.service('counters').findOne(query)
            .then(counter => {
              if (!counter) {
                const error = new Error('There is currently no custom specimen id set. Kindly check your organization\'s settings and reconfigure.');
                error.name = 'no-config-set';
                throw error;
              }
              // get next value
              return this.$sdk.service('counters').update(counter.id, { $nextValue: true });
            })
            .then(counter => counter.value - counter.valueStep);
          log('generateSpecimenId#counter: %0', counter);
          this.orderTestModel.specimen = getInjectedValue(
            {
              controlIdFormat: this.configLIS.customControlIdFormat,
              dateFormat: this.configLIS.customControlIdDateFormat,
              type: 'lis',
              customIdSettings: {
                paddingPosition: this.configLIS.customControlIdPaddingPosition,
                paddingLength: this.configLIS.customControlIdLength,
                paddingCharacter: this.configLIS.customControlIdPaddingCharacter,
                counter,
              },
            }
          );
        }
        this.orderTestModel.specimenCollectedAt = Date.now();
        log('generateSpecimenId#specimen', this.orderTestModel.specimen);
        this.$enqueueSnack({
          message: 'Specimen ID generated successfully.',
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
        name: 'lis-print-test',
        params: { id: this.$id },
      });
    },
    onClaimStubPrint () {
      this.$router.push({
        name: 'lis-print-claim-stub',
        params: { id: _.get(this.orderTest, 'order.id') },
      });
    },
    onSpecimenIdPrint () {
      this.$router.push({
        name: 'lis-print-specimen-id',
        params: { specimen: _.get(this.orderTest, 'specimen') },
      });
    },
    validateBreakdown () {
      const breakdownResults = _.filter(
        this.resultsModel,
        r => r.measure.type === 'numeric-breakdown'
      );
      log('validateBreakdown#breakdownResults: %O', breakdownResults);

      // vacuous truth: the set of no results is valid
      // to allow user to proceed if the breakdown results are unanswered
      if (_.every(breakdownResults, r => _.isEmpty(r.value))) return true;

      const grouped = _.reduce(breakdownResults, (acc, result) => {
        const key = result.measure.set;
        if (!acc[key]) acc[key] = [];
        acc[key].push(result);
        return acc;
      }, {});
      log('validateBreakdown#grouped: %O', grouped);

      for (const key of Object.keys(grouped)) {
        const results = grouped[key];
        if (_.every(_.map(results, 'value'), _.isNil)) continue;

        const total = _.reduce(results, (acc, r) => acc + +r.value, 0);
        const min = _.get(results, '[0].measure.numericBreakdownMin');
        const max = _.get(results, '[0].measure.numericBreakdownMax');
        log('validateBreakdown#total: %O', total);
        log('validateBreakdown#min: %O', min);
        log('validateBreakdown#max: %O', max);

        // check if within threshold of acceptable error
        // TODO: annotate with math behind this checking
        const isWithinMin = !_.isNil(min) && (total - +min + BREAKDOWN_ERROR) >= 0;
        const isWithinMax = !_.isNil(max) && (total - +max - BREAKDOWN_ERROR) <= 0;
        const isBelowMin = !isWithinMin;
        const isAboveMax = !isWithinMax;
        log('validateBreakdown#isBelowMin: %O', isBelowMin);
        log('validateBreakdown#isAboveMax: %O', isAboveMax);

        if (isBelowMin || isAboveMax) {
          const range = min === max
            ? min
            : `range: ${min} - ${max}`;
          this.$enqueueSnack({
            message: `${key} must add up to ${range}.`,
            color: 'warning',
          });
          return false;
        }
      }

      return true;
    },
    async submit (popRoute = true) {
      if (popRoute) {
        if (!this.validateBreakdown()) return;
      }

      try {
        this.loading = true;

        log('submit#orderTestModel: %O', this.orderTestModel);
        log('submit#resultsModel: %O', this.resultsModel);
        log('submit#htmlResultsModel: %O', this.htmlResultsModel);

        const combinedResultsModel = _.concat(
          this.resultsModel,
          this.htmlResultsModel
        );
        const results = _.filter(combinedResultsModel,
          r => !_.isNil(r.value) || !_.isNil(r.sivalue))
          .map(r => ({ ...r, measure: r.measure.id }));
        const orderTest = {
          ...genericTransform(LIS_MODEL_ORDER_TEST_MAPPINGS, this.orderTestModel),
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
        if (!this.validateBreakdown()) return;
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
    searchLabMembers (searchString) {
      this.$emit('searchLabMembers', searchString);
    },
    searchPathologistMembers (searchString) {
      this.$emit('searchPathologistMembers', searchString);
    },
    searchLabReportTemplates (searchString) {
      this.$emit('searchLabReportTemplates', searchString);
    },
  },
};
</script>

<style scoped>
  .mc-border {
    border: 5px solid #f5f5f5;
  }

.mc-attachment {
  object-fit: cover;
}
</style>
