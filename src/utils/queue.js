import _ from 'lodash';

/**
 * Permittee is a generalized entity that can either be a Reader or a Writer.
 *
 * @typedef {import('@mycure/sdk').Queue} Queue
 *
 * @typedef {Object} PermitteeConfig
 * @property {string[]} privilege
 * @property {string[]} member
 * @property {string[]} role
 */

const getPermitteePair = permittee => _.split(permittee, '::');

const getPermitteePairs = permittees => _.map(permittees, getPermitteePair);

const collatePermittees = permitteePairs => _.reduce(
  permitteePairs,
  (acc, [type, id]) => ({ ...acc, [type]: _.concat(acc[type], id) }),
  { privilege: [], member: [], role: [] },
);

/**
 * Parses out a queue's readers in object form.
 *
 * @example
 * const queue = { id: '1', readers: 'role::admin,privilege::mf_patientRead' };
 * console.log(parseReaders(queue));
 * // { role: ['admin'], privilege: ['mf_patientRead'] }
 *
 *
 * @param {Queue} queue
 * @return {ReaderConfig}
 */
export const parseReaders = queue => collatePermittees(getPermitteePairs(queue.readers));

/**
 * Like {@link parseReaders}, but for a queue's writers.
 */
export const parseWriters = queue => collatePermittees(getPermitteePairs(queue.writers));
