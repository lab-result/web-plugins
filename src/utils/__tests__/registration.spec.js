import * as utils from '../registration';
import faker from 'faker';

describe('buildPrecedingEncounterUpdate', () => {
  it('should return nullish for new visitType', () => {
    const update = utils.buildPrecedingEncounterUpdate({ visitType: 'new' });
    expect(update).toBeFalsy();
  });

  it('should return nullish for nullish precedingEncounter', () => {
    const update = utils.buildPrecedingEncounterUpdate({ visitType: 'followup' });
    expect(update).toBeFalsy();
  });

  it('should build preceding and precedingParent with precedingEncounter details without latestFollowupEncounter', () => {
    const precedingEncounter = { id: faker.random.uuid() };
    const update = utils.buildPrecedingEncounterUpdate({
      visitType: 'followup',
      precedingEncounter,
    });
    expect(update).toEqual({
      preceding: precedingEncounter.id,
      precedingParent: precedingEncounter.id,
    });
  });

  it('should build preceding and precedingParent with precedingEncounter details with latestFollowupEncounter', () => {
    const precedingEncounter = {
      id: faker.random.uuid(),
      latestFollowupEncounter: { id: faker.random.uuid() },
    };
    const update = utils.buildPrecedingEncounterUpdate({
      visitType: 'followup',
      precedingEncounter,
    });
    expect(update).toEqual({
      preceding: precedingEncounter.latestFollowupEncounter.id,
      precedingParent: precedingEncounter.id,
    });
  });
});

describe('buildPeContractUpdate', () => {
  it('should return nullish for nullish insurancePatient', () => {
    const update = utils.buildPeContractUpdate({});
    expect(update).toBeFalsy();
  });

  it('should return nullish for non-matching service', () => {
    const insurancePatient = { meta: { service: 'service' } };
    const requests = Array(5).fill({ services: [{ id: 'no-match' }] });
    const update = utils.buildPeContractUpdate({ requests, insurancePatient });
    expect(update).toBeFalsy();
  });

  it('should return peContract from insurancePatient details for matching service', () => {
    const insurancePatient = {
      id: faker.random.uuid(),
      meta: { service: 'service' },
      insurer: faker.random.uuid(),
    };
    const requests = [{ services: [{ id: 'service' }] }];
    const update = utils.buildPeContractUpdate({ requests, insurancePatient });
    expect(update).toEqual({
      peContract: insurancePatient.id,
      peContractInsurer: insurancePatient.insurer,
    });
  });
});

describe('getRequestTags', () => {
  it('should return PE service tags if existing', () => {
    const request = { peService: { tags: Array(2).fill(0).map(() => faker.random.word()) } };
    const tags = utils.getRequestTags(request);
    expect(tags).toEqual(request.peService.tags);
  });

  it('should return "Consult" for consultation requests', () => {
    const request = { type: 'consult' };
    const tags = utils.getRequestTags(request);
    expect(tags).toBe('Consult');
  });
});

describe('buildTagsUpdate', () => {
  it('should return nullish for no tags', () => {
    const requests = Array(5).fill({ type: 'lab' });
    const update = utils.buildTagsUpdate({ requests });
    expect(update).toBeFalsy();
  });

  it('should return flat array of all unique tags', () => {
    const requests = [
      { type: 'consult' },
      { peService: { tags: ['tag-1', 'tag-2'] } },
      { peService: { tags: ['tag-2', 'tag-3'] } },
      { peService: { tags: ['tag-4', 'tag-5'] } },
      { type: 'consult' },
    ];
    const update = utils.buildTagsUpdate({ requests });
    expect(update).toEqual({ tags: ['Consult', 'tag-1', 'tag-2', 'tag-3', 'tag-4', 'tag-5'] });
  });
});

