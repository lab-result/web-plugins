/**
 * @typedef {Object} Queue
 * @property {string} id
 * @property {string} name
 * @property {string} type
 */

/**
 * @param {object} sdk MYCURE SDK instance
 * @param {object} opts
 * @param {string} opts.organization
 * @param {string} [opts.type] type filter
 * @param {string[]} [opts.types] type filter for multiple types
 * @param {string} [opts.searchString] searchString to use for filtering
 * @param {string[]} [opts.excludedIds] ids to exclude
 * @param {string} [opts.writer] membership id
 * @param {number} [opts.limit=20]
 * @param {number} [opts.skip]
 * @returns {Promise<{ total: number, items: QueueItem }>}
 */
export async function getQueues (sdk, opts) {
  opts = Object.assign({ limit: 20 }, opts);

  const query = {
    organization: opts.organization,
    type: { $nin: ['cashier-pool', 'end-of-encounter'] },
  };
  if (typeof opts.type === 'string' && opts.type) query.type = opts.type;
  if (Array.isArray(opts.types) && opts.types.length) query.type = { $in: opts.types };
  if (Array.isArray(opts.excludedIds) && opts.excludedIds.length) {
    query.id = { $nin: opts.excludedIds };
  }
  if (typeof opts.searchString === 'string' && opts.searchString) {
    query.name = {
      $regex: `^${opts.searchString}`,
      $options: 'i',
    };
  }
  if (typeof opts.writer === 'string' && opts.writer) {
    query.writers = `member::${opts.writer}`;
  }
  if (typeof opts.limit === 'number') query.$limit = opts.limit;
  if (typeof opts.skip === 'number') query.$skip = opts.skip;

  return sdk.service('queues').find(query);
}
