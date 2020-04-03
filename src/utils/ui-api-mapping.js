/**
 * Maps the pagination object from VDataTable into pagination options for the
 * MYCURE API.
 *
 * @see https://vuetifyjs.com/en/components/data-tables#data-table
 *
 * @typedef {PaginateOptions}
 * @property {number} $limit - Number of items to be queried.
 * @property {number} $skip - Number of items to skip in the query.
 *
 * @param {Pagination} pagination - Pagination object from VDataTable.
 * @param {number} pagination.page - Current VDataTable page.
 * @param {number} pagination.rowsPerPage - Number of rows per page in VDataTable.
 * @param {Object} [opts]
 * @param {string} [opts.limitOp='$limit']
 * @param {string} [opts.skipOp='$skip']
 * @return {PaginateOptions} Pagination options for the API.
 */
export const mapPagination = (pagination, opts = {}) => {
  const { page, rowsPerPage } = pagination;
  const { limitOp = '$limit', skipOp = '$skip' } = opts;
  return {
    [limitOp]: rowsPerPage,
    [skipOp]: (page - 1) * rowsPerPage,
  };
};