describe('buildEncounter', () => {
  it('should build encounter based on behavior of buildPrecedingEncounterUpdate, buildPeContractUpdate, buildTagsUpdate', () => {
    const data = {
      patient: 'patient',
      facility: 'facility',
      visitType: 'followup',
      precedingEncounter: { id: 'preceding-encounter' },
      insurancePatient: {
        id: 'insurance-patient',
        meta: { service: 'insured-service' },
        insurer: 'insurer',
      },
      requests: [
        {
          type: 'consult',
          services: [{ id: 'insured-service' }],
        },
        {
          type: 'pme',
          services: [{ id: 'pe', tags: ['tags'] }],
          peService: { id: 'pe', tags: ['tags'] },
        },
      ],
    };
    const encounter = utils.buildEncounter(data);
    expect(encounter).toEqual({
      patient: 'patient',
      facility: 'facility',
      preceding: 'preceding-encounter',
      precedingParent: 'preceding-encounter',
      peContract: 'insurance-patient',
      peContractInsurer: 'insurer',
      tags: ['Consult', 'tags'],
    });
  });
});

describe('buildTestOrder', () => {
  it('should return null for empty order.tests', () => {
    const testOrder = utils.buildTestOrder({})({ tests: [] });
    expect(testOrder).toBe(null);
  });

  it('should build DiagnosticOrder with complete details from MedicalTestOrder order', () => {
    const data = {
      patient: 'patient',
      facility: 'facility',
      encounter: { id: 'encounter', tags: ['tags'] },
      services: [
        { id: 'service-1', ref: 'test-1' },
        { id: 'service-2', ref: 'test-2' },
      ],
      billingItems: [
        { id: 'billing-item-1', ref: 'service-1' },
        { id: 'billing-item-2', ref: 'service-2' },
      ],
    };
    const order = {
      type: 'laboratory',
      reason: 'reason',
      requestingPhysician: 'requesting physician',
      diagnosisCode: 'diagnosis-code',
      diagnosisText: 'diagnosis-text',
      tests: [
        { id: 'test-1' },
      ],
    };
    const testOrder = utils.buildTestOrder(data)(order);
    expect(testOrder).toEqual({
      patient: 'patient',
      facility: 'facility',
      encounter: 'encounter',
      type: 'laboratory',
      reason: 'reason',
      requestingPhysician: 'requesting physician',
      diagnosisCode: 'diagnosis-code',
      diagnosisText: 'diagnosis-text',
      tests: [
        {
          test: 'test-1',
          tags: ['tags'],
          invoiceItem: 'billing-item-1',
          service: 'service-1',
        },
      ],
    });
  });
});

describe('buildServicePerformed', () => {
  it('should build ServicePerformed with details from request and service', () => {
    const request = { attendingStaff: { id: faker.random.uuid() } };
    const service = { id: faker.random.uuid() };
    const servicePerformed = utils.buildServicePerformed({ request })(service);
    expect(servicePerformed).toEqual({
      service: service.id,
      provider: request.attendingStaff.id,
    });
  });
});

describe('buildQueueItem', () => {
  it('should build queue item with complete details', () => {
    const data = {
      queue: 'queue',
      request: {
        queues: [{ id: 'queue-1' }],
        weight: 0,
        meta: { testPackage: 'test-package' },
        peService: { id: 'pe-service', formTemplates: ['form-template'] },
        services: [{ id: 'service-1' }],
        attendingStaff: { id: 'attending-staff' },
        associationKey: 'request-1',
      },
      queueItem: { id: 'queue-item', number: 1 },
      patient: 'patient',
      facility: 'facility',
      encounter: {},
      billingItems: [],
    };
    const queueItem = utils.buildQueueItem(data);
    expect(queueItem).toEqual({
      queue: 'queue',
      number: 1,
      subjectType: 'medical-patient',
      subject: 'patient',
      queues: [{ id: 'queue-1' }],
      weight: 0,
      meta: {
        testPackage: 'test-package',
        medicalProcedureOrdersCreateMedicalRecords: true,
        testOrdersCreateMedicalRecords: true,
        testPackageCreateMedicalRecord: true,
        patient: 'patient',
        peService: 'pe-service',
        peTemplate: 'form-template',
      },
      metadata: {
        associationKey: 'request-1',
      },
      servicesToPerform: [{ service: 'service-1', provider: 'attending-staff' }],
    });
  });
});

