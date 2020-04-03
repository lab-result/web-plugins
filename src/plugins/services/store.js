import {
  mapSetters,
  initLogger,
  fp,
  normalizePopulated,
  paginateQuery,
} from '../../utils/store';
import { compose } from '../../utils/fn';
import _ from 'lodash';

export const STORE_NAME = 'services';
const log = initLogger(STORE_NAME);

export default class Store {
  constructor (mycure) {
    this.state = {
      services: [],
      servicesTotal: 0,
      govCoveragesTotal: 0,
      hmoCoveragesTotal: 0,
      partnersCoveragesTotal: 0,
      areAllServicesFetched: false,
      serviceProviders: [],
      serviceProvidersTotal: 0,
      coveragesTotal: 0,
    };

    this.getters = {
      consultationServices: s => s.services
        .filter(s => s.type === 'clinical-consultation'),
      clinicalProcedures: s => s.services
        .filter(s => s.type === 'clinical-procedure'),
      diagnosticServices: s => s.services
        .filter(s => s.type === 'diagnostic'),
      peServices: s => s.services
        .filter(s => s.type === 'pe'),
      dentalServices: s => s.services
        .filter(s => s.type === 'dental'),
    };

    this.actions = {
      /**
       * @param ctx
       * @param {Object} opts
       * @param {string[]} opts.ids service ids
       */
      async findServices (ctx, opts) {
        if (!opts.ids.length) return [];
        return mycure.serv.services().find({ id: { $in: opts.ids } }).then(r => r.items);
      },
      /**
       * @param ctx
       * @param {Object} opts
       * @param {string[]} opts.tests test ids
       */
      async findServicesFromTests (ctx, opts) {
        if (!opts.tests.length) return [];
        return mycure.serv.services().find({ ref: { $in: opts.tests } }).then(r => r.items);
      },
      /**
       * Search Services, doesn't commit in store
       * @param {Object} opts
       * @property {string} facilityId - The organization id
       * @property {string} searchText - Name search text
       * @property {Object} filter - { types: string[] }
       * @property {string} limit - search limit per page
       * @property {string} skip - search skip - ((page - 1) * limit)
       * @return {any[]} - [{ ...service, coveragesData: [{ ...coverage, contractData: {} }] }]
       */
      searchServices: async (store, opts) => {
        const {
          filter = { types: [] },
        } = Object.assign({}, opts);

        if (_.isEmpty(opts.facilityId)) {
          throw new Error('Organization Id not provided.');
        }

        const query = {
          facility: opts.facilityId,
          $populate: {
            coveragesData: {
              service: 'insurance-coverages',
              key: 'coverages',
              $populate: {
                contractData: {
                  service: 'insurance-contracts',
                  key: 'contract',
                },
              },
            },
          },
        };

        if (opts.type) query.type = opts.type;

        if (!_.isEmpty(opts.searchText)) {
          const q = { $regex: `^${opts.searchText}`, $options: 'i' };
          query.$and = [
            {
              $or: [
                { name: q },
                { description: q },
              ],
            },
          ];
        }

        if (typeof opts.limit === 'number') query.$limit = opts.limit;
        if (typeof opts.skip === 'number') query.$skip = opts.skip;

        if (((filter.types) || []).length) {
          if (!query.$and) query.$and = [];
          query.$and.push({
            $or: [
              { type: { $in: opts.filter.types } },
              { subtype: { $in: opts.filter.types } },
            ],
          });
        }

        log('searchServices#query: %O', query);
        const { items } = await mycure.serv.services().find(query);
        log('searchServices#items: %O', items);

        return items
          .map(normalizePopulated)
          .map(item => {
            item.coveragesData = (item.coveragesData || [])
              .map(coverage => {
                coverage.insurerName = coverage.insurerName ||
                  _.get(coverage, 'contractData.insurerName');
                return coverage;
              });
            return item;
          });
      },
      /**
      * Fetch all services in the clinic
      * @param {Object} opts
      * @property {string} facility - Current clinic's id
      * @property {number} limit - Pagination limit
      * @property {number} skip - Pagination page
      * @property {Array} specializations
      */
      getAllServices: async ({ commit, state }, opts) => {
        const {
          facility,
          limit = 20,
          skip,
          searchText,
          type,
          specializations,
        } = Object.assign({}, opts);

        const query = {
          facility,
          $populate: {
            coveragesData: {
              service: 'insurance-coverages',
              key: 'coverages',
              $populate: {
                contractData: {
                  service: 'insurance-contracts',
                  key: 'contract',
                },
              },
            },
          },
        };

        if (typeof limit === 'number') query.$limit = limit;
        if (typeof skip === 'number') query.$skip = skip;

        if (!_.isEmpty(specializations)) {
          query['specialization.name'] = { $in: _.map(specializations, 'name') };
        }
        if (!_.isEmpty(searchText)) {
          if (_.isEmpty(query.$and)) query.$and = [];
          query.$and.push(
            { name: { $regex: `^${searchText}`, $options: 'gi' } },
          );
          // TODO: remove later
          // query.$or = [
          //   { name: { $regex: searchText, $options: 'gi' } },
          //   { type: { $regex: searchText, $options: 'gi' } }
          // ];
        }

        if (!_.isEmpty(type)) {
          if (_.isEmpty(query.$and)) query.$and = [];
          query.$and.push(
            {
              $or: [{ type: { $in: [type] } }, { subtype: { $in: [type] } }],
            },
          );
        }

        // NOTE: not needed anymore coz of pagination
        // if (state.areAllServicesFetched && !_.isEmpty(state.services)) return;

        const { items, total } = await mycure.serv.services().find(query);
        const result = items.map(normalizePopulated);
        log('getAllServices#result: %O', result);
        commit('setServices', result);
        commit('setServicesTotal', total);
        commit('setAreAllServicesFetched', true);
        return result;
      },
      getService: async (store, { id, facility }) => {
        log(`getService#id: ${id}`);
        const query = {
          id,
          facility,
        };
        const item = await mycure.serv.services().findOne(query);
        log('getService#item: %O', item);

        return item;
      },
      getServices: async ({ commit }, { facility, types }) => {
        const query = {
          facility,
          type: { $in: types },
          $populate: {
            coveragesData: {
              service: 'insurance-coverages',
              key: 'coverages',
              $populate: {
                contractData: {
                  service: 'insurance-contracts',
                  key: 'contract',
                },
              },
            },
          },
        };
        log('getServices#query: %O', query);

        const { items } = await mycure.serv.services().find(query);
        const normalizedItems = normalizePopulated(items);
        log('getServices#normalizedItems: %O', normalizedItems);

        commit('setServices', normalizedItems);
        commit('setAreAllServicesFetched', false);
        return normalizedItems;
      },
      /* Settings */
      createNewService: async ({ commit }, { service, facility }) => {
        const data = {
          ...service,
          facility,
        };
        const newData = await mycure.serv.services().create(data);
        commit('$createNewService', newData);
      },
      loadService: async (ctx, id) => {
        const res = await mycure.serv.services().get(id);
        return res;
      },
      createNewServices: async (ctx, payload) => {
        await mycure.serv.services().create(payload);
      },
      removeService: async ({ commit }, { id, facility }) => {
        const query = {
          id, facility,
        };
        const removedData = await mycure.serv.services().remove(query);
        return removedData;
      },
      updateService: async ({ commit }, { id, update }) => {
        const updated = await mycure.serv.services().update(id, update);
        return updated;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {Object} payload.coverage - coverage to be added
       */
      createNewCoverage: async (ctx, payload) => {
        const item = await mycure.insurance.coverages().create(payload.coverage);
        const update = {
          $addToSet: { coverages: item.id },
        };
        return update;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {Object[]} payload.coverages - coverages to be added
       */
      createNewCoverages: async (ctx, payload) => {
        if (_.isEmpty(payload.coverages)) throw new Error('Nothing to create.');
        const fields = ['contract', 'paymentMethod', 'type', 'name', 'amount',
          'percentage', 'ref', 'refType'];
        const coverages = (payload.coverages || []).map(c => _.pick(c, fields));
        return mycure.insurance.coverages().create(coverages);
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {Object} payload.coverage - coverage to be deleted
       */
      deleteCoverage: async (ctx, payload) => {
        await mycure.insurance.coverages().remove(payload.coverage.coverageId);
        const update = {
          $pull: { coverages: payload.coverage.coverageId },
        };
        return update;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {Object} payload.coverage - coverage to be updated
       */
      updateCoverage: async (ctx, payload) => {
        const update = _.pick(payload.coverage, ['name', 'type', 'amount', 'percentage']);
        await mycure.insurance.coverages().update(payload.coverage.coverageId, update);
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} id - coverage id
       */
      loadCoverage: async (ctx, id) => {
        const item = await mycure.insurance.coverages().get(id);
        const contract = await mycure.insurance.contracts().get(item.contract);
        item.insurerName = contract.insurerName;
        item.coverageId = id;
        item.id = item.contract;
        return item;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload.ref - coverage ref
       * @param {Object} payload.insurerIds - coverage insurer
       * @
       */
      loadCoveragesByRef: async (ctx, payload) => {
        if (!payload.ref) throw new Error('Invalid ref');
        const {
          skip,
          limit = 20,
        } = Object.assign({}, payload);
        const query = {
          ref: payload.ref,
          $populate: {
            contractData: {
              service: 'insurance-contracts',
              key: 'contract',
            },
          },
        };
        if (!_.isEmpty(payload.insurerIds)) query.insurer = { $in: payload.insurerIds };
        if (typeof limit === 'number') query.$limit = limit;
        if (typeof skip === 'number') query.$skip = skip;

        const { items } = await mycure.insurance.coverages()
          .find(query);
        const res = items.map(normalizePopulated);
        log('loadCoveragesByRef#res', res);
        const govCoverages = res.filter(cov => cov.insurerType === 'insurance' && cov.insurerSubtype === 'government')
          .length;
        const hmoCoverages = res.filter(cov => cov.insurerType === 'insurance' && cov.insurerSubtype === 'hmo')
          .length;
        const partnersCoverages = res.filter(cov => cov.insurerType === 'corporate-partner')
          .length;
        ctx.commit('setGovCoveragesTotal', govCoverages);
        ctx.commit('setHmoCoveragesTotal', hmoCoverages);
        ctx.commit('setPartnersCoveragesTotal', partnersCoverages);
        return res;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload.ref - coverage ref
       * @param {Object} payload.type - coverage insurer
       * @
       */
      getCoveragesByRefAndType: async ({ commit }, payload) => {
        if (!payload.ref) throw new Error('Invalid ref');
        const {
          pageSize = 20,
          pageNo,
          type,
          ref,
        } = Object.assign({}, payload);
        const query = {
          ref,
          $populate: {
            contractData: {
              service: 'insurance-contracts',
              key: 'contract',
            },
          },
        };

        if (type === 'hmo') {
          query.insurerType = 'insurance';
          query.insurerSubtype = 'hmo';
        } else if (type === 'company') {
          query.insurerType = 'corporate-partner';
        } else if (type === 'government') {
          query.insurerType = 'insurance';
          query.insurerSubtype = 'government';
        }

        log('getCoveragesByRefAndType#query: %O', query);

        const { items, total } = await mycure.insurance.coverages()
          .find(paginateQuery({ query, pageNo, pageSize }));
        const res = items.map(normalizePopulated);
        commit('setCoveragesTotal', total);
        return res;
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {String} payload.contract - coverage id
       * @param {Number} payload.limit - limit
       */
      loadCoveragesByContract: async (ctx, payload) => {
        if (!payload) throw new Error('Invalid payload');
        if (!payload.contract) throw new Error('Invalid contract');
        const query = {
          contract: payload.contract,
          $populate: {
            contractData: {
              service: 'insurance-contracts',
              key: 'contract',
            },
          },
        };
        if (payload.limit) query.$limit = payload.limit;

        const { items } = await mycure.insurance.coverages().find(query);
        const res = items.map(normalizePopulated);
        log('loadCoveragesByContract#res', res);
        return res;
      },
      loadCommissionIds: async (context, { comm }) => {
        const { items } = await mycure.organization.members().find({ uid: comm.doctor });
        comm.doctor = items[0];
        return comm;
      },
      loadSuppliesIds: async (context, { supply }) => {
        const { items } = await mycure.inventory.variants().find({ sku: supply.product });
        supply.product = items[0];
        return supply;
      },
      loadQueueing: async (context, { queueing, orgId }) => {
        const query = {
          id: { $in: queueing.map(q => q.queue) },
          organization: orgId,
          type: { $nin: ['cashier-pool', 'end-of-encounter'] },
        };
        const { items } = await mycure.queue.queues().find(query);
        const packages = queueing
          .map(q => (q.meta || {}).testPackage)
          .filter(Boolean);
        const packagesResult = await mycure.diagnostic.packages()
          .find({
            id: { $in: packages },
            facility: orgId,
          });
        return queueing
          .map(q => {
            q.queue = (items || []).filter(i => i.id === q.queue)[0];
            if (q.meta) {
              // FIXME: don't rely on meta being the testPackage directly
              const meta = packagesResult.items
                .filter(p => p.id === (q.meta || {}).testPackage)[0];
              q.meta = {
                ...meta,
                ...q.meta,
              };
            }
            return q;
          });
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {string} payload.facility - facility id
       * @param {number} payload.pageNo
       * @param {number} payload.pageSize
       * @param {string} payload.searchText
       */
      getServiceProviders: async (ctx, payload) => {
        const { pageNo, pageSize, searchText } = payload;
        const query = {
          facility: payload.facility,
          $populate: {
            serviceData: {
              service: 'services',
              method: 'get',
              key: 'service',
            },
            memberData: {
              service: 'organization-members',
              method: 'findOne',
              key: 'provider',
              foreignKey: 'uid',
              organization: payload.facility,
            },
          },
        };

        if (!_.isEmpty(searchText)) {
          query.$prequery = [{
            service: 'organization-members',
            localKey: 'provider',
            localOps: '$in',
            extractKey: 'uid',
            query: {
              $search: {
                text: searchText,
                archived: { $exists: false },
                removed: { $exists: false },
                organization: payload.facility,
                limit: pageSize,
              },
            },
          }];
        }

        const composeQuery = compose(fp.paginateQuery({ pageNo, pageSize }));
        const { items, total } = await mycure.serv.providers().find(composeQuery(query));
        const final = normalizePopulated(items);
        ctx.commit('setServiceProviders', final);
        ctx.commit('setServiceProvidersTotal', total);
      },
      createServiceProvider: async (ctx, payload) => {
        const data = payload.data;
        const { provider, service } = data;

        const { total } = await mycure.serv.providers().find({ provider, service, $limit: 0 });
        if (total > 0) {
          throw new Error('This service is already being provided by this user.');
        }
        await mycure.serv.providers().create(data);
      },
      updateServiceProvider: async (ctx, payload) => {
        await mycure.serv.providers().update(payload.id, payload.update);
      },
      /**
       * @param {ActionContext} ctx
       * @param {Object} payload
       * @param {string} payload.id - staff id
       */
      removeServiceProvider: async (ctx, payload) => {
        await mycure.serv.providers().remove(payload.id);
      },
    };

    this.mutations = {
      ...mapSetters(Object.keys(this.state)),
      $createNewService: (s, val) => {
        s.services.push(val);
      },
      $removeService: (s, val) => {
        s.services = s.services.filter(serv => serv.id !== val);
      },
      $updateService: (s, val) => {
        s.services.forEach(serv => {
          if (serv.id === val.id) {
            const index = s.services.indexOf(serv);
            s.services.splice(index, 1, val);
          }
        });
      },
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
