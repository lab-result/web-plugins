import _ from 'lodash';
import {
  mapSetters,
  normalizePopulated,
  paginateQuery,
  limitQueryByDate,
  fp,
  initLogger,
} from '../../utils/store';
import { compose } from '../../utils/fn';

export const STORE_NAME = 'diagnostic';

const log = initLogger(STORE_NAME);

export default class Store {
  constructor (sdk) {
    this.state = {
      orders: [],
      ordersTotal: 0,
      orderTests: [],
      orderTestsTotal: 0,
      diagnosticTests: [],
      diagnosticTest: null,
    };

    this.getters = {
      labTests: (s) => {
        return s.diagnosticTests.filter(test => test.type === 'laboratory');
      },
      imagingTests: (s) => {
        return s.diagnosticTests.filter(test => test.type === 'radiology');
      },
    };

    this.actions = {
      getOrders: async ({ commit }, {
        facility,
        forConfirmation = false,
        queryOpts,
        type,
        searchText,
        pageNo,
        pageSize,
      }) => {
        const query = {
          facility,
          type,
          ...queryOpts,
          $sort: { createdAt: -1 },
          $populate: {
            facility: {
              service: 'organizations',
              method: 'get',
              localKey: 'facility',
            },
            patient: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'patient.id',
              foreignKey: 'id',
              $select: ['id', 'name', 'picURL', 'sex', 'dateOfBirth',
                'insuranceCards', 'companies'],
              $populate: {
                hmos: {
                  service: 'organizations',
                  method: 'find',
                  localKey: 'insuranceCards',
                  extractKey: 'insurance',
                  foreignKey: 'id',
                  foreignOps: '$in',
                  type: 'insurance',
                },
                companyPartners: {
                  service: 'insurance-contracts',
                  method: 'find',
                  localKey: 'companies',
                  extractKey: 'company',
                  foreignKey: 'id',
                  foreignOps: '$in',
                  type: 'corporate-partner-facility',
                },
              },
            },
            tests: {
              service: 'diagnostic-order-tests',
              method: 'find',
              localKey: 'id',
              foreignKey: 'order',
              forConfirmation: forConfirmation ? true : { $exists: false },
              cancelledAt: { $exists: false },
              $populate: {
                test: {
                  service: 'diagnostic-tests',
                  method: 'get',
                  localKey: 'test',
                },
                measures: {
                  service: 'diagnostic-measures',
                  method: 'find',
                  localKey: 'results',
                  extractKey: 'measure',
                  foreignKey: 'id',
                  foreignOps: '$in',
                  skipEmpty: true,
                },
                technician: {
                  service: 'personal-details',
                  method: 'get',
                  localKey: 'technician',
                },
                verifiedByDetails: {
                  service: 'personal-details',
                  method: 'get',
                  localKey: 'verifiedBy',
                },
                pathologist: {
                  service: 'personal-details',
                  method: 'get',
                  localKey: 'pathologist',
                },
              },
            },
          },
        };

        if (!_.isEmpty(searchText)) {
          query.$prequeryOr = _.concat(query.$prequeryOr || [], [
            {
              service: 'personal-details',
              extractKey: 'id',
              localKey: 'patient',
              localOps: '$in',
              query: {
                $search: {
                  text: searchText,
                  $limit: pageSize,
                  organization: facility,
                },
              },
            },
          ]);
        }

        log('getOrders#query: %O', query);
        const { items, total } = await sdk.diagnostic.orders()
          .find(paginateQuery({ query, pageNo, pageSize }));

        log('getOrders#items: %O', items);
        const orders = _.map(items, normalizePopulated);

        log(`getOrders#total: ${total}`);
        log('getOrders#orders', orders);
        commit('setOrdersTotal', total);
        commit('setOrders', orders);
      },
      getOrder: async (context, id) => {
        const query = {
          id,
          $populate: {
            facility: {
              service: 'organizations',
              method: 'get',
              localKey: 'facility',
            },
            tests: {
              service: 'diagnostic-order-tests',
              method: 'find',
              localKey: 'id',
              foreignKey: 'order',
              $populate: {
                test: {
                  service: 'diagnostic-tests',
                  method: 'get',
                  localKey: 'test',
                },
              },
            },
          },
        };
        log('getOrder#query: %O', query);
        const item = await sdk.diagnostic.orders().findOne(query);
        const order = normalizePopulated(item);
        log('getOrder#order: %O', order);
        return order;
      },
      getOrderTests: async ({ commit }, {
        facility,
        section,
        patient,
        test,
        forConfirmation = false,
        queryOpts,
        type,
        startDate,
        endDate,
        pageNo,
        pageSize,
      }) => {
        const query = {
          facility,
          section,
          type,
          patient,
          test,
          forConfirmation: forConfirmation ? true : { $exists: false },
          ...queryOpts,
          $sort: { createdAt: -1 },
          $populate: {
            sentOutTo: {
              service: 'organizations',
              method: 'get',
              localKey: 'sentOutTo',
            },
            order: {
              service: 'diagnostic-orders',
              method: 'get',
              localKey: 'order',
            },
            test: {
              service: 'diagnostic-tests',
              method: 'get',
              localKey: 'test',
            },
            patient: {
              service: 'personal-details',
              method: 'get',
              localKey: 'patient',
            },
            technician: {
              service: 'personal-details',
              method: 'get',
              localKey: 'technician',
            },
            pathologist: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'pathologist',
              foreignKey: 'id',
            },
            radiologist: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'radiologist',
              foreignKey: 'id',
            },
            service: {
              service: 'services',
              method: 'get',
              localKey: 'service',
            },
            invoiceItem: {
              service: 'billing-items',
              method: 'get',
              localKey: 'invoiceItem',
            },
          },
        };