describe('buildBillingItems', () => {
  it('should return empty array for followup request', () => {
    const billingItems = utils.buildBillingItems({ request: { isFollowup: true } });
    expect(billingItems).toEqual([]);
  });

  it('should build billing items with complete details', () => {
    const data = {
      invoice: 'invoice',
      facility: 'facility',
      request: {
        services: [
          {
            id: 'service-1',
            type: 'clinical-consultation',
            name: 'service 1',
            description: 'description 1',
            price: 1000,
            priceCurrency: 'PHP',
            tax: 12,
            taxCode: 'VAT',
            commissions: [
              { id: 'commission-1', provider: 'attending-staff', amount: 100 },
            ],
            _coverages: [{ id: 'coverage-1' }],
          },
          {
            id: 'service-2',
            type: 'diagnostic',
            subtype: 'lab',
            name: 'service 2',
            description: 'description 2',
            price: 2000,
            priceCurrency: 'PHP',
            tax: 12,
            taxCode: 'VAT',
            commissions: [
              { id: 'commission-2', provider: 'provider-1', amount: 200 },
            ],
            _coverages: [{ id: 'coverage-2' }],
          },
        ],
        attendingStaff: { uid: 'attending-staff', withholdingTax: 20 },
        providers: [{ uid: 'provider-1' }],
      },
    };
    const billingItems = utils.buildBillingItems(data);
    expect(billingItems).toEqual([
      {
        invoice: 'invoice',
        type: 'service',
        ref: 'service-1',
        refType: 'clinical-consultation',
        providers: [
          'attending-staff',
          'provider-1',
        ],
        commissions: [
          {
            id: 'commission-1',
            provider: 'attending-staff',
            amount: 100,
            commission: 'commission-1',
            withholdingTax: 20,
          },
        ],
        coverages: [
          {
            id: 'coverage-1',
          },
        ],
        name: 'service 1',
        description: 'description 1',
        price: 1000,
        priceCurrency: 'PHP',
        tax: 12,
        taxCode: 'VAT',
      },
      {
        invoice: 'invoice',
        type: 'service',
        ref: 'service-2',
        refType: 'diagnostic',
        refSubtype: 'lab',
        providers: [
          'attending-staff',
          'provider-1',
        ],
        commissions: [
          {
            id: 'commission-2',
            provider: 'provider-1',
            amount: 200,
            commission: 'commission-2',
          },
        ],
        coverages: [
          {
            id: 'coverage-2',
          },
        ],
        name: 'service 2',
        description: 'description 2',
        price: 2000,
        priceCurrency: 'PHP',
        tax: 12,
        taxCode: 'VAT',
      },
    ]);
  });
});

describe('createBillingItems', () => {
  it('should call dispatch with results of buildBillingItems', () => {
    const data = {
      invoice: 'invoice',
      facility: 'facility',
      request: {
        services: [
          {
            id: 'service-1',
            type: 'clinical-consultation',
            name: 'service 1',
            description: 'description 1',
            price: 1000,
            priceCurrency: 'PHP',
            tax: 12,
            taxCode: 'VAT',
            commissions: [
              { id: 'commission-1', provider: 'attending-staff', amount: 100 },
            ],
            _coverages: [{ id: 'coverage-1' }],
          },
          {
            id: 'service-2',
            type: 'diagnostic',
            subtype: 'lab',
            name: 'service 2',
            description: 'description 2',
            price: 2000,
            priceCurrency: 'PHP',
            tax: 12,
            taxCode: 'VAT',
            commissions: [
              { id: 'commission-2', provider: 'provider-1', amount: 200 },
            ],
            _coverages: [{ id: 'coverage-2' }],
          },
        ],
        attendingStaff: { uid: 'attending-staff', withholdingTax: 20 },
        providers: [{ uid: 'provider-1' }],
      },
    };
    const mockCreate = jest.fn();
    const sdk = {
      service () {
        return { create: mockCreate };
      },
    };
    utils.createBillingItems({ sdk }, data);
    expect(mockCreate.mock.calls.length).toBe(2);
    const billingItems = utils.buildBillingItems(data);
    expect(mockCreate.mock.calls[0]).toEqual([billingItems[0]]);
    expect(mockCreate.mock.calls[1]).toEqual([billingItems[1]]);
  });
});

