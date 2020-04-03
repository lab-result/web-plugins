<template lang="pug">
  div
    v-card(:color="isCurrent ? 'error' : '#f5f5f5'")
      v-toolbar(flat dense v-if="isCurrent" color="error")
        h3.white--text CURRENT ENCOUNTER
        v-spacer
        v-tooltip(bottom)
          v-btn(icon slot="activator" @click="refetchCurrent")
            v-icon.white--text mdi-refresh
          | Fetch new records
      v-toolbar(flat dense v-else)
        b.primary--text {{enc.finishedAt | morph-date('MMM. DD, YYYY hh:mm A')}}
        v-chip {{enc | encounter-timestamp}}
        v-spacer
        template(v-if="!hideBillInvoice")
          v-tooltip(bottom)
            v-btn(icon slot="activator" @click="viewInvoice")
              v-icon.error--text mdi-cash-usd
            | View {{ invoiceTerminology }}
        v-tooltip(bottom)
          v-btn(icon slot="activator" @click="historyDialog = true")
            v-icon mdi-format-list-checkbox
          | View record logs
      v-card-text.white.pa-0
        v-layout(row wrap)
          v-flex(xs12 v-if="enc.facilityData && enc.facilityData.name").pl-2.pt-2
            h5.primary--text Clinic:
            span {{ (enc.facilityData || {}).name }}
        div.pa-2
          //- NON-DOCTOR SECTION
          lab-test-order-group(:records="getNonDoctorRecords('lab-test-order')" :patient="patientData")

    encounter-logs-dialog(
      :dialog="historyDialog"
      :encounter="encounter"
      @close="historyDialog = $event"
    )
</template>

<script>
// components
import LabTestOrderGroup from './lab-test-order-group';
import EncounterLogsDialog from '../../../dialogs/encounter-logs';
// utils
import _ from 'lodash';
import ms from 'pretty-ms';
import { differenceInMilliseconds } from 'date-fns';
import { initLogger } from '../../../../utils/logger';
import { getPatient } from '../../../../services/patients';
import { getCurrentEncounter } from '../../../../services/encounters';

const log = initLogger('PreviousPerVisitViewTimelineItem');

