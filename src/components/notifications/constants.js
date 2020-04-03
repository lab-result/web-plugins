import _ from 'lodash';

export const NOTIFICATION_TITLE_MAP = {
  account: 'Your Account',
  'queue-item': 'Queue - Update',
  'medical-encounter': 'Patient Encounter',
  'lis-order': 'LIS - Result',
  'ris-order': 'RIS - Result',
  'inventory-transaction': 'Inventory - Transaction',
  'inventory-stock': 'Inventory - Stocks',
};

const QUEUE_TYPE_ROUTE_BUILDER_MAP = {
  doctor: n => ({
    name: 'emr-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
  receptionist: n => ({
    name: 'registration-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
  nurse: n => ({
    name: 'emr-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
  therapist: n => ({
    name: 'emr-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
  imaging: n => ({
    name: 'ris-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
  lab: n => ({
    name: 'lis-queues',
    params: { queue: _.get(n, 'meta.queue') },
  }),
};

const PURCHASE_ROUTE_BUILDER_MAP = {
  'inventory-supplier': n => ({
    name: 'stock-purchase-order',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
  organization: n => ({
    name: 'stock-transfer-or-request',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
};

const SALES_ROUTE_BUILDER_MAP = {
  'org-member': n => ({
    name: 'stock-dispense',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
  patient: n => ({
    name: 'sales-order-invoice',
    params: { invoice: _.get(n, 'meta.id') },
  }),
};

const TRANSACTION_TYPE_ROUTE_BUILDER_MAP = {
  adjustment: n => ({
    name: 'stock-adjustment',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
  purchase: n => {
    const routeBuilder = _.get(
      PURCHASE_ROUTE_BUILDER_MAP,
      _.get(n, 'meta.supplierType'),
    );
    return routeBuilder && routeBuilder(n);
  },
  sales: n => {
    const routeBuilder = _.get(
      SALES_ROUTE_BUILDER_MAP,
      _.get(n, 'meta.customerType'),
    );
    return routeBuilder && routeBuilder(n);
  },
  return: n => ({
    name: 'stock-return',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
  transfer: n => ({
    name: 'stock-transfer-or-request',
    params: { id: _.get(n, 'meta.id'), action: 'update' },
  }),
  receiving: n => {
    const routeBuilder = _.get(
      PURCHASE_ROUTE_BUILDER_MAP,
      _.get(n, 'meta.transactionObject.supplierType'),
    );
    return routeBuilder && routeBuilder(n);
  },
};

export const NOTIFICATION_ROUTE_BUILDER_MAP = {
  'queue-item': n => {
    const routeBuilder = _.get(
      QUEUE_TYPE_ROUTE_BUILDER_MAP,
      _.get(n, 'meta.queueObject.type'),
    );
    return routeBuilder && routeBuilder(n);
  },
  'medical-encounter': n => ({
    name: 'patient-profile',
    params: { id: _.get(n, 'meta.patient') },
  }),
  'lis-order': () => ({ name: 'lis-tests' }),
  'ris-order': () => ({ name: 'ris-tests' }),
  'inventory-transaction': n => {
    const routeBuilder = _.get(
      TRANSACTION_TYPE_ROUTE_BUILDER_MAP,
      _.get(n, 'meta.type'),
    );
    return routeBuilder && routeBuilder(n);
  },
  'inventory-stock': n => ({
    name: 'stock-purchase-order',
    params: { action: 'create' },
    query: { variant: _.get(n, 'meta.variant') },
  }),
};

const COLOR_MAP = {
  returning: '#5c6bc0',
  appointment: '#5c6bc0',
  added: '#5c6bc0',
  rejected: '#787878',
  approved: '#2cc4cb',
  checkout: '#2cc4cb',
  skipped: '#ffff33',
  warning: '#ffff33',
  diagx: '#18c5a9',
  received: '#18c5a9',
  'purchase-received': '#f39c12',
  remove: '#ff0000',
  expired: '#ff0000',
  'medical-forms': '#f39c12',
  error: '#f75a5f',
  prescription: '#3498db',
  updated: '#ff4081',
  adjusted: '#ff4081',
  'new-patient': '#7fad33',
  product: '#7fad33',
};

export const NOTIFICATION_CODE_COLOR_MAP = {
  'new-receptionist-queue-item': COLOR_MAP.added,
  'new-queue-item': COLOR_MAP.added,
  'requeue-queue-item': COLOR_MAP.returning,
  'defer-queue-item': COLOR_MAP.skipped,
  'new-encounter': COLOR_MAP['new-patient'],
  'finish-encounter': COLOR_MAP.checkout,
  'new-organization-purchase': COLOR_MAP.product,
  'new-adjustment': COLOR_MAP.product,
  'new-transfer-receiving': COLOR_MAP.received,
  'new-purchase-receiving': COLOR_MAP['purchase-received'],
  'approve-organization-purchase': COLOR_MAP.approved,
  'low-stock': COLOR_MAP.error,
  'expiring-stock': COLOR_MAP.warning,
};

export const QUEUE_TYPE_BASE_ROLES_MAP = {
  doctor: ['doctor'],
  receptionist: ['frontdesk'],
  nurse: ['nurse'],
  therapist: ['therapist'],
  imaging: ['imaging'],
  lab: ['lab'],
};

export const QUEUE_ROUTE_BASE_ROLES_MAP = {
  'emr-queues': ['doctor', 'nurse', 'therapist', 'releasing'],
  'registration-queues': ['frontdesk'],
  'lis-queues': ['lab'],
  'ris-queues': ['imaging'],
};
