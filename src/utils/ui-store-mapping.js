/**
 * Maps the pagination object from VDataTable into pagination options for
 * {@link paginateQuery}.
 *
 * @see https://vuetifyjs.com/en/components/data-tables#data-table
 *
 * @typedef {PaginateOptions}
 * @property {number} pageNo - Page number to query.
 * @property {number} pageSize - Number of documents per page.
 *
 * @param {Pagination} pagination - Pagination object from VDataTable.
 * @param {number} pagination.page - Current VDataTable page.
 * @param {number} pagination.rowsPerPage - Number of rows per page in VDataTable.
 * @return {PaginateOptions} Pagination options for paginateQuery.
 */
export const mapPagination = ({ page, rowsPerPage }) => ({
  pageNo: page,
  pageSize: rowsPerPage,
});

/**
 * Maps the date filter object from DateFilter into date filter options for
 * {@link limitQueryByDate}.
 *
 * @typedef {number} Timestamp
 *
 * @typedef {DateFilter}
 * @property {Timestamp} start
 * @property {Timestamp} end
 *
 * @typedef {DateFilterOptions}
 * @property {Timestamp} startDate
 * @property {Timestamp} endDate
 *
 * @param {DateFilter} dateFilter - Date filter object from DateFilter component.
 * @return {DateFilterOptions} Date filter options for limitQueryByDate.
 */
export const mapDateFilter = ({ start, end }) => ({
  startDate: start,
  endDate: end,
});
