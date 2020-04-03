<template lang="pug">
  div
    loader-dialog(ref="loaderDialog")
    async-confirm-dialog(ref="confirmDialog")
    v-layout(v-if="!hasOrders" column align-center).my-5
      img(src="@/assets/images/logo-placeholder.svg")
      h2.my-1 No Pending Orders
      h5 You can call the next patient by clicking the Next button.
    v-timeline(v-else align-top dense)
      v-timeline-item(
        v-for="order in ordersModel"
        :key="order.id"
        :color="readOnly ? '' : 'primary'"
        small
      ).pr-3
        v-card(:color="readOnly ? null : 'primary'" )
          v-card-title
            h3(:class="{ 'grey--text': readOnly, 'white--text': !readOnly }")
              | {{orderType}} Order:
              | {{order.createdAt | morph-date('MMM DD, YYYY, hh:mm A')}}
          v-card-text.white
            v-layout(row wrap)
              v-flex(xs12 md4 v-if="order.reason").pa-1
                h5.grey--text Diagnosis/Reason for Test
                p {{order.reason}}
              v-flex(xs12 md4 v-if="getTags(order)").pa-1
                h5.grey--text Exam Type
                p {{ getTags(order) }}
              v-flex(xs12 md4 v-if="order.requestingPhysician").pa-1
                h5.grey--text Requesting Physician
                p {{order.requestingPhysician}}

            h3(:class="{ 'grey--text': readOnly }") Tests
            v-layout(
              v-for="(orderTest, index) in order.tests"
              :key="orderTest.id"
              row
              wrap
            )
              v-flex(xs12).pa-1
                v-layout(row)
                  v-flex(xs6)
                    h3(:class="{ 'grey--text': readOnly }").mc-margin
                      | {{index + 1}}. {{orderTest.test.name}}
                  v-flex(v-if="!readOnly" xs6).text-xs-right
                    v-tooltip(bottom)
                      | More options
                      v-menu(slot="activator" left offset-y)
                        v-btn(icon slot="activator")
                          v-icon mdi-dots-vertical
                        v-list
                          v-list-tile(@click="onUpdate(orderTest)")
                            v-list-tile-action
                              v-icon mdi-pencil
                            v-list-tile-content
                              v-list-tile-title Update
                          v-list-tile(@click="onClaimStubPrint(order)")
                            v-list-tile-action
                              v-icon mdi-printer
                            v-list-tile-content
                              v-list-tile-title Print Claim Stub
                          v-list-tile(@click="onSpecimenIdPrint(orderTest)")
                            v-list-tile-action
                              v-icon mdi-printer
                            v-list-tile-content
                              v-list-tile-title Print {{ type === 'radiology' ? 'Control' : 'Specimen' }} ID
                  v-spacer

              v-flex(xs12 md6).pa-1
                v-layout(row)
                  v-text-field(
                    v-model="orderTest.specimen"
                    :label="`${type === 'radiology' ? 'Control' : 'Specimen'} ID`"
                    outline
                    :disabled="loading || readOnly"
                    append-icon="mdi-plus"
                    @input="onSpecimenInput(orderTest, $event)"
                    @change="onSpecimenChange(orderTest, $event)"
                    @click:append="generateSpecimenId(orderTest)"
                  )

              v-flex(xs12 md6).pa-1
                date-picker-menu(
                  v-model="orderTest.estimatedReleaseAt"
                  label="Est. Release Date"
                  outline
                  datetime
                  :read-only="loading || readOnly"
                  :min="minDate"
                  format="MM/DD/YYYY h:mm A"
                  @input="onFieldInput(orderTest, 'estimatedReleaseAt', $event)"
                  @change="onFieldChange(orderTest, 'estimatedReleaseAt', $event)"
                )
</template>

<script>
// components
import LoaderDialog from '../commons/loader-dialog';
import DatePickerMenu from '../commons/date-picker-menu';
import AsyncConfirmDialog from '../commons/async-confirm-dialog';
// constants
// utils
import _ from 'lodash';
import { format } from 'date-fns';
import { generateSpecimenId, getInjectedValue } from './utils';
import { initLogger } from '../../utils/logger';

const log = initLogger('PendingOrders');

const TYPE_CONSTANTS_MAP = {
  laboratory: {
    text: 'Lab',
    updateRoute: 'lis-test',
    claimStubRoute: 'lis-print-claim-stub',
    specimenIdRoute: 'lis-print-specimen-id',
  },
  radiology: {
    text: 'Imaging',
    updateRoute: 'ris-test',
    claimStubRoute: 'ris-print-claim-stub',
    specimenIdRoute: 'ris-print-specimen-id',
  },
};
const BASE_BOOKKEEPING = { referenceService: 'diagnostic-order-tests' };