describe('buildRecord', () => {
  it('should build spread data into passed-in record', () => {
    const data = {
      record: { height: faker.random.number() },
      type: 'vitals',
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
    };
    const record = utils.buildRecord(data);
    expect(record).toEqual({
      height: data.record.height,
      type: data.type,
      patient: data.patient,
      facility: data.facility,
      encounter: data.encounter,
    });
  });
});

describe('buildRecordDispatch', () => {
  it('should grab record from state then call dispatch', () => {
    const state = { vitals: { height: 100 } };
    const dispatch = jest.fn();
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
    };
    const type = 'vitals';
    utils.buildRecordDispatch({ state, dispatch }, data)(type);
    expect(dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      { payload: utils.buildRecord({ ...data, record: state.vitals, type }) },
      { root: true },
    ]);
  });

  it('should grab chief complaint from request as special case', () => {
    const dispatch = jest.fn();
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
      request: {
        chiefComplaint: faker.random.words(),
        attendingStaff: { uid: faker.random.uuid() },
      },
    };
    const type = 'chief-complaint';
    utils.buildRecordDispatch({ dispatch }, data)(type);
    expect(dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: {
            text: data.request.chiefComplaint,
            provider: data.request.attendingStaff.uid,
          },
          type,
        }),
      },
      { root: true },
    ]);
  });
});

describe('processConsultRequest', () => {
  it('should call buildRecordDispatch for chief complaint, vitals, and attachment', () => {
    const context = {
      state: {
        vitals: { height: 100 },
        attachment: { title: faker.random.words() },
      },
      dispatch: jest.fn(),
    };
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
      request: {
        chiefComplaint: faker.random.words(),
        attendingStaff: { uid: faker.random.uuid() },
      },
    };
    utils.processConsultRequest(context, data);
    expect(context.dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: {
            text: data.request.chiefComplaint,
            provider: data.request.attendingStaff.uid,
          },
          type: 'chief-complaint',
        }),
      },
      { root: true },
    ]);
    expect(context.dispatch.mock.calls[1]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: context.state.vitals,
          type: 'vitals',
        }),
      },
      { root: true },
    ]);
    expect(context.dispatch.mock.calls[2]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: context.state.attachment,
          type: 'attachment',
        }),
      },
      { root: true },
    ]);
  });
});

describe('processProcedureRequest', () => {
  it('should dispatch createGenericMedicalRecord with procedure orders', () => {
    const dispatch = jest.fn();
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
      request: {
        procedureOrders: [
          { service: 'service-1' },
          { service: 'service-2' },
        ],
      },
    };
    utils.processProcedureRequest({ dispatch }, data);
    expect(dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: [
          {
            ...data.request.procedureOrders[0],
            patient: data.patient,
            facility: data.facility,
            encounter: data.encounter,
          },
          {
            ...data.request.procedureOrders[1],
            patient: data.patient,
            facility: data.facility,
            encounter: data.encounter,
          },
        ],
      },
      { root: true },
    ]);
  });
});

