import _ from 'lodash';

export const buildPrecedingEncounterUpdate = ({
  visitType,
  precedingEncounter,
}) => {
  if (visitType !== 'followup') return;
  if (_.isEmpty(precedingEncounter)) return;

  return {
    preceding: _.get(precedingEncounter, 'latestFollowupEncounter.id') ||
      _.get(precedingEncounter, 'id'),
    precedingParent: _.get(precedingEncounter, 'id'),
  };
};

export const buildPeContractUpdate = ({ requests, insurancePatient }) => {
  if (_.isEmpty(insurancePatient)) return;

  const coveredService = _.flatMap(requests, 'services')
    .find(s => s.id === _.get(insurancePatient, 'meta.service'));
  if (_.isEmpty(coveredService)) return;

  return {
    peContract: insurancePatient.id,
    peContractInsurer: insurancePatient.insurer,
  };
};

export const getRequestTags = request => {
  if (!_.isEmpty(request.peService)) {
    return request.peService.tags;
  }
  if (request.type === 'consult') return 'Consult';
};

export const buildTagsUpdate = ({ requests }) => {
  const tags = _.flatMap(requests, getRequestTags).filter(Boolean);
  const uniqueTags = _.uniq(tags);
  if (_.isEmpty(uniqueTags)) return;
  return { tags: uniqueTags };
};

export const buildEncounter = ({
  patient,
  facility,
  visitType,
  precedingEncounter,
  insurancePatient,
  requests,
}) => ({
  patient,
  facility,
  ...buildPrecedingEncounterUpdate({ visitType, precedingEncounter }),
  ...buildPeContractUpdate({ requests, insurancePatient }),
  ...buildTagsUpdate({ requests }),
});

export const buildTestOrder = ({
  patient,
  facility,
  encounter,
  services,
  billingItems,
}) => order => (
  _.isEmpty(order.tests)
    ? null
    : {
      patient,
      facility,
      encounter: _.get(encounter, 'id'),
      type: order.type,
      order: order.order,
      reason: order.reason,
      requestingPhysician: order.requestingPhysician,
      diagnosisCode: order.diagnosisCode,
      diagnosisText: order.diagnosisText,
      tests: _.map(order.tests, t => {
        const service = _.find(services, s => s.ref === t.id);
        const billingItem = _.find(billingItems, i => i.ref === _.get(service, 'id'));
        return {
          test: t.id,
          tags: _.get(encounter, 'tags'),
          invoiceItem: _.get(billingItem, 'id'),
          service: _.get(service, 'id'),
        };
      }),
    }
);

export const buildServicePerformed = ({ request }) => service => ({
  service: service.id,
  provider: _.get(request, 'attendingStaff.id'),
});

export const buildQueueItem = ({
  queue,
  request,
  queueItem,
  patient,
  facility,
  encounter,
  billingItems,
  medicalProcedureOrdersCreateMedicalRecords = true,
  testOrdersCreateMedicalRecords = true,
  testPackageCreateMedicalRecord = true,
}) => _.pickBy({
  queue: queue,
  number: queueItem.number,
  subjectType: 'medical-patient',
  subject: patient,
  queues: _.get(request, 'queues'),
  weight: _.get(request, 'weight'),
  meta: _.pickBy({
    testOrders: _.map(
      _.get(request, 'diagnosticOrders'),
      buildTestOrder({
        patient,
        facility,
        encounter,
        billingItems,
        services: _.get(request, 'services'),
      }),
    ).filter(Boolean),
    ..._.get(request, 'meta'),
    medicalProcedureOrdersCreateMedicalRecords,
    testOrdersCreateMedicalRecords,
    testPackageCreateMedicalRecord,
    patient,
    peService: _.get(request, 'peService.id'),
    peTemplate: _.get(request, 'peService.formTemplates[0]'),
  }, v => !_.isNil(v) && (!_.isObject(v) || !_.isEmpty(v))),
  metadata: {
    associationKey: _.get(request, 'associationKey'),
  },
  servicesToPerform: _.map(
    _.get(request, 'services'),
    buildServicePerformed({ request, facility }),
  ),
  group: _.get(encounter, 'id'),
}, v => !_.isNil(v) && (!_.isObject(v) || !_.isEmpty(v)));

