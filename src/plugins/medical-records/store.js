import {
  mapSetters,
  normalizePopulated,
  paginateQuery,
  initLogger,
} from '../../utils/store';
import _ from 'lodash';
import { MEDICAL_RECORD_TYPES } from './constants';

export const STORE_NAME = 'medical-records';
const log = initLogger(STORE_NAME);

const currentEncounterRecords = {};

MEDICAL_RECORD_TYPES.forEach(record => {
  currentEncounterRecords[record.type] = [];
  if (record.subtype) currentEncounterRecords[record.subtype] = [];
});

export default class Store {
  constructor (mycure) {
    this.state = {
      hasUnsavedRecords: false,
      currentEncounterRecords,
      medicinesDefaults: [],
      faveMedicines: [],
      medicalRecordsDraft: {},
    };

    this.getters = {};

    this.actions = {
      getMedicalRecords: async (context, {
        patient,
        organization,
        types,
        queryOpts,
        pageNo,
        pageSize,
        latest,
      }) => {
        const query = {
          ...queryOpts,
          patient,
          type: { $in: types },
          $sort: { createdAt: latest ? -1 : 1 },
          $populate: {
            diagnosticTests: {
              service: 'diagnostic-tests',
              method: 'find',
              localKey: 'tests',
              extractKey: 'id',
              foreignKey: 'id',
              foreignOps: '$in',
            },
            createdByDetails: {
              service: 'organization-members',
              method: 'findOne',
              localKey: 'createdBy',
              foreignKey: 'uid',
              organization,
            },
            results: {
              service: 'medical-records',
              method: 'find',
              localKey: 'id',
              foreignKey: 'order',
              $populate: {
                orderDetails: {
                  service: 'medical-records',
                  localKey: 'order',
                  method: 'get',
                },
              },
            },
          },
        };
        log('getMedicalRecords#query: %O', query);

        const { items, total } = await mycure.medical.records()
          .find(paginateQuery({ query, pageNo, pageSize }));
        log(`getMedicalRecords#total: ${total}`);
        log('getMedicalRecords#items: %O', items);

        const normalizedItems = normalizePopulated(items);
        const itemsWithTests = _.map(normalizedItems, item => ({
          ...item,
          tests: _.map(item.tests, test => ({
            ...test,
            test: _.find(_.get(normalizedItems, 'diagnosticTests'), d => d.id === test.id),
          })),
        }));
        log('getMedicalRecords#records: %O', itemsWithTests);

        return { items: itemsWithTests, total };
      },
      searchMedicalRecords: async (context, query) => {
        const { items } = await mycure.medical.records().find(query);
        return items;
      },
      updateMedicalRecordsBatch: async (store, { ids, update }) => {
        if (!ids || !ids.length) throw new Error('No ids provided.');
        await mycure.medical.records().update({ id: { $in: ids } }, update);
      },
      updateSingletonNote: async ({ rootState }, { facility, patient, text }) => {
        log(`updateSingletonNote#text: ${text}`);
        const query = {
          type: 'medical-note',
          patient,
          facility,
        };
        log('updateSingletonNote#query: %O', query);
        const record = await mycure.medical.records().findOne(query);
        log('updateSingletonNote#record: %O', record);
        if (_.isEmpty(record)) {
          log('updateSingletonNote: creating');
          const payload = {
            type: 'medical-note',
            patient,
            facility,
            text,
          };
          const currentUser = _.get(rootState, 'auth.currentUser');
          if (currentUser.isDoctor) {
            payload.provider = currentUser.uid;
          }
          await mycure.medical.records().create(payload);
        } else {
          log('updateSingletonNote#update#query: %O', query);
          await mycure.medical.records().update(query, { text });
        }
      },
      createMedicalRecord: async ({ rootState }, record) => {
        const currentUser = _.get(rootState, 'auth.currentUser');
        if (currentUser.isDoctor) {
          record.provider = currentUser.uid;
        }
        await mycure.medical.records().create(record);
      },
      createMedicalRecords: async ({ state, rootState, commit }, { records, returnResult = false }) => {
        const currentUser = rootState?.auth?.currentUser;
        if (currentUser.isDoctor) {
          records = records?.map(record => ({ ...record, provider: currentUser.uid }));
        }
        // Get newly created records
        const newRecords = await mycure.medical.records().create(records);
        // Get current encouter records
        const currentRecords = state.currentEncounterRecords;
        const promises = [];
        // Fetch the newly created record to
        // get the populated data.
        newRecords.forEach((record) => {
          promises.push(this.fetchRecord(mycure, record.id));
        });
        const result = _.flatten(await Promise.all(promises));
        // Add the newly created records with
        // populated data to current encouter
        // records
        result.forEach(record => {
          if (_.isEmpty(currentRecords[record.type])) {
            currentRecords[record.type] = [];
          }

          currentRecords[record.type].push(record);

          if (record.subtype && _.isEmpty(currentRecords[record.subtype])) {
            currentRecords[record.subtype] = [];
          }

          if (record.subtype) {
            currentRecords[record.subtype].push(record);
          }
        });

        commit('setCurrentEncounterRecords', currentRecords);
        commit('clearMedicalRecordsDraft');

        if (returnResult) {
          return result;
        }
      },
      updateMedicalRecords: async ({ state, commit, rootGetters }, { type, subtype, data }) => {
        const { id, payload } = data;
        await mycure.medical.records().update(id, payload);
        const currentRecords = _.cloneDeep(state.currentEncounterRecords);
        // Fetch the udpated data with populated values
        const updatedRecord = await this.fetchRecord(mycure, id);
        // Replace the old record with the udpated record.
        currentRecords[type] = _.map(currentRecords[type], record => {
          if (record.id === id) return updatedRecord;
          return record;
        });
        currentRecords[subtype] = _.map(currentRecords[subtype], record => {
          if (record.id === id) return updatedRecord;
          return record;
        });
        commit('setCurrentEncounterRecords', currentRecords);
        // Update records in current encounter
        const currentEncounter = rootGetters['encounter/currentEncounter'];

        if (currentEncounter) {
          currentEncounter.medicalRecords = {};
          currentEncounter.medicalRecordsGrouped = {};
          currentEncounter.medicalRecordsArr = [];
          _.forEach(Object.keys(currentRecords), key => {
            if (!_.isEmpty(currentRecords[key])) {
              currentEncounter.medicalRecords[key] = currentRecords[key];
              currentEncounter.medicalRecordsGrouped[key] = currentRecords[key];
              currentRecords[key].forEach(record => currentEncounter.medicalRecordsArr.push(record));
            }
          });
          commit('encounter/setCurrentEncounter', currentEncounter, { root: true });
        }
      },
      updateGenericMedicalRecord: async (context, { id, data }) => {
        await mycure.medical.records().update(id, data);
      },
      createGenericMedicalRecord: async ({ rootState }, { payload, singleton }) => {
        log('createGenericMedicalRecord#payload: %O', payload);
        log(`createGenericMedicalRecord#singleton: ${singleton}`);
        const currentUser = _.get(rootState, 'auth.currentUser');
        if (currentUser.isDoctor && !payload.provider) {
          payload.provider = currentUser.uid;
        }
        // if not singleton, simply create
        if (!singleton) return mycure.medical.records().create(payload);

        // if singleton, decide based on existence of previous record
        const query = { type: payload.type, encounter: payload.encounter };
        const record = await mycure.medical.records().findOne(query);
        log('createGenericMedicalRecord#record: %O', record);

        // if no previous record exists, create one
        if (!record) return mycure.medical.records().create(payload);

        // special case for empty medical-note: remove if empty
        const types = ['medical-note', 'care-plan'];
        const isMedicalNote = types.includes(payload.type);
        log(`createGenericMedicalRecord#isMedicalNote: ${isMedicalNote}`);
        if (isMedicalNote && _.isEmpty(payload.text)) {
          return mycure.medical.records().remove(record.id);
        }

        // singleton record already exists: update in-place
        const update = _.omit(payload, 'type', 'facility', 'patient', 'encounter');
        log('createGenericMedicalRecord#update: %O', update);
        return mycure.medical.records().update(record.id, update);
      },
      saveMedicalRecord: async ({ dispatch, rootState }, { data }) => {
        let id = '';
        if (data.id) {
          id = data.id;
          await mycure.medical.records().update(data.id, _.omit(data, ['id', 'patient']));
        } else {
          const currentUser = _.get(rootState, 'auth.currentUser');
          if (currentUser.isDoctor) {
            data.provider = currentUser.uid;
          }
          const newRecord = await mycure.medical.records().create(data);
          id = newRecord.id;
        }

        await dispatch('encounter/getCurrentEncounter', { patient: data.patient }, { root: true });
        return id;
      },
      removeMedicalRecord: async ({ commit, state, rootGetters }, { data }) => {
        await mycure.medical.records().remove(data.id);

        const removedRecordId = data.id;
        const currentRecords = state.currentEncounterRecords;
        const recordsByType = currentRecords[data.type].filter((record) => record.id !== removedRecordId);
        const recordsBySubtype = data.subtype ? currentRecords[data.subtype].filter((record) => record.id !== removedRecordId) : [];

        currentRecords[data.type] = recordsByType;
        currentRecords[data.subtype] = recordsBySubtype;

        commit('setCurrentEncounterRecords', currentRecords);

        // Update records in current encounter
        const currentEncounter = rootGetters['encounter/currentEncounter'];

        if (currentEncounter) {
          currentEncounter.medicalRecords = {};
          currentEncounter.medicalRecordsGrouped = {};
          currentEncounter.medicalRecordsArr = currentEncounter.medicalRecordsArr.filter((record) => record.id !== removedRecordId);
          _.forEach(Object.keys(currentRecords), key => {
            if (!_.isEmpty(currentRecords[key])) {
              currentEncounter.medicalRecords[key] = currentRecords[key];
              currentEncounter.medicalRecordsGrouped[key] = currentRecords[key];
            }
          });
          commit('encounter/setCurrentEncounter', currentEncounter, { root: true });
        }
      },
      uploadRecordAttachments: async (store, { id, attachments }) => {
        let attachmentURLs = [];
        const promises = [];
        attachments.forEach((attachment) => {
          const obsTask = mycure.medical.records().uploadPic(id, attachment);
          promises.push(obsTask.upload());
        });
        attachmentURLs = await Promise.all(promises);
        return attachmentURLs;
      },
      getRecordsHistory: async (context, { encounter, pageNo }) => {
        const query = {
          encounter,
          $history: true,
          $populate: {
            createdByDetails: {
              service: 'organization-members',
              method: 'findOne',
              localKey: 'createdBy',
              foreignKey: 'uid',
            },
            _createdByDetails: {
              service: 'organization-members',
              method: 'findOne',
              localKey: '_createdBy',
              foreignKey: 'uid',
            },
          },
        };

        const { items } = await mycure.medical.records().find(paginateQuery({ query, pageNo, pageSize: 20 }));
        return items.map(item => {
          const obj = {
            createdByDetails: item.$populated.createdByDetails,
            historyCreatedBy: item.$populated._createdByDetails,
            ...item,
          };
          return _.omit(obj, ['$populated']);
        });
      },
      getAttachments: async (context, { patient, pageNo, pageSize }) => {
        const query = {
          patient,
          type: 'attachment',
          $sort: {
            createdAt: -1,
          },
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
          },
        };

        const result = await mycure.medical.records().find(paginateQuery({ query, pageNo, pageSize }));
        return result;
      },
      getRecordByType: async (context, {
        type,
        subtype,
        patient,
        encounter,
        queryOpts = {},
        dateFilter,
        limit,
        skip,
      }) => {
        const query = {
          type,
          patient,
          ...queryOpts,
          $populate: {
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
          },
        };

        if (subtype) {
          query.subtype = subtype;
        }

        if (encounter) {
          query.encounter = encounter;
        }

        if (dateFilter && dateFilter.start && dateFilter.end) {
          query.createdAt = {
            $gte: dateFilter.start,
            $lte: dateFilter.end,
          };
        }

        if (limit) {
          query.$limit = limit;
        }

        if (skip) {
          query.$skip = skip;
        }

        const data = await mycure.medical.records().find(query);
        return data;
      },
      getLabTestResult: async (context, { patient, facility }) => {
        const query = {
          type: 'lab-test-result',
          patient,
          facility,
          $populate: {
            tests: {
              service: 'diagnostic-tests',
              method: 'find',
              localKey: 'results',
              extractKey: 'test',
              foreignKey: 'id',
              foreignOps: '$in',
            },
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'results',
              extractKey: 'measure',
              foreignKey: 'id',
              foreignOps: '$in',
            },
          },
        };

        const { items } = await mycure.medical.records().find(query);

        const mapped = _.map(items, (item) => {
          const { measures, tests } = item.$populated;
          const results = _.map(item.results, (result) => {
            return {
              ...result,
              test: _.find(tests, (test) => test.id === result.test),
              measure: _.find(measures, (measure) => measure.id === result.measure),
            };
          });
          return {
            ..._.omit(item, ['$populated']),
            results,
          };
        });

        return mapped;
      },
      createLabOrderResults: async ({ rootState }, payload) => {
        const currentUser = _.get(rootState, 'auth.currentUser');
        if (currentUser.isDoctor) {
          payload.provider = currentUser.uid;
        }
        return mycure.medical.records().create(payload);
      },
      /**
       * @param {Object} opts - Options
       * @param {string} opts.id - Diagnostic Order Record ID
       */
      getLabOrderFromRecordId: async (ctx, opts) => {
        const query = {
          order: opts.id,
        };
        return mycure.diagnostic.orders().findOne(query);
      },
      getRecordsByProvider: async (ctx, opts = {}) => {
        const { type, provider, encounter } = opts;
        const query = {
          type,
          encounter,
          $or: [
            { provider },
            { doctor: provider },
            { createdBy: provider },
          ],
          $populate: {
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
          },
        };
        const { items, total } = await mycure.medical.records().find(query);
        return {
          items,
          total,
        };
      },
      clearCurrentEncounterRecords: (ctx, opts) => {
        ctx.commit('clearCurrentEncounterRecords');
      },
    };

    this.mutations = {
      ...mapSetters(Object.keys(_.omit(this.state, ['currentEncounterRecords', 'medicalRecordsDraft']))),
      setCurrentEncounterRecords: (s, val) => {
        MEDICAL_RECORD_TYPES.forEach(record => {
          s.currentEncounterRecords[record.type] = _.get(val, record.type) || [];
        });
      },
      setMedicalRecordsDraft: (s, { type, data }) => {
        s.medicalRecordsDraft[type] = data;
      },
      clearMedicalRecordsDraft: (s) => {
        s.medicalRecordsDraft = {};
      },
      clearCurrentEncounterRecords: (s, val) => {
        console.warn('clearing...');
        s.currentEncounterRecords = currentEncounterRecords;
      },
    };
  }

  fetchRecord (mycure, record) {
    const query = {
      id: record,
      $populate: {
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
      },
    };

    return mycure.medical.records().findOne(query);
  }

  extractModule () {
    return {
      namespaced: true,
      state: this.state,
      getters: this.getters,
      actions: this.actions,
      mutations: this.mutations,
    };
  }
}
