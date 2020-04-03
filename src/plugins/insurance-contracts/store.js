import { mapSetters, normalizePopulated, initLogger } from '../../utils';
import _ from 'lodash';

export const STORE_NAME = 'insurance-contracts';
const log = initLogger(STORE_NAME);

export default class Store {
  constructor (mycure) {
    this.state = {
      // NOTE: renamed to state.insurance.contracts
      insuranceContracts: [],
      hasCompanyInsuranceContracts: false,
      hasHMOInsuranceContracts: false,
      hasGovernmentInsuranceContracts: false,
    };

    this.getters = {
      // NOTE: renamed to getters.insurance/companyContracts
      companyInsuranceContracts: s => s.insuranceContracts
        .filter(i => i.type === 'corporate-partner-facility')
        .map(i => ({ ...i, insurer: i.insurerCompany })),
      // NOTE: renamed to getters.insurance/hmoContracts
      hmoInsuranceContracts: s => s.insuranceContracts
        .filter(i => i.type === 'insurance-facility' &&
          i.insurerSubtype === 'hmo')
        .map(i => ({ ...i, insurer: i.insurerHmo })),
      // NOTE: renamed to getters.insurance/governmentContracts
      governmentInsuranceContracts: s => s.insuranceContracts
        .filter(i => i.type === 'insurance-facility' &&
           i.insurerSubtype === 'government'),
    };

    this.actions = {
      // NOTE: dispatch insurance/getContracts
      getInsuranceContracts: async ({ commit }, opts) => {
        let facility;
        let limit = 20;
        if (typeof opts === 'object') {
          facility = opts.facility;
          limit = opts.limit;
          // const {
          //   limit = 20,
          //   skip,
          //   type,
          //   insurerSubtype
          // } = Object.assign({}, opts);
        } else if (typeof opts === 'string') {
          facility = opts;
        }

        if (!facility) {
          throw Error('Facility is required.');
        }

        const query = {
          insured: facility,
          $populate: {
            insurerHmo: {
              service: 'organizations',
              method: 'get',
              localKey: 'insurer',
            },
            insurerCompany: {
              service: 'insurance-contracts',
              method: 'get',
              localKey: 'insurer',
            },
          },
        };

        if (typeof limit === 'number') query.$limit = limit;
        if (typeof opts.skip === 'number') query.$skip = opts.skip;

        if (!_.isEmpty(opts.type)) query.type = opts.type;
        if (!_.isEmpty(opts.insurerSubtype)) query.insurerSubtype = opts.insurerSubtype;

        const { items } = await mycure.insurance.contracts().find(query);

        log('getInsuranceContracts#items: %O', items);

        const insuranceContracts = items
          .map(normalizePopulated)
          .map(i => ({
            ...i,
            insurerName: _.get(i, 'insurer.name') || i.insurerName,
          }));
        log('getInsuranceContracts#insuranceContracts: %O', insuranceContracts);

        commit('setInsuranceContracts', insuranceContracts);

        // for checking if has [hmo, company, govt contracts]
        if (opts.type && opts.type === 'corporate-partner-facility') { commit('setHasCompanyInsuranceContracts', !_.isEmpty(items)); }

        if (opts.type && opts.type === 'insurance-facility' && opts.insurerSubtype === 'hmo') { commit('setHasHMOInsuranceContracts', !_.isEmpty(items)); }

        if (opts.type && opts.type === 'insurance-facility' && opts.insurerSubtype === 'government') { commit('setHasGovernmentInsuranceContracts', !_.isEmpty(items)); }
      },
      // NOTE: dispatch insurance/createContract
      createInsuranceContract: async (context, payload) => {
        log('createInsuranceContract#payload: %O', payload);
        const result = await mycure.insurance.contracts().create(payload);

        log('createInsuranceContract#result: %O', result);
        return result;
      },
      // NOTE: dispatch insurance/removeContracts
      deleteInsuranceContract: async (context, payload) => {
        log('deleteInsuranceContract#payload: %O', payload);
        await mycure.insurance.contracts().remove(payload);
      },
      // NOTE: dispatch insurance/getPatientContract
      getInsurancePatient: async (context, { patient, date }) => {
        log(`getInsurancePatient#patient: ${patient}`);
        const query = {
          type: { $in: ['insurance-patient', 'corporate-partner-patient'] },
          insured: patient,
          startAt: { $lte: date },
          expiresAt: { $gte: date },
          $dateFields: ['startAt.$lte', 'expiresAt.$gte'],
          $populate: {
            service: {
              service: 'services',
              method: 'get',
              localKey: 'meta.service',
            },
          },
        };
        log('getInsurancePatient#query: %O', query);
        const result = await mycure.insurance.contracts()
          .findOne(query);
        const insurancePatient = normalizePopulated(result);
        log('getInsurancePatient#insurancePatient: %O', insurancePatient);
        return insurancePatient;
      },
      /**
       * @typedef {Object} LoadInsuranceContractActionOpts
       * @property {string} id - id of insured
       * @property {string} insurerSubtype - name of insurer
       *
       * @callback LoadInsuranceContractsAction
       * @param {ActionContext} ctx
       * @param {LoadInsuranceContractsActionOpts} opts
       * @returns {Promise<InsuranceContract>}
       */
      loadInsuranceContract: async (ctx, opts) => {
        const id = opts.id;
        const insurer = opts.insurer;
        if (_.isEmpty(id) && _.isEmpty(insurer)) throw new Error('Invalid payload');
        const query = _.pickBy({
          id,
          insurer,
          $populate: {
            insurerData: {
              service: 'organizations',
              method: 'get',
              localKey: 'insurer',
            },
          },
        }, Boolean);

        const result = await mycure.insurance.contracts().findOne(query);
        return normalizePopulated(result);
      },
      /**
       * @typedef {Object} LoadInsuranceContractsActionOpts
       * @property {number} [limit=20] - limit for pagination
       * @property {number} skip - skip for pagination
       * @property {string} type - type of contract
       * @property {string} insurerSubtype - insurer org sub type
       * @property {string} searchString - name of insurer
       * @property {string[]} insurerIds - insurer ids
       * @property {object} populate - query populate
       *
       * @callback LoadInsuranceContractsAction
       * @param {ActionContext} ctx
       * @param {LoadInsuranceContractsActionOpts} opts
       * @returns {Promise<InsuranceContract[]>}
       */
      loadInsuranceContracts: async (ctx, opts) => {
        opts = Object.assign({ limit: 20 }, opts);
        const insured = opts.insured;
        if (!insured) throw new Error('Insured is required.');
        const query = {
          insured,
          $sort: { insurerName: 1 },
          $populate: {
            insurerData: {
              service: 'organizations',
              method: 'get',
              localKey: 'insurer',
            },
          },
        };

        if (opts.type) query.type = opts.type;
        if (opts.type) query.insurerSubtype = opts.insurerSubtype;
        if (!_.isEmpty(opts.insurerIds)) query.insurer = { $in: opts.insurerIds };
        if (!_.isEmpty(opts.populate)) query.$populate = opts.populate;

        // pagination
        if (typeof opts.limit === 'number') query.$limit = opts.limit;
        if (typeof opts.skip === 'number') query.$skip = opts.skip;

        // search string
        if (!_.isEmpty(opts.searchString)) {
          query.insurerName = { $regex: `^${opts.searchString}`, $options: 'i' };
        }

        const result = await mycure.insurance.contracts().find(query);
        result.items = normalizePopulated(result.items);
        return result;
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