describe('processRequest', () => {
  it('should call processConsultRequest for consult requests', () => {
    const context = {
      state: {
        vitals: { height: 100 },
        attachment: { title: faker.random.words() },
      },
      dispatch: jest.fn(),
    };
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
      request: {
        type: 'consult',
        chiefComplaint: faker.random.words(),
        attendingStaff: { uid: faker.random.uuid() },
      },
    };
    utils.processRequest(context, data);
    expect(context.dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: {
            text: data.request.chiefComplaint,
            provider: data.request.attendingStaff.uid,
          },
          type: 'chief-complaint',
        }),
      },
      { root: true },
    ]);
    expect(context.dispatch.mock.calls[1]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: context.state.vitals,
          type: 'vitals',
        }),
      },
      { root: true },
    ]);
    expect(context.dispatch.mock.calls[2]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: utils.buildRecord({
          ...data,
          record: context.state.attachment,
          type: 'attachment',
        }),
      },
      { root: true },
    ]);
  });

  it('should call processProcedureRequest for procedure requests', () => {
    const context = { dispatch: jest.fn() };
    const data = {
      patient: faker.random.uuid(),
      facility: faker.random.uuid(),
      encounter: faker.random.uuid(),
      request: {
        type: 'procedure',
        procedureOrders: [
          { service: 'service-1' },
          { service: 'service-2' },
        ],
      },
    };
    utils.processRequest(context, data);
    expect(context.dispatch.mock.calls[0]).toEqual([
      'medical-records/createGenericMedicalRecord',
      {
        payload: [
          {
            ...data.request.procedureOrders[0],
            patient: data.patient,
            facility: data.facility,
            encounter: data.encounter,
          },
          {
            ...data.request.procedureOrders[1],
            patient: data.patient,
            facility: data.facility,
            encounter: data.encounter,
          },
        ],
      },
      { root: true },
    ]);
  });
});

describe('separateZippedRequests', () => {
  it('should separate lab requests from all others', () => {
    const requests = [
      [{ type: 'lab' }, { id: '1' }],
      [{ type: 'consult' }, { id: '2' }],
      [{ type: 'procedure' }, { id: '3' }],
      [{ type: 'lab' }, { id: '4' }],
      [{ type: 'pme' }, { id: '5' }],
    ];
    const separated = utils.separateZippedRequests(requests);
    expect(separated).toEqual({
      lab: [requests[0], requests[3]],
      others: [requests[1], requests[2], requests[4]],
    });
  });
});

describe('unzipRequestItems', () => {
  it('should grab requestItem from zipped array of request and requestItem', () => {
    const requests = [
      [{ type: 'lab' }, { id: '1' }],
      [{ type: 'lab' }, { id: '2' }],
      [{ type: 'lab' }, { id: '3' }],
      [{ type: 'lab' }, { id: '4' }],
      [{ type: 'lab' }, { id: '5' }],
    ];
    const unzipped = utils.unzipRequestItems(requests);
    expect(unzipped).toEqual([
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
    ]);
  });
});

describe('separateZippedRequestItems', () => {
  it('should separate lab requests as well as unzip requestItems', () => {
    const requests = [
      [{ type: 'lab' }, { id: '1' }],
      [{ type: 'consult' }, { id: '2' }],
      [{ type: 'procedure' }, { id: '3' }],
      [{ type: 'lab' }, { id: '4' }],
      [{ type: 'pme' }, { id: '5' }],
    ];
    const separated = utils.separateZippedRequestItems(requests);
    expect(separated).toEqual({
      lab: [{ id: '1' }, { id: '4' }],
      others: [{ id: '2' }, { id: '3' }, { id: '5' }],
    });
  });
});

describe('separateRequestItems', () => {
  it('should separate lab requestItems based on passed in requests', () => {
    const requests = [
      { type: 'lab' },
      { type: 'consult' },
      { type: 'procedure' },
      { type: 'lab' },
      { type: 'pme' },
    ];
    const requestItems = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
    ];
    const separated = utils.separateRequestItems(requests, requestItems);
    expect(separated).toEqual({
      lab: [{ id: '1' }, { id: '4' }],
      others: [{ id: '2' }, { id: '3' }, { id: '5' }],
    });
  });
});
