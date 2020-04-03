import { paginateQuery } from '../utils/store';
import { groupBy, isEmpty, cloneDeep } from 'lodash';

/**
 * @typedef {Object} PaginatedItems
 * @property {any[]} items
 * @property {number} total
 *
 * @param {object} sdk MYCURE SDK instance
 * @param {object} opts
 * @param {object} [opts.organization]
 * @param {string} [opts.searchString]
 * @param {number} [opts.limit=20]
 * @param {number} [opts.skip]
 * @return {PaginatedItems}
 */
export async function getActiveEncounterQueueItems (sdk, opts) {
  opts = Object.assign({ limit: 20 }, opts);

  // normalize parent organization ID
  const parent = opts.organization?.parent;
  const parentId = typeof parent === 'object' ? parent?.id : parent;

  // check if organization is in family
  const hasParent = !!parentId;
  const hasChildren = !!opts.organization?._ch?.length;
  const includeOrganizationChildren = hasParent || hasChildren;

  // base query on medical-encounters
  const query = {
    facility: opts.organization?.id,
    $active: true,
    $select: ['id', 'patient', 'createdAt', 'queueNumber'],
  };
  if (typeof opts.limit === 'number') query.$limit = opts.limit;
  // if opts.searchString is given, the $prequery will control skipping
  if (typeof opts.skip === 'number' && !opts.searchString) query.$skip = opts.skip;

  // search via prequery on personal-details
  if (opts.searchString) {
    query.$prequery = [
      {
        service: 'personal-details',
        extractKey: 'id',
        resKey: 'patient',
        resOps: '$in',
        query: {
          px_archived: null,
          px_removed: null,
          ...typeof opts.limit === 'number' && { $limit: opts.limit },
          ...typeof opts.skip === 'number' && { $skip: opts.skip },
          $select: ['id'],
          $search: {
            text: opts.searchString,
            insurer: opts.organization?.configInsurer?.insurer,
            organization: parentId || opts.organization?.id,
            includeOrganizationChildren,
          },
        },
      },
    ];
  }

  // execute query
  const { items: encounters, total } = await sdk.service('medical-encounters').find(query);

  // map to active queue items
  const queueItemPromises = encounters?.map(async encounter => {
    const activeQueueItem = await sdk.service('queue-items').findOne({
      subject: encounter.patient,
      organization: opts.organization?.id,
      $active: true,
      $sort: { weight: 1 },
      $populate: {
        queue: {
          service: 'queues',
          method: 'get',
          localKey: 'queue',
        },
      },
    });
    if (activeQueueItem) return activeQueueItem;

    // if no active queue item exists, craft a QueueItem-shaped object without id
    const patient = await sdk.service('personal-details').findOne({
      id: encounter.patient,
      $select: ['id', 'name'],
    });
    return {
      meta: {
        patient: patient?.id,
        patientName: patient?.name,
      },
      subject: patient?.id,
      createdAt: encounter.createdAt,
      number: encounter.queueNumber,
    };
  });
  return {
    items: await Promise.all(queueItemPromises),
    total,
  };
}

export async function getCurrentEncounter (
  sdk,
  commit,
  {
    patient,
    facility,
    showOwnRecords,
    createdByUID,
    isDoctor,
  },
) {
  const data = await fetchEncounter(
    sdk,
    true,
    patient,
    true,
    {
      facility,
      showOwnRecords,
      createdByUID,
      isDoctor,
    },
  );

  if (!data) return {};

  data.medicalRecordsArr = [];
  data.medicalRecordsArrNonDoctor = [];
  data.medicalRecordsGrouped = {};
  data.medicalRecordsGroupedNonDoctor = {};
  data.attendingDoctors = [];

  const populatedMedicalRecords = data?.$populated?.medicalRecords;
  const populatedAttendingDoctors = data?.$populated?.doctors;

  data.medicalRecords = {
    ...groupBy(populatedMedicalRecords, 'type'),
    ...groupBy(populatedMedicalRecords?.filter(r => r.subtype), 'subtype'),
  };

  if (!isEmpty(populatedMedicalRecords)) {
    const nonDoctorsRecords = populatedMedicalRecords
      .filter(record => record.providerType !== 'doctor');
    data.facilityData = data?.$populated?.facilityData;
    data.medicalRecordsArr = populatedMedicalRecords;
    data.medicalRecordsGrouped = data?.medicalRecords;
    data.attendingDoctors = populatedAttendingDoctors?.map((doctor) => doctor.name);
    data.doctors = data?.$populated?.doctors;
    data.providers = data?.$populated?.providers;
    data.medicalRecordsArrNonDoctor = nonDoctorsRecords;
    data.medicalRecordsGroupedNonDoctor = groupBy(nonDoctorsRecords, 'type');
  }

  const encounter = cloneDeep(data);
  delete encounter.$populated;

  commit('medical-records/setCurrentEncounterRecords', data.medicalRecords);

  return encounter;
}

export async function fetchEncounter (
  sdk,
  isCurrent = true,
  patient,
  populateRecords = true,
  {
    sortBy = 'createdAt',
    pageNo = 1,
    pageSize = 5,
    facility,
    showOwnRecords,
    createdByUID,
    isDoctor,
  } = {},
) {
  const query = {
    patient,
    $sort: { [sortBy]: -1 },
    finishedAt: {
      $exists: !isCurrent,
    },
    $populate: {
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
      facilityData: {
        service: 'organizations',
        localKey: 'facility',
        method: 'findOne',
        $select: ['name'],
      },
    },
  };

  if (facility) query.facility = facility;

  if (populateRecords) {
    const medRecordsQuery = {
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
        diagnosisFixture: {
          service: 'fixtures',
          method: 'findOne',
          localKey: 'icd10',
          foreignKey: 'code',
          type: 'icd10',
        },
      },
    };

    // Restrict other doctor's records
    // from showing in current encounter
    // Only the owner of the records and
    // other non-doctor roles e.g. nurses
    // may see the records
    if (showOwnRecords && isDoctor) {
      medRecordsQuery.$or = [
        // doctor || you
        { createdBy: createdByUID },
        { provider: createdByUID },
        // non-doctor
        { providerType: { $ne: 'doctor' } },
        {
          creatorRoles: {
            $nin: [
              'doctor',
              'doctor_pathologist',
              'doctor_radiologist',
              'doctor_sonologist',
              'doctor_cardiologist',
              'doctor_pme',
            ],
          },
          provider: { $in: [null, createdByUID] },
        },
      ];
    }

    query.$populate = {
      ...query.$populate,
      medicalRecords: medRecordsQuery,
    };
  }

  const paginatedQuery = paginateQuery({ query, pageNo, pageSize });

  const encounter = isCurrent
    ? await sdk.service('medical-encounters').findOne(paginatedQuery)
    : await sdk.service('medical-encounters').find(paginatedQuery);

  if (isEmpty(encounter)) return undefined;
  return {
    ...encounter,
    doctors: encounter?.$populated?.doctors,
    providers: encounter?.$populated?.providers,
  };
}