        const composeQuery = compose(
          fp.paginateQuery({ pageNo, pageSize }),
          fp.limitQueryByDate({ startDate, endDate }),
        );
        const composedQuery = composeQuery(query);

        log('getOrderTests#query: %O', composedQuery);
        const { items, total } = await sdk.diagnostic.orderTests()
          .find(composedQuery);

        log(`getOrderTests#total: ${total}`);
        log('getOrderTests#items: %O', items.map(normalizePopulated));
        commit('setOrderTestsTotal', total);
        commit('setOrderTests', items.map(normalizePopulated));
      },
      clearOrderTests: async ({ commit }) => {
        commit('setOrderTestsTotal', 0);
        commit('setOrderTests', []);
      },
      getOrderTest: async (context, id) => {
        const query = {
          id,
          $populate: {
            facility: {
              service: 'organizations',
              method: 'get',
              localKey: 'facility',
            },
            sentOutTo: {
              service: 'organizations',
              method: 'get',
              localKey: 'sentOutTo',
            },
            cancelledBy: {
              service: 'personal-details',
              method: 'get',
              localKey: 'cancelledBy',
            },
            order: {
              service: 'diagnostic-orders',
              method: 'get',
              localKey: 'order',
            },
            test: {
              service: 'diagnostic-tests',
              method: 'get',
              localKey: 'test',
              $populate: {
                service: {
                  service: 'services',
                  method: 'findOne',
                  localKey: 'id',
                  foreignKey: 'ref',
                  type: 'diagnostic',
                },
              },
            },
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'results',
              extractKey: 'measure',
              foreignKey: 'id',
            },
            patient: {
              service: 'personal-details',
              method: 'findOne',
              localKey: 'patient',
              foreignKey: 'id',
              $populate: {
                hmos: {
                  service: 'organizations',
                  method: 'find',
                  localKey: 'insuranceCards',
                  extractKey: 'insurance',
                  foreignKey: 'id',
                  foreignOps: '$in',
                  type: 'insurance',
                },
                companyPartners: {
                  service: 'insurance-contracts',
                  method: 'find',
                  localKey: 'companies',
                  extractKey: 'company',
                  foreignKey: 'id',
                  foreignOps: '$in',
                  type: 'corporate-partner-facility',
                },
              },
            },
            technician: {
              service: 'personal-details',
              method: 'get',
              localKey: 'technician',
            },
            pathologist: {
              service: 'personal-details',
              method: 'get',
              localKey: 'pathologist',
            },
            radiologist: {
              service: 'personal-details',
              method: 'get',
              localKey: 'radiologist',
            },
            sonologist: {
              service: 'personal-details',
              method: 'get',
              localKey: 'sonologist',
            },
            cardiologist: {
              service: 'personal-details',
              method: 'get',
              localKey: 'cardiologist',
            },
            verifiedByDetails: {
              service: 'personal-details',
              method: 'get',
              localKey: 'verifiedBy',
            },
          },
        };
        const orderTest = await sdk.diagnostic.orderTests().findOne(query);
        log('getOrderTest#orderTest: %O', orderTest);
        const normalizedOrderTest = {
          ...normalizePopulated(orderTest),
          results: _.map(orderTest.results, r => ({
            ...r,
            measure: _.find(orderTest.$populated.measures, m => r.measure === m.id),
          })),
          ...[
            'technician',
            'pathologist',
            'radiologist',
            'sonologist',
            'cardiologist',
          ].reduce((acc, key) => {
            const val = _.get(orderTest, ['$populated', key]);
            return val ? { ...acc, [key]: { ...val, uid: val.id } } : acc;
          }, {}),
        };
        log('getOrderTest#normalizedOrderTest: %O', normalizedOrderTest);
        return normalizedOrderTest;
      },
      createOrder: async (context, { facility, patient, order }) => {
        const createdOrder = await sdk.diagnostic.orders().create({
          ...order,
          facility,
          patient,
        });
        log('createOrder#createdOrder: %O', createdOrder);

        return createdOrder;
      },
      updateOrderTest: async (context, { id, orderTest }) => {
        await sdk.diagnostic.orderTests().update(id, orderTest);
      },
      completeOrderTest: async (context, { id, accessToken }) => {
        const orderTest = await sdk.diagnostic.orderTests().get(id);
        const update = { complete: true };
        // allow confirming directly by jumping status
        if (_.get(orderTest, 'forConfirmation')) update.$confirm = true;
        await sdk.diagnostic.orderTests().update(id, update, { accessToken });
      },
      verifyOrderTest: async (context, { id, accessToken }) => {
        const orderTest = await sdk.diagnostic.orderTests().get(id);
        const update = { verify: true };
        // allow confirming directly by jumping status
        if (_.get(orderTest, 'forConfirmation')) update.$confirm = true;
        // allow jumping directly to verified status
        if (!_.get(orderTest, 'completedAt')) update.complete = true;

        await sdk.diagnostic.orderTests().update(id, update, { accessToken });
      },
      finalizeOrderTest: async (context, { id, accessToken }) => {
        const orderTest = await sdk.diagnostic.orderTests().get(id);
        const update = { finalize: true };
        // allow confirming directly by jumping status
        if (_.get(orderTest, 'forConfirmation')) update.$confirm = true;
        // allow jumping directly to finalized status
        if (!_.get(orderTest, 'completedAt')) update.complete = true;
        if (!_.get(orderTest, 'verifiedAt')) update.verify = true;

        await sdk.diagnostic.orderTests().update(id, update, { accessToken });
      },
      cancelOrderTest: async (context, { id, accessToken }) => {
        const orderTest = await sdk.diagnostic.orderTests().get(id);
        const update = { cancel: true };
        // allow confirming directly by jumping status
        if (_.get(orderTest, 'forConfirmation')) update.$confirm = true;
        await sdk.diagnostic.orderTests().update(id, update, { accessToken });
      },
      sendOutOrderTest: async (context, { id, accessToken, payload = true }) => {
        const orderTest = await sdk.diagnostic.orderTests().get(id);
        const update = { sendOut: payload };
        // allow confirming directly by jumping status
        if (_.get(orderTest, 'forConfirmation')) update.$confirm = true;
        await sdk.diagnostic.orderTests().update(id, update, { accessToken });
      },
      receiveOrderTest: async (context, { id, accessToken }) => {
        await sdk.diagnostic.orderTests()
          .update(id, { receive: true }, { accessToken });
      },
      confirmOrderTests: async (context, { ids }) => {
        log('confirmOrderTests#ids: %O', ids);
        if (_.isEmpty(ids)) return;
        await sdk.diagnostic.orderTests()
          .update({ id: { $in: ids } }, { $confirm: true });
      },
      cancelOrderTests: async (context, { ids }) => {
        log('cancelOrderTests#ids: %O', ids);
        if (_.isEmpty(ids)) return;
        await sdk.diagnostic.orderTests()
          .update({ id: { $in: ids } }, { cancel: true });
      },
      getOrderTestsByMedicalRecordOrderId: async (context, { medicalRecordOrder, type }) => {
        log('getOrderTestsByMedicalRecordOrderId#medicalRecordOrder: %O', medicalRecordOrder);
        if (_.isEmpty(medicalRecordOrder)) return;
        const { items } = await sdk.diagnostic.orderTests().find({
          medicalRecordOrder,
          type,
          forConfirmation: { $exists: false },
          $populate: {
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'results',
              extractKey: 'measure',
              foreignKey: 'id',
            },
          },
        });
        log('getOrderTestsByMedicalRecordOrderId#items: %0', items);
        return items;
      },
      getDiagnosticTests: async ({ commit }, opts) => {
        const {
          facility,
          type,
          searchText,
          limit,
          skip,
          commitToStore,
        } = Object.assign({ limit: 20, commitToStore: true }, opts);

        const query = {
          facility,
          type,
          hiddenAt: { $exists: false },
          $populate: {
            service: {
              service: 'services',
              method: 'findOne',
              localKey: 'id',
              foreignKey: 'ref',
            },
          },
        };

        if (!_.isEmpty(searchText)) {
          query.$or = [
            { name: { $regex: `^${searchText}`, $options: 'i' } },
            { section: { $regex: `^${searchText}`, $options: 'i' } },
          ];
        }

        if (typeof limit === 'number') query.$limit = limit;
        if (typeof skip === 'number') query.$skip = skip;

        log('getDiagnosticTests#query: %O', query);
        const { items } = await sdk.diagnostic.tests().find(query);
        const result = items.map(normalizePopulated);
        log('getDiagnosticTests#items: %O', result);
        if (commitToStore) commit('setDiagnosticTests', result);
        return result;
      },
      getDiagnosticTest: async ({ commit }, id) => {
        const diagnosticTest = await sdk.diagnostic.tests().findOne({
          id,
          $populate: {
            measures: {
              service: 'diagnostic-measures',
              method: 'find',
              localKey: 'id',
              foreignKey: 'test',
            },
          },
        });

        log('getDiagnosticTest#diagnosticTest: %O', normalizePopulated(diagnosticTest));
        commit('setDiagnosticTest', normalizePopulated(diagnosticTest));
      },
      getDiagnosticTestById: async ({ commit }, id) => {
        const result = await sdk.diagnostic.tests().get(id);
        return result;
      },
      uploadOrderTestAttachment: async (context, { id, attachment }) => {
        const downloadURL = await sdk.diagnostic.orderTests()
          .uploadPic(id, attachment)
          .upload();

        return downloadURL;
      },
      getDiagnosticTestSummary: async (store, {
        facility,
        type,
        startDate,
        endDate,
      }) => {
        const query = {
          facility,
          type,
          $analytics: {
            type: 'status-distribution',
          },
          $or: [
            { createdAt: { $gte: startDate, $lte: endDate } },
            { finalizedAt: { $gte: startDate, $lte: endDate } },
            { completedAt: { $gte: startDate, $lte: endDate } },
            { verifiedAt: { $gte: startDate, $lte: endDate } },
          ],
          $dateFields: [
            '$or.0.createdAt.$gte', '$or.0.createdAt.$lte',
            '$or.1.finalizedAt.$gte', '$or.1.finalizedAt.$lte',
            '$or.2.completedAt.$gte', '$or.2.completedAt.$lte',
            '$or.3.verifiedAt.$gte', '$or.3.verifiedAt.$lte',
          ],
          cancelledAt: {
            $exists: false,
          },
          forConfirmation: {
            $exists: false,
          },
        };

        const { items } = await sdk.diagnostic.orderTests().find(query);
        log('getDiagnosticTestSummary#items: %O', items);

        return items;
      },
      loadDiagnosticTestByIds: async (store, { ids }) => {
        const { items } = await sdk.diagnostic.tests()
          .find({ id: { $in: ids } });
        return items;
      },
      getTopTestsPerformed: async (store, {
        facility,
        type,
        startDate,
        endDate,
      }) => {
        const query = {
          facility,
          type,
          $analytics: {
            type: 'test-distribution',
          },
          cancelledAt: {
            $exists: false,
          },
          forConfirmation: {
            $exists: false,
          },
        };

        const { items } = await sdk.diagnostic.orderTests()
          .find(limitQueryByDate({ query, startDate, endDate }));
        log('getTopTestsPerformed#items: %O', items);

        const testIds = _.uniq(_.flatMap(items, i => _.map(i.tests, 'test')));
        log('getTopTestsPerformed#testIds: %O', testIds);
        const { items: diagnosticTests } = await sdk.diagnostic.tests()
          .find({ id: { $in: testIds } });
        log('getTopTestsPerformed#diagnosticTests: %O', diagnosticTests);

        const testDistributions = _.map(items, d => ({
          ...d,
          tests: _.map(d.tests, t => ({
            ...t,
            test: _.find(diagnosticTests, dt => dt.id === t.test),
          })),
        }));
        log('getTopTestsPerformed#testDistributions: %O', testDistributions);

        return testDistributions;
      },
      getTopSendOuts: async (store, { facility, type, startDate, endDate }) => {
        const query = {
          facility,
          type,
          $analytics: {
            type: 'send-out-distribution',
          },
        };
        const queryWithDate = limitQueryByDate({
          query,
          startDate,
          endDate,
          key: 'sentOutAt',
        });
        log('getTopSendOuts#query: %O', queryWithDate);

        const { items } = await sdk.diagnostic.orderTests()
          .find(queryWithDate);
        log('getTopSendOuts#items: %O', items);

        const providers = _.uniq(items?.flatMap(i => i?.providers?.map(p => p.provider)));
        log('getTopSendOuts#providers: %O', providers);

        if (!providers.length) return items;

        const { items: organizations } = await sdk.organizations()
          .find({ id: { $in: providers }, $select: ['name', 'id'] });
        log('getTopSendOuts#orgnizations: %O', organizations);

        const sendOuts = items?.map(item => ({
          ...item,
          providers: item?.providers?.map(p => ({
            ...p,
            provider: organizations?.find(org => org.id === p.provider)?.name,
          })),
        }));

        return sendOuts;
      },
      getDiagnosticOrderTestsReports: async (context, {
        organization,
        pageNo,
        pageSize,
        startDate,
        endDate,
        sentOutTo,
        queryOpts,
      }) => {
        const query = {
          ...queryOpts,
          $sort: { createdAt: -1 },
          organization,
          'items.sentOutTo': sentOutTo,
          $populate: {
            orderTests: {
              service: 'diagnostic-order-tests',
              method: 'find',
              localKey: 'items',
              extractKey: 'id',
            },
            sentOutTo: {
              service: 'organizations',
              method: 'get',
              // sentOutTo for all items should be the same
              localKey: 'items[0].sentOutTo',
            },
          },
        };
        const composeQuery = compose(
          fp.paginateQuery({ pageNo, pageSize }),
          fp.limitQueryByDate({ startDate, endDate }),
        );
        const composedQuery = composeQuery(query);
        log('getDiagnosticOrderTestsReports#composedQuery: %O', composedQuery);

        const { items, total } = await sdk.diagnostic.orderTestsReports()
          .find(composedQuery);
        log('getDiagnosticOrderTestsReports#items: %O', items);
        log('getDiagnosticOrderTestsReports#total: %O', total);

        const normalizedItems = normalizePopulated(items);
        log('getDiagnosticOrderTestsReports#normalizedItems: %O', normalizedItems);
        const normalizedItemsWithOrderTests = _.map(
          normalizedItems,
          report => ({
            ...report,
            items: _.map(report.items, item => ({
              ..._.find(report.orderTests, o => o.id === item.id),
              ...item,
            })),
          }),
        );
        log('getDiagnosticOrderTestsReports#normalizedItemsWithOrderTests: %O', normalizedItemsWithOrderTests);

        return { items: normalizedItemsWithOrderTests, total };
      },
      getDiagnosticOrderTestsReport: async (context, id) => {
        const query = {
          id,
          $populate: {
            orderTests: {
              service: 'diagnostic-order-tests',
              method: 'find',
              localKey: 'items',
              extractKey: 'id',
              $populate: {
                receivedByDetails: {
                  service: 'personal-details',
                  method: 'get',
                  localKey: 'receivedBy',
                },
              },
            },
            organization: {
              service: 'organizations',
              method: 'get',
              localKey: 'organization',
            },
            sentOutTo: {
              service: 'organizations',
              method: 'get',
              // sentOutTo for all items should be the same
              localKey: 'items[0].sentOutTo',
            },
            preparedBy: {
              service: 'personal-details',
              method: 'get',
              localKey: 'preparedBy',
            },
            verifiedBy: {
              service: 'personal-details',
              method: 'get',
              localKey: 'verifiedBy',
            },
            patients: {
              service: 'personal-details',
              method: 'find',
              localKey: 'items',
              extractKey: 'patient',
              foreignKey: 'id',
              foreignOps: '$in',
              type: 'medical-patients',
            },
          },
        };
        const result = await sdk.diagnostic.orderTestsReports().findOne(query);
        log('getDiagnosticOrderTestsReport#result: %O', result);
        const normalizedResult = normalizePopulated(result);
        log('getDiagnosticOrderTestsReport#normalizedResult: %O', normalizedResult);

        const resultWithPatients = {
          ...normalizedResult,
          items: _.map(_.get(normalizedResult, 'items'), item => ({
            ..._.find(normalizedResult.orderTests, o => o.id === item.id),
            ...item,
            patient: _.find(
              _.get(normalizedResult, 'patients'),
              p => p.id === item.patient,
            ),
          })),
        };
        log('getDiagnosticOrderTestsReport#resultWithPatients: %O', resultWithPatients);
        return resultWithPatients;
      },
      createDiagnosticOrderTestsReport: async (context, payload) => {
        log('createDiagnosticOrderTestsReport#payload: %O', payload);
        await sdk.diagnostic.orderTestsReports().create(payload);
      },
      verifyDiagnosticOrderTestsReport: async (context, id) => {
        log(`verifyDiagnosticOrderTestsReport#id: ${id}`);
        await sdk.diagnostic.orderTestsReports().update(id, { $verify: true });
      },
    };

    this.mutations = {
      ...mapSetters(Object.keys(this.state)),
    };
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