export const buildBillingItems = ({
  invoice,
  request,
}) => {
  if (request.isFollowup) return [];

  return request.services?.map(service => {
    const providers = [
      request.attendingStaff,
      ...request.providers || [],
    ].filter(Boolean);
    const commissions = service?.commissions
      ?.map(commission => {
        const provider = providers.find(p => p.uid === commission.provider);
        if (!provider) return;
        return {
          ..._.pick(commission, 'id', 'type', 'subtype', 'providerType', 'amount', 'percentage'),
          commission: commission.id,
          provider: provider.uid,
          ...provider.withholdingTax && { withholdingTax: provider.withholdingTax },
        };
      })
      ?.filter(Boolean);
    const coverages = service?._coverages
      ?.map(coverage => _.pick(coverage, 'id', 'type', 'amount', 'percentage', 'approvalCode', 'paymentMethod'));

    return {
      invoice,
      type: 'service',
      ref: service.id,
      refType: service.type,
      ...service.subtype && { refSubtype: service.subtype },
      providers: providers.map(p => p.uid),
      commissions,
      coverages,
      ..._.pick(service, 'name', 'description', 'price', 'priceCurrency', 'tax', 'taxCode'),
    };
  });
};

export const createBillingItems = ({ sdk }, { invoice, request }) => {
  const billingItems = buildBillingItems({ invoice, request });
  return billingItems?.map(async billingItem => {
    const createdItem = await sdk.service('billing-items').create(billingItem);
    if (createdItem?.type === 'service') {
      await sdk.service('service-performed')
        .create({
          group: createdItem?.id,
          service: createdItem?.ref,
        })
        // ignore errors for service performed
        .catch(() => {});
    }
    return createdItem;
  });
};

export const buildRecord = ({ record, type, patient, facility, encounter }) => ({
  ...record,
  type,
  patient,
  facility,
  encounter,
});

export const buildRecordDispatch = ({ state, dispatch }, data) => type => {
  const prop = _.camelCase(type);
  if (type === 'chief-complaint' &&
    _.isEmpty(_.get(data, 'request.chiefComplaint'))) return;
  // omit type when checking contents
  // since vitals and attachment now have a pre-set type
  if (type !== 'chief-complaint' && _.isEmpty(_.omit(state[prop], 'type'))) return;

  const record = type === 'chief-complaint'
    ? {
      text: _.get(data, 'request.chiefComplaint'),
      provider: _.get(data, 'request.attendingStaff.uid'),
    }
    : state[prop];

  return dispatch(
    'medical-records/createGenericMedicalRecord',
    { payload: buildRecord({ ...data, record, type }) },
    { root: true },
  );
};

export const processConsultRequest = (context, data) =>
  ['chief-complaint', 'vitals', 'attachment']
    .map(buildRecordDispatch(context, data))
    .filter(Boolean);

export const processProcedureRequest = ({ dispatch }, data) => {
  const orders = data.request?.procedureOrders;
  const ordersToCreate = orders?.filter(o => !o?.id);
  if (!ordersToCreate?.length) return;
  return dispatch(
    'medical-records/createGenericMedicalRecord',
    {
      payload: ordersToCreate?.map(o => ({
        ...o,
        provider: data.request?.attendingStaff?.uid,
        patient: data.patient,
        facility: data.facility,
        encounter: data.encounter,
      })),
    },
    { root: true },
  );
};

export const processRequest = (context, data) => {
  switch (data.request.type) {
    case 'consult':
      return processConsultRequest(context, data);
    case 'procedure':
      return processProcedureRequest(context, data);
    default:
      return null;
  }
};

export const separateZippedRequests = zippedRequests => ({
  lab: _.filter(zippedRequests, ([request]) => request.type === 'lab'),
  others: _.filter(zippedRequests, ([request]) => request.type !== 'lab'),
});

export const unzipRequestItems = zippedRequests => _.map(zippedRequests,
  // request variable is throwaway and unused here,
  // but it's crucial to demonstrating what the destructured item of
  // zippedRequests actually contains
  // as opposed to e.g. zipped => zipped[1]
  // which loses that valuable information altogether
  // eslint-disable-next-line
  ([ request, requestItem ]) => requestItem);

export const separateZippedRequestItems = zippedRequests =>
  _.mapValues(separateZippedRequests(zippedRequests), unzipRequestItems);

export const separateRequestItems = (requests, requestItems) =>
  separateZippedRequestItems(_.zip(requests, requestItems));
