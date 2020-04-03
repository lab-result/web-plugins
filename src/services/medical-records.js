import { MEDICAL_RECORD_TYPES } from './constants';
import {
  paginateQuery,
  limitQueryByDate,
  normalizePopulated,
} from '../utils/store';
import {
  isEmpty,
} from 'lodash';

export async function getMedicalRecords (sdk, {
  patient,
  organization,
  types,
  queryOpts,
  pageNo,
  pageSize,
  latest,
}) {
  const query = {
    ...queryOpts,
    patient,
    type: { $in: types },
    $sort: { createdAt: latest ? -1 : 1 },
    $populate: {
      template: {
        service: 'form-templates',
        localKey: 'template',
        method: 'get',
      },
      diagnosticTests: {
        service: 'diagnostic-tests',
        method: 'find',
        localKey: 'tests',
        extractKey: 'id',
        foreignKey: 'id',
        foreignOps: '$in',
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
        $populate: {
          orderDetails: {
            service: 'medical-records',
            localKey: 'order',
            method: 'get',
          },
          template: {
            service: 'form-templates',
            method: 'get',
            localKey: 'template',
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
  };

  const { items, total } = await sdk.service('medical-records')
    .find(paginateQuery({ query, pageNo, pageSize }));

  const normalizedItems = normalizePopulated(items);
  const itemsWithTests = normalizedItems?.map(item => ({
    ...item,
    tests: item?.tests?.map(test => ({
      ...test,
      test: normalizedItems?.diagnosticTests?.find(d => d.id === test.id),
    })),
    // FIXME: waiver relies on hardcoded $populated
    results: item?.results?.map(result => ({
      ...result,
      $populated: { template: result.template },
    })),
  }));

  return { items: itemsWithTests, total };
}

export async function createGenericMedicalRecord (sdk, { payload, singleton, currentUser }) {
  if (currentUser.isDoctor && !payload.provider) {
    payload.provider = currentUser.uid;
  }
  // if not singleton, simply create
  if (!singleton) return sdk.service('medical-records').create(payload);

  // if singleton, decide based on existence of previous record
  const query = { type: payload.type, encounter: payload.encounter };
  const record = await sdk.service('medical-records').findOne(query);

  // if no previous record exists, create one
  if (!record) return sdk.service('medical-records').create(payload);

  // special case for empty medical-note: remove if empty
  const types = ['medical-note', 'care-plan'];
  const isMedicalNote = types.includes(payload.type);

  if (isMedicalNote && isEmpty(payload.text)) {
    return sdk.service('medical-records').remove(record.id);
  }

  // singleton record already exists: update in-place
  delete payload.type;
  delete payload.patient;
  delete payload.facility;
  delete payload.encounter;

  return sdk.service('medical-records').update(record.id, payload);
}

export async function getRecordByType (sdk, {
  type,
  subtype,
  patient,
  encounter,
  queryOpts = {},
  dateFilter = {},
  limit,
  skip,
}) {
  const { start: startDate, end: endDate } = dateFilter;
  const query = {
    type,
    patient,
    ...queryOpts,
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

  if (limit) {
    query.$limit = limit;
  }

  if (skip) {
    query.$skip = skip;
  }

  const data = await sdk.service('medical-records')
    .find(limitQueryByDate({ query, startDate, endDate }));
  return data;
}

export async function getPrescriptionHeader (sdk, { uid, facility }) {
  const query = {
    type: 'medication-order-header',
    facility,
    createdBy: uid,
  };
  return sdk.service('form-templates').findOne(query);
}

export async function createMedicalRecords (sdk, { records, currentUser }) {
  if (currentUser.isDoctor) {
    records = records?.map(record => ({ ...record, provider: currentUser.uid }));
  }
  const newRecords = await sdk.service('medical-records').create(records);
  return newRecords;
}

export function transformCurrentEncounterRecords (records) {
  const currentEncounterRecords = {};
  // FIXME: lint error on forEach
  /* eslint-disable */
  MEDICAL_RECORD_TYPES.forEach(record => {
    currentEncounterRecords[record.type] = records[record.type] || []
  });
  /* eslint-enable */
  return currentEncounterRecords;
}

export async function updateMedicalRecords (sdk, { data }) {
  const { id, payload } = data;
  const res = await sdk.service('medical-records').update(id, payload);
  return res;
}
