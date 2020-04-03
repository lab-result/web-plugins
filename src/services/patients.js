import {
  sortBy,
  pickBy,
  isEmpty,
} from 'lodash';
import {
  getTime,
  startOfDay,
  endOfDay,
} from 'date-fns';
import {
  paginateQuery,
  normalizePopulated,
} from '../utils/store';

export async function getPatients (sdk, {
  facility, // Organization or Organization#id
  searchText,
  sex,
  tags,
  configInsurer, // sOrganization#configInsurer#insurer
  pageNo,
  pageSize,
}) {
  const query = {
    archivedAt: { $exists: false },
    removedAt: { $exists: false },
    $populate: {
      account: {
        service: 'accounts',
        method: 'get',
        key: 'account',
      },
      personalDetails: {
        service: 'personal-details',
        method: 'get',
        key: 'id',
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
      medicalNote: {
        service: 'medical-records',
        method: 'findOne',
        localKey: 'id',
        foreignKey: 'patient',
        type: 'medical-note',
      },
      facility: {
        service: 'organizations',
        method: 'get',
        localKey: 'facility',
        $select: ['id', 'name'],
      },
    },
    $comment: 'wp/patient/getPatients',
  };
  if (!isEmpty(searchText) || !isEmpty(sex) || !isEmpty(tags)) {
    query.$search = paginateQuery({
      query: {
        ...pickBy({
          text: searchText,
          sex,
          tags,
          insurer: configInsurer,
        }),
        sort: { 'name.lastNameNormalized': 1 },
        archived: { $exists: false },
        removed: { $exists: false },
        $comment: '#medical-patients > sort lastNameNormalized:ascending',
      },
      pageNo,
      pageSize,
      skipOp: 'skip',
      limitOp: 'limit',
    });
  }

  if (typeof facility === 'object' && facility) {
    if (!query.$search) {
      query.$search = paginateQuery({
        query: {
          sort: { 'name.lastNameNormalized': 1 },
          archived: { $exists: false },
          removed: { $exists: false },
          $comment: '#medical-patients > sort lastNameNormalized:ascending',
        },
        pageNo,
        pageSize,
        skipOp: 'skip',
        limitOp: 'limit',
      });
    }
    const parent = typeof facility.parent === 'object'
      ? facility?.parent?.id
      : facility.parent;
    const includeFamily = !!parent || !isEmpty(facility._ch);
    query.$search.organization = parent || facility.id;
    query.$search.includeOrganizationChildren = includeFamily;
  } else if (!isEmpty(facility)) {
    query.facility = facility;
  }

  const { items, total } = await sdk.service('medical-patients')
    .find(paginateQuery({ query, pageNo: query.$search ? 1 : pageNo, pageSize }));

  const patients = items?.map(item => {
    const patient = normalizePopulated(item);
    patient.branch = item.$populated && item.$populated.facility
      ? item.$populated.facility.name
      : '';
    delete patient.$populated;
    return patient;
  });

  return {
    items: sortBy(patients, p => p?.name?.lastNameNormalized),
    total,
  };
}

export async function searchApproximatePatients (sdk, {
  facility, // Organization or Organization#id
  firstName,
  lastName,
  dateOfBirth,
  mobileNo,
  sex,
  insuranceCards,
  pageNo = 1,
  pageSize = 20,
}) {
  const query = {
    type: 'medical-patients',
    $and: [],
    $populate: {
      patient: {
        service: 'medical-patients',
        method: 'get',
        localKey: 'id',
        foreignKey: 'id',
        $select: ['archivedAt', 'removedAt'],
      },
      insuranceCardsInsurances: {
        service: 'organizations',
        method: 'find',
        localKey: 'insuranceCards',
        extractKey: 'insurance',
        foreignKey: 'id',
        foreignOps: '$in',
        $select: ['id', 'name'],
      },
      companiesInsuranceContracts: {
        service: 'insurance-contracts',
        method: 'find',
        localKey: 'companies',
        extractKey: 'company',
        foreignKey: 'id',
        foreignOps: '$in',
        $select: ['id', 'name', 'insurerName'],
        type: 'corporate-partner-facility',
        insured: typeof facility === 'object' ? facility?.id : facility,
      },
    },
    $comment: 'wp/patient/searchApproximatePatients',
    $total: false,
  };

  if (!isEmpty(lastName) || !isEmpty(firstName)) {
    query.$search = { text: [lastName, firstName].join(', ') };
  }

  if (typeof facility === 'object' && facility) {
    if (!query.$search) query.$search = {};
    const parent = typeof facility.parent === 'object'
      ? facility?.parent?.id
      : facility.parent;
    const includeFamily = !!parent || !isEmpty(facility._ch);
    query.$search.organization = parent || facility.id;
    query.$search.includeOrganizationChildren = includeFamily;
  } else if (!isEmpty(facility)) {
    query.facility = facility;
  }

  // handle sex field
  if (!isEmpty(sex)) query.sex = sex;
  // handle dateOfBirth field
  if (!isEmpty(dateOfBirth)) {
    const bdayStart = getTime(startOfDay(dateOfBirth));
    const bdayEnd = getTime(endOfDay(dateOfBirth));

    query.dateOfBirth = { $gte: bdayStart, $lte: bdayEnd };
  }

  const others = [];
  // TODO: add filters to $search operator
  // at least one of name or mobileNo is others
  if (!isEmpty(mobileNo)) others.push({ mobileNo: mobileNo });
  if (!isEmpty(insuranceCards)) {
    const insuranceCardQueries = insuranceCards?.map(card => ({
      'insuranceCards.insurance': card.insurance,
      'insuranceCards.number': card.number,
    }));
    others.push(...insuranceCardQueries);
  }

  if (!isEmpty(others)) query.$or = others;

  // force limiter
  if (typeof query.$limit !== 'number') query.$limit = 20;

  const { items } = await sdk.service('personal-details')
    .find(paginateQuery({ query, pageNo, pageSize }));
  const normalizedItems = normalizePopulated(items);

  const filteredItems = normalizedItems?.filter(
    i => !i.patient?.archivedAt || !i.patient?.removedAt
  );

  return filteredItems;
}

export async function getPatient (sdk, { id }) {
  if (!id) return null;
  const query = {
    id,
    $populate: {
      account: {
        service: 'accounts',
        method: 'get',
        key: 'account',
      },
      personalDetails: {
        method: 'get',
        service: 'personal-details',
        key: 'id',
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
            foreignKey: 'insurer',
            foreignOps: '$in',
            type: 'corporate-partner-facility',
          },
        },
      },
      medicalNote: {
        service: 'medical-records',
        method: 'findOne',
        localKey: 'id',
        foreignKey: 'patient',
        type: 'medical-note',
      },
      facility: {
        service: 'organizations',
        method: 'get',
        localKey: 'facility',
        $select: ['id', 'name'],
      },
    },
  };

  const patient = await sdk.service('medical-patients').findOne(query);
  if (!patient) return null;

  const normalized = {
    ...patient.$populated?.personalDetails,
    medicalNote: patient.$populated?.medicalNote,
    hmos: patient.$populated?.personalDetails?.$populated?.hmos,
    companyPartners: patient.$populated?.personalDetails?.$populated?.companyPartners,
    facility: patient.$populated?.facility,
    account: patient.$populated?.account,
  };
  delete patient.$populated;
  return { ...patient, ...normalized };
}
