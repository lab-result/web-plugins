/**
 * @param {object} sdk MYCURE SDK instance
 * @param {object} opts
 * @param {string} opts.organization
 * @param {string|object} [opts.id]
 * @param {string|object} [opts.uid]
 * @param {string|object} [opts.roles]
 * @param {string|object} [opts.stockRooms]
 * @param {string} [opts.searchString]
 * @param {number} [opts.limit=20]
 * @param {number} [opts.skip]
 */
export async function getOrganizationMembers (sdk, opts) {
  opts = Object.assign({ limit: 20 }, opts);
  const query = {
    organization: opts.organization,
  };
  if (opts.id) query.id = opts.id;
  if (opts.uid) query.uid = opts.uid;
  if (opts.roles) query.roles = opts.roles;
  if (opts.stockRooms) query.stockRooms = opts.stockRooms;
  if (opts.searchString) {
    query.$search = {
      organization: opts.organization,
      text: opts.searchString,
      limit: opts.limit,
      skip: opts.skip,
    };
  } else {
    query.$limit = opts.limit;
    query.$skip = opts.skip;
  }
  return sdk.service('organization-members').find(query);
}
