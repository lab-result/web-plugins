import { prettifyNameFirst } from './string';
import _ from 'lodash';

const getPatientNameObject = queueItem =>
  _.get(queueItem, 'meta.patientDetails.name') ||
    _.get(queueItem, 'meta.patientName');

const getPatientName = queueItem => {
  const nameObject = getPatientNameObject(queueItem);
  return nameObject ? prettifyNameFirst(nameObject) : 'this patient';
};

const getNamedPostponeMessage = name =>
  `Do you want to postpone ${name}? You can put patient back to queue from the Postponed list later.`;

const getNamedRequeueMessage = name =>
  `Do you want to put ${name} back into the queue?`;

const getNamedCancelMessage = name =>
  `All pending queues, records, and requests related to ${name}'s visit today will be deleted. Are you sure you want to cancel patient's visit?`;

/**
 * Get message for postponing a queue item.
 *
 * @param {QueueItem} queueItem
 * @return {string}
 */
export const getPostponeMessage = queueItem =>
  getNamedPostponeMessage(getPatientName(queueItem));

/**
 * Get message for requeueing a queue item.
 *
 * @param {QueueItem} queueItem
 * @return {string}
 */
export const getRequeueMessage = queueItem =>
  getNamedRequeueMessage(getPatientName(queueItem));

/**
 * Get message for canceling a queue item.
 *
 * @param {QueueItem} queueItem
 * @return {string}
 */
export const getCancelMessage = queueItem =>
  getNamedCancelMessage(getPatientName(queueItem));
