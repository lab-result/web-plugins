import { sumObjects } from './list';
import { computeBillItemTotalPrice } from '@mycure/sdk/lib/utils/billing';
import _ from 'lodash';

const getRefTypeKey = billingItem => {
  // diagnostic billing items have refSubtype
  // which can be lab or imaging
  if (billingItem.refType === 'diagnostic') return billingItem.refSubtype;

  return billingItem.refType;
};

const getAmountReceivedByRefType = billingItem => ({
  [getRefTypeKey(billingItem)]: computeBillItemTotalPrice(billingItem),
});

export const getTotalAmountReceivedByRefType = billingItems =>
  sumObjects(_.map(billingItems, getAmountReceivedByRefType));

const getPaymentEntryKey = (payment, paymentMethods) =>
  _.get(payment, 'paymentMethodType') ||
    // backwards compatibility
    _.get(_.find(paymentMethods, m => m.code === payment.paymentMethod), 'type');

const getPaymentEntry = paymentMethods => payment => ({
  [getPaymentEntryKey(payment, paymentMethods)]: +payment.amount,
});

export const getPaymentsByType = (payments, paymentMethods) =>
  sumObjects(_.map(payments, getPaymentEntry(paymentMethods)));