export default {
  components: {
    LabTestOrderGroup,
    EncounterLogsDialog,
  },
  filters: {
    encounterTimestamp (encounter) {
      const { createdAt, finishedAt } = encounter;
      if (!createdAt || !finishedAt) return '-';

      const diff = differenceInMilliseconds(finishedAt, createdAt);
      return ms(diff);
    },
  },
  props: {
    patient: {
      type: Object,
      default: undefined,
    },
    encounter: {
      type: Object,
      default: undefined,
    },
    hideBillInvoice: {
      type: Boolean,
      default: undefined,
    },
    expandOnStart: {
      type: Boolean,
      default: undefined,
    },
    fetchEncounterOnStart: {
      type: Boolean,
      default: undefined,
    },
    isCurrent: {
      type: Boolean,
      default: undefined,
    },
  },
  data () {
    return {
      panel: [],
      loading: false,
      historyDialog: false,
      enc: {},
      patientData: null,
    };
  },
  computed: {
    /**
     * Create an array of unique doctors and providers
     * from encounter's `doctors` and `providers` objects.
     * Also adding the field `isDoctor {Boolean}`.
     */
    encounterProviders () {
      let doctors = this.enc?.doctors;
      const showOwnRecords = this.$activeOrganization?.configEMR?.showOwnRecords;
      if (this.isCurrent && showOwnRecords && this.$currentUser.isDoctor) {
        doctors = doctors?.filter(obj => obj.id === this.$currentUser.uid);
      }
      if (_.isEmpty(doctors)) return [];
      return doctors?.map(obj => ({
        ...obj,
        isDoctor: true,
      }))?.sort((a, b) => b.isDoctor - a.isDoctor);
    },
    // NOTE: might bring back. Don't remove yet.
    // encounterProviders () {
    //   const doctors = _.get(this.encounter, 'doctors');
    //   const providers = _.get(this.encounter, 'providers');
    //   if (_.isEmpty(providers)) return [];
    //   return providers.map(obj => ({
    //     ...obj,
    //     isDoctor: !!doctors.find(doctor => doctor.id === obj.id)
    //   })).sort((a, b) => b.isDoctor - a.isDoctor);
    // },
    organization () {
      return this.$activeOrganization || {};
    },
    languagesConfig () {
      return this.organization?.configFacility?.languages;
    },
    invoiceTerminology () {
      return this.languagesConfig?.billingInvoice || 'Invoice';
    },
    expanded () {
      return !_.isEmpty(this.panel);
    },
    chiefComplaint () {
      const { medicalRecordsArrNonDoctor } = this.enc || {};
      const record = medicalRecordsArrNonDoctor?.find(record => record.type === 'chief-complaint');
      if (_.isEmpty(record)) return { text: '' };
      return record;
    },
    hpi () {
      const { medicalRecordsArrNonDoctor } = this.enc || {};
      const record = medicalRecordsArrNonDoctor?.find(record => record.type === 'hpi');
      if (_.isEmpty(record)) return { text: '' };
      return record;
    },
    medicalRecordsArrNonDoctor () {
      const { medicalRecordsArrNonDoctor } = this.enc || {};
      return medicalRecordsArrNonDoctor || [];
    },
    medicalRecordsGroupedNonDoctor () {
      const { medicalRecordsGroupedNonDoctor } = this.enc || {};
      return medicalRecordsGroupedNonDoctor || {};
    },
    specialtyFeats () {
      return _.flatten([
        this.medicalRecordsGrouped['ent-note'],
        this.medicalRecordsGrouped['ob-note'],
      ]);
    },
  },
  mounted () {
    if (this.expandOnStart) this.panel.push(true);
  },
  async created () {
    await this.init();
  },
  methods: {
    getNonDoctorRecords (type) {
      if (_.isEmpty(this.medicalRecordsArrNonDoctor)) return [];
      return this.medicalRecordsArrNonDoctor.filter(r => r.type === type);
    },
    async init () {
      this.enc = this.encounter;
      this.panel = this.encounterProviders?.map(() => false);
      await this.fetchPatient();
      if (this.fetchEncounterOnStart) {
        log('fetchEncounterOnStart');
        if (this.isCurrent) await this.getCurrentEncounter();
        else await this.fetchEncounter();
      }
    },
    async fetchPatient () {
      try {
        if (!_.isEmpty(this.patient)) {
          this.patientData = this.patient;
        } else if (this.encounter?.patient) {
          const id = this.encounter.patient;
          this.patientData = await getPatient(this.$sdk, { id });
        }
      } catch (error) {
        console.error(error);
        log('fetchPatient#error');
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async togglePanel () {
      try {
        if (_.isEmpty(this.panel)) {
          this.loading = true;
          this.panel.push(true);
          await this.fetchEncounter();
        } else {
          this.panel.pop();
        }
      } catch (error) {
        log('togglePanel#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchEncounter () {
      try {
        this.loading = true;
        const query = {
          id: this.encounter.id,
          $populate: {
            facilityData: {
              service: 'organizations',
              localKey: 'facility',
              method: 'findOne',
              $select: ['name'],
            },
            doctors: {
              service: 'personal-details',
              localKey: 'doctors',
              method: 'find',
            },
            providers: {
              service: 'personal-details',
              localKey: 'providers',
              method: 'find',
            },
            medicalRecords: {
              service: 'medical-records',
              idField: 'encounter',
              method: 'find',
              key: 'id',
              $populate: {
                template: {
                  service: 'form-templates',
                  localKey: 'template',
                  method: 'get',
                },
                createdByDetails: {
                  service: 'personal-details',
                  idField: 'id',
                  method: 'findOne',
                  key: 'createdBy',
                },
                createdByMembership: {
                  service: 'organization-members',
                  idField: 'uid',
                  method: 'findOne',
                  key: 'createdBy',
                },
                medicalProcedureProviders: {
                  service: 'personal-details',
                  method: 'find',
                  localKey: 'providers',
                  foreignKey: 'id',
                },
                ref: {
                  service: 'services',
                  method: 'get',
                  localKey: 'ref',
                },
                tests: {
                  service: 'diagnostic-tests',
                  method: 'find',
                  localKey: 'tests',
                  extractKey: 'id',
                  foreignKey: 'id',
                },
                measures: {
                  service: 'diagnostic-measures',
                  method: 'find',
                  localKey: 'tests',
                  extractKey: 'id',
                  foreignKey: 'test',
                },
                results: {
                  service: 'medical-records',
                  method: 'find',
                  localKey: 'id',
                  foreignKey: 'order',
                  type: {
                    $in: ['lab-test-result', 'imaging-test-result'],
                  },
                  $populate: {
                    tests: {
                      service: 'diagnostic-tests',
                      method: 'find',
                      localKey: 'results',
                      extractKey: 'test',
                      foreignKey: 'id',
                    },
                    measures: {
                      service: 'diagnostic-measures',
                      method: 'find',
                      localKey: 'results',
                      extractKey: 'measure',
                      foreignKey: 'id',
                    },
                  },
                },
                service: {
                  service: 'services',
                  method: 'findOne',
                  localKey: 'service',
                  foreignKey: 'id',
                },
              },
            },
          },
        };
        const item = await this.$sdk.service('medical-encounters').findOne(query);
        log('fetchEncounter#item: %O', item);
        const medicalRecordsArrNonDoctor = item?.$populated?.medicalRecords
          ?.filter(record => record.providerType !== 'doctor');
        this.enc = {
          ...item,
          facilityData: item?.$populated?.facilityData,
          medicalRecordsArr: item?.$populated.medicalRecords,
          medicalRecordsGrouped: _.groupBy(item?.$populated?.medicalRecords, 'type'),
          attendingDoctors: item?.$populated?.doctors?.map(doc => ({ name: doc.name })),
          doctors: item?.$populated?.doctors,
          providers: item?.$populated?.providers,
          medicalRecordsArrNonDoctor: medicalRecordsArrNonDoctor,
          medicalRecordsGroupedNonDoctor: _.groupBy(medicalRecordsArrNonDoctor, 'type'),
        };
        log('fetchEncounter#enc: %O', this.enc);
      } catch (error) {
        log('fetchEncounter#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async viewInvoice () {
      try {
        this.loading = true;
        if (_.isEmpty(this.encounter.invoice)) {
          await this.$sdk.service('medical-encounters')
            .update(this.encounter.id, { invoice: true });
        }
        this.$router.push({
          name: 'end-encounter',
          params: {
            invoice: this.encounter.id,
          },
        });
      } catch (error) {
        log('viewInvoice#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async refetchCurrent () {
      this.$emit('refetchCurrent');
    },
    async getCurrentEncounter () {
      try {
        this.loading = true;
        const showOwnRecords = _.get(this.$activeOrganization, 'configEMR.showOwnRecords');
        const showOwnRecordsQuery = {
          showOwnRecords: true,
          createdByUID: this.$currentUser.uid,
          isDoctor: this.$currentUser.isDoctor,
        };
        let query = {
          patient: this.patient?.id,
          facility: this.$activeOrganization.id,
        };
        if (showOwnRecords && !this.isNurse) {
          // This query will add the restriction to
          // view other doctor's records.
          query = {
            ...query,
            ...showOwnRecordsQuery,
          };
        }
        this.enc = await getCurrentEncounter(this.$sdk, this.$store.commit, query);
        log('getCurrentEncounter#enc: %O', this.enc);
      } catch (error) {
        log('getCurrentEncounter#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again',
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
