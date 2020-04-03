/**
 * Fetches active and deferred queue items of a queue separately, for convenient
 * displaying in a queue list.
 *
 * @typedef {import('@mycure/sdk').QueueItem} QueueItem
 *
 * @typedef {Object} QueueListQueueItems
 * @property {QueueItem[]} activeQueueItems
 * @property {QueueItem[]} deferredQueueItems
 *
 * @param {Object} sdk MYCURE SDK instance
 * @param {Object} opts
 * @param {string} opts.queue
 * @param {number} [opts.limit=20]
 * @param {number} [opts.skip]
 * @return {QueueListQueueItems}
 */
export async function getQueueListQueueItems (sdk, opts) {
  opts = Object.assign({ limit: 20 }, opts);

  const baseQuery = { queue: opts.queue };
  if (typeof opts.limit === 'number') baseQuery.$limit = opts.limit;
  if (typeof opts.skip === 'number') baseQuery.$skip = opts.skip;

  const { items: activeQueueItems } = await sdk.service('queue-items').find({
    ...baseQuery,
    $active: true,
    $sort: { order: 1 },
  });
  const { items: deferredQueueItems } = await sdk.service('queue-items').find({
    ...baseQuery,
    deferredAt: { $exists: true },
    requeueDeferredAt: null,
    finishedAt: null,
  });

  return {
    activeQueueItems,
    deferredQueueItems,
  };
}
