<template lang="pug">
  div.mr-2
    template(v-if="loading")
      v-layout(row justify-center)
        v-flex(xs12 md10).pa-5.text-xs-center
          v-progress-circular(indeterminate color="primary")
          h3.grey--text Loading previous encounter...
    template(v-else)
      v-timeline(
        align-top
        dense
        clipped
      )
        v-timeline-item(
          v-if="hasCurrentEncounter"
          color="primary"
          small
        )
          enc-timeline-item(
            :patient="patientData"
            :encounter="currentEncounter"
            is-current
            @refetchCurrent="fetchCurrentEncounter"
          )
        v-timeline-item(
          color="primary"
          small
          v-for="(encounter, key) in encounters"
          :key="key"
        )
          enc-timeline-item(
            :patient="patientData"
            :encounter="encounter"
            @updated="init"
          )
      v-layout(v-if="canPaginate" row).mt-2
        v-flex(grow).pl-2
          v-btn(
            color="primary"
            flat
            :disabled="!canNext"
            @click="pageNo += 1"
            block
            :loading="paginating"
          ) Load more
</template>

<script>
// components
import EncTimelineItem from './timeline-item';
// constants
// utils
import _ from 'lodash';
import { initLogger } from '../../../../utils/logger';
import { paginateQuery } from '../../../../utils/store';
import { getCurrentEncounter } from '../../../../services/encounters';

export const COMPONENT_NAME = 'EncounterPreviousPerVisitView';
const log = initLogger(COMPONENT_NAME);

export default {
  components: { EncTimelineItem },
  props: {
    patient: {
      type: String,
      default: undefined,
    },
  },
  data () {
    return {
      pageNo: 1,
      pageSize: 5,
      loading: false,
      paginating: false,
      patientData: null,
      encounters: [],
      previousEncountersTotal: 0,
      currentEncounter: {},
    };
  },
  computed: {
    canPaginate () {
      return this.pageSize < this.previousEncountersTotal;
    },
    canPrev () {
      return this.pageNo > 1;
    },
    canNext () {
      return (this.pageNo * this.pageSize) < this.previousEncountersTotal;
    },
    hasCurrentEncounter () {
      return !_.isEmpty(this.currentEncounter);
    },
  },
  watch: {
    pageNo (val) {
      if (val !== 1) this.fetchPastEncounters();
    },
  },
  mounted () {
    this.init();
  },
  methods: {
    async init () {
      this.loading = true;
      this.pageNo = 1;
      this.encounters.splice(0);
      await this.fetchPastEncounters();
      await this.fetchCurrentEncounter();
      this.loading = false;
    },
    async fetchCurrentEncounter () {
      try {
        this.loading = true;
        const showOwnRecords = this.$activeOrganization?.configEMR?.showOwnRecords;
        const showOwnRecordsQuery = {
          showOwnRecords: true,
          createdByUID: this.$currentUser.uid,
          isDoctor: this.$currentUser.isDoctor,
        };
        let query = {
          patient: this.patient,
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

        log('init#query: %O', query);
        this.currentEncounter = await getCurrentEncounter(this.$sdk, this.$store.commit, query);
      } catch (error) {
        log('fetchCurrentEncounter#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message,
          color: 'error',
        });
      } finally {
        this.loading = false;
      }
    },
    async fetchPastEncounters () {
      try {
        this.paginating = true;
        const query = {
          patient: this.patient,
          $sort: { finishedAt: -1 },
          finishedAt: { $exists: true },
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

        const { items, total } = await this.$sdk.service('medical-encounters')
          .find(paginateQuery({ query, pageNo: this.pageNo, pageSize: this.pageSize }));
        log('fetchPastEncounters#items: %O', items);

        const normalizedItems = items?.map(item => {
          const medicalRecordsArrNonDoctor = _.get(item, '$populated.medicalRecords')
            .filter(record => record.providerType !== 'doctor');
          const normalizedItem = {
            createdByDetails: item?.$populated?.createdByDetails,
            facilityData: item?.$populated?.facilityData,
            medicalRecordsArr: item?.$populated?.medicalRecords,
            medicalRecordsGrouped: _.groupBy(item?.$populated?.medicalRecords, 'type'),
            attendingDoctors: item?.$populated?.doctors?.map(doctor => ({ name: doctor.name })),
            doctors: item?.$populated?.doctors,
            providers: item?.$populated?.providers,
            medicalRecordsArrNonDoctor: medicalRecordsArrNonDoctor,
            medicalRecordsGroupedNonDoctor: _.groupBy(medicalRecordsArrNonDoctor, 'type'),
          };
          delete item.$populated;

          return { ...item, ...normalizedItem };
        });
        log('fetchPastEncounters#normalizedItems: %O', normalizedItems);

        // FIXME: eslint errors on forEach
        normalizedItems?.forEach(item => this.encounters.push(item)); // eslint-disable-line
        log('fetchPastEncounters#encounters: %O', this.encounters);
        this.previousEncountersTotal = total;
      } catch (error) {
        log('fetchPastEncounters#error');
        console.error(error);
        this.$enqueueSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'error',
        });
      } finally {
        this.paginating = false;
      }
    },
    async fetchPatient () {
      try {
        const id = this.patient;
        this.patientData = await this.$store.dispatch('patients/getPatient', { id });
      } catch (e) {
        console.error(e);
      }
    },
  },
};
</script>