export default {
  components: {
    LoaderDialog,
    DatePickerMenu,
    AsyncConfirmDialog,
  },
  props: {
    type: {
      type: String,
      default: undefined,
    },
    patient: {
      type: String,
      default: undefined,
    },
    queueItemId: {
      type: String,
      default: undefined,
    },
    readOnly: Boolean,
  },
  data () {
    return {
      ordersModel: [],
      pendingUpdates: {},
      loading: false,
      debouncedSavePendingUpdate: _.debounce(this.savePendingUpdate, 5000),
      config: {},
    };
  },
  computed: {
    orderType () {
      return _.get(TYPE_CONSTANTS_MAP, [this.type, 'text']);
    },
    minDate () {
      return format(Date.now(), 'YYYY-MM-DD');
    },
    hasOrders () {
      return _.size(this.ordersModel);
    },
    baseBookkeeping () {
      return {
        ...BASE_BOOKKEEPING,
        referenceType: this.type,
      };
    },
    useSectionFixtures () {
      log('useSectionFixture##', _.get(this.$activeOrganization, 'configRIS.useSectionFixtures'));
      return _.get(this.$activeOrganization, 'configRIS.useSectionFixtures');
    },
    orders () {
      return this.$store.state.diagnostic.orders;
    },
  },
  watch: {
    loading (val) {
      if (val) this.$refs.loaderDialog.open('Loading orders...', 'Please Wait');
      else this.$refs.loaderDialog.close();
    },
  },
  created () {
    this.$initLogger('diagnostic-pending-orders');
  },
  mounted () {
    this.fetchOrders();
  },
  beforeDestroy () {
    this.debouncedSavePendingUpdate.cancel();
    this.savePendingUpdate();
  },
  methods: {
    async fetchOrders () {
      this.loading = true;
      try {
        await this.$store.dispatch('diagnostic/getOrders', {
          facility: this.$activeOrganization.id,
          type: this.type,
          forConfirmation: true,
          queryOpts: {
            patient: this.patient,
            $prequery: [
              {
                service: 'diagnostic-order-tests',
                query: {
                  facility: this.$activeOrganization.id,
                  patient: this.patient,
                  type: this.type,
                  forConfirmation: true,
                  cancelledAt: { $exists: false },
                  completedAt: { $exists: false },
                  verifiedAt: { $exists: false },
                  finalizedAt: { $exists: false },
                  sentOutAt: { $exists: false },
                },
                extractKey: 'order',
                resKey: 'id',
                resOps: '$in',
              },
            ],
          },
        });
        log('fetchOrders#orders: %O', this.orders);
        this.ordersModel = _.cloneDeep(this.orders);
        log('fetchOrders#ordersModel: %O', this.ordersModel);

        this.config = this.type === 'radiology'
          ? this.$activeOrganization.configRIS || {}
          : this.$activeOrganization.configLIS || {};
        log('init#config: %O', this.config);
      } catch (error) {
        log('fetchOrders#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    async generateSpecimenId (orderTest) {
      if (this.loading) return;

      try {
        if (!_.isEmpty(orderTest.specimen)) {
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
        this.loading = true;

        const type = this.type === 'radiology' ? 'ris' : 'lis';
        const order = _.find(this.ordersModel, order => order.id === orderTest.order);
        log('generateSpecimenId#order', order);
        let specimen;
        if (type === 'lis') {
          specimen = await this.generateIdForLIS(orderTest);
        } else {
          specimen = await this.generateIdForRIS(orderTest, order);
        }
        log('generateSpecimenId#specimen: %0', specimen);

        _.each(
          order.tests,
          async (test, index) => {
            this.ordersModel[_.findIndex(this.ordersModel, o => o.id === orderTest.order)].tests[index].specimen = specimen;
            await this.$store.dispatch('diagnostic/updateOrderTest', {
              id: test.id,
              orderTest: {
                specimen,
                specimenCollectedAt: Date.now(),
              },
            });
          }
        );
        const bookkeeping = {
          ...this.baseBookkeeping,
          reference: orderTest.id,
          timestamp: Date.now(),
          metadata: { specimen },
        };
        await this.$sdk.service('queue-items').update(this.queueItemId, {
          $addToSet: { bookkeeping },
        });
        log('generateSpecimenId#orderTest: %O', orderTest);
        log('generateSpecimenId#ordersModel: %O', this.ordersModel);
        const typeText = this.type === 'radiology' ? 'Control' : 'Specimen';
        this.$enqueueSnack({
          message: `${typeText} ID Saved!`,
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
        log('generateSpecimenId#error: %0', e);
      }
      this.loading = false;
    },
    async generateIdForRIS (orderTest, order) {
      log('generateIdForRIS', orderTest, order);
      if (!this.config.customControlIdEnabled) return generateSpecimenId(orderTest.id);

      const query = {
        organization: this.$activeOrganization.id,
        type: 'ris',
        name: orderTest.sectionCode,
      };

      if (_.get(this.$activeOrganization, 'configRIS.useSectionFixtures')) {
        query.name = orderTest.sectionCode;
      } else {
        query.name = 'ris';
      }

      const counter = await this.$sdk.service('counters').findOne(query)
        .then(counter => {
          if (!counter) {
            const error = new Error('There is currently no custom control id set. Kindly check your organization\'s settings and reconfigure.');
            error.name = 'no-config-set';
            throw error;
          }
          // get next value
          return this.$sdk.service('counters').update(counter.id, { $nextValue: true });
        })
        .then(counter => counter.value - counter.valueStep);

      const payload = {
        controlIdFormat: this.config.customControlIdFormat,
        dateFormat: this.config.customControlIdDateFormat,
        type: 'ris',
        customIdSettings: {
          paddingPosition: this.config.customControlIdPaddingPosition,
          paddingLength: this.config.customControlIdLength,
          paddingCharacter: this.config.customControlIdPaddingCharacter,
          counter: counter,
        },
      };

      if (_.get(this.$activeOrganization, 'configRIS.useSectionFixtures')) payload.sectionCode = orderTest.sectionCode;

      const specimen = getInjectedValue(payload);

      log('generateIdForRIS#specimen: %0', specimen);
      return specimen;
    },
    async generateIdForLIS (orderTest) {
      log('generateIdForLIS', orderTest);
      if (!this.config.customControlIdEnabled) return generateSpecimenId(orderTest.id);
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
      log('generateIdForLIS#counter', counter);
      const specimen = getInjectedValue(
        {
          controlIdFormat: this.config.customControlIdFormat,
          dateFormat: this.config.customControlIdDateFormat,
          type: 'lis',
          customIdSettings: {
            paddingPosition: this.config.customControlIdPaddingPosition,
            paddingLength: this.config.customControlIdLength,
            paddingCharacter: this.config.customControlIdPaddingCharacter,
            counter,
          },
        }
      );

      return specimen;
    },
    onUpdate (orderTest) {
      log('onUpdate#orderTest: %O', orderTest);
      this.$router.push({
        name: _.get(TYPE_CONSTANTS_MAP, [this.type, 'updateRoute']),
        params: { id: orderTest.id },
      });
    },
    onClaimStubPrint (order) {
      this.$router.push({
        name: _.get(TYPE_CONSTANTS_MAP, [this.type, 'claimStubRoute']),
        params: { id: order.id },
      });
    },
    onSpecimenIdPrint (orderTest) {
      this.$router.push({
        name: _.get(TYPE_CONSTANTS_MAP, [this.type, 'specimenIdRoute']),
        params: { specimen: orderTest.specimen },
      });
    },
    onFieldInput (orderTest, key, value) {
      this.pendingUpdates = _.set(this.pendingUpdates, [orderTest.id, key], value);
      this.debouncedSavePendingUpdate();
    },
    onFieldChange (orderTest, key, value) {
      this.onFieldInput(orderTest, key, value);
      this.debouncedSavePendingUpdate.cancel();
      this.savePendingUpdate();
    },
    onSpecimenInput (orderTest, value) {
      this.onFieldInput(orderTest, 'specimen', value);
      this.onFieldInput(orderTest, 'specimenCollectedAt', Date.now());
    },
    onSpecimenChange (orderTest, value) {
      this.onSpecimenInput(orderTest, value);
      this.debouncedSavePendingUpdate.cancel();
      this.savePendingUpdate();
    },
    async savePendingUpdate () {
      if (_.isEmpty(this.pendingUpdates)) return;

      this.loading = true;
      try {
        const promises = _.flatMap(
          this.pendingUpdates,
          (update, id) => [
            this.$store.dispatch('diagnostic/updateOrderTest', { id, orderTest: update }),
            this.$sdk.service('queue-items').update(id, {
              $addToSet: {
                bookkeeping: {
                  ...this.baseBookkeeping,
                  reference: id,
                  timestamp: Date.now(),
                  metadata: update,
                },
              },
            }),
          ]
        );
        await Promise.all(promises);
        this.$enqueueSnack({
          message: 'Updates saved!',
          color: 'success',
        });
      } catch (error) {
        log('savePendingUpdate#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.pendingUpdates = {};
      this.loading = false;
    },
    async confirmOrderTests () {
      this.loading = true;
      try {
        const ids = _.flatMap(this.ordersModel, o => _.map(o.tests, 'id'));
        log('confirmOrderTests#ids: %O', ids);
        await this.$store.dispatch('diagnostic/confirmOrderTests', { ids });
      } catch (error) {
        log('confirmOrderTests#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    async cancelOrderTests () {
      this.loading = true;
      try {
        const ids = _.flatMap(this.ordersModel, o => _.map(o.tests, 'id'));
        log('cancelOrderTests#ids: %O', ids);
        await this.$store.dispatch('diagnostic/cancelOrderTests', { ids });
      } catch (error) {
        log('cancelOrderTests#error: %O', error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      }
      this.loading = false;
    },
    getTags (order) {
      const tags = [];
      const flatten = _.flatMap(order.tests, 'tags');

      if (!tags) return;
      return _.uniq(flatten).join(', ');
    },
  },
};
</script>

<style scoped>
.timeline-container {
  max-height: 80vh;
  overflow: auto;
}

.margin-top {
  margin-top: 12px;
}
</style>
