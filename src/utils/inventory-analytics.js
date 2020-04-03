import { isSameDay, eachDay } from 'date-fns';
import _ from 'lodash';

const getReportEntryKey = history => {
  switch (history.transactionType) {
    case 'sales':
      return 'consumed';
    case 'adjustment':
      if (history.appliedAdjustment > 0) return 'refills';
      else return 'consumed';
    case 'return':
      return 'returns';
    case 'transfer':
      return 'transfers';
    case 'receiving':
      return 'refills';
    case 'purchase':
      return 'refills';
    default:
      // for omission
      return 'unknown';
  }
};

const getReportEntry = history => ({
  [getReportEntryKey(history)]: Math.abs(history.appliedAdjustment || 0),
});

const sumReports = (report1, report2) =>
  _.mergeWith(report1, report2, (a = 0, b = 0) => +a + +b);

/**
 * Extracts a report of consumed, returned, and refilled items from an array of
 * stock histories.
 *
 * @example
 * const histories = [
 *   {transactionType: 'sales', appliedAdjustment: 1},
 *   {transactionType: 'adjustment', appliedAdjustment: 1},
 *   {transactionType: 'adjustment', appliedAdjustment: -1},
 *   {transactionType: 'return', appliedAdjustment: 1},
 *   {transactionType: 'receiving', appliedAdjustment: 1},
 *   {transactionType: 'purchase', appliedAdjustment: 1},
 * ];
 * console.log(getReport(histories));
 * // {consumed: 2, returns: 1, refills: 3}
 *
 * @param {InventoryStock[]} histories - Array of stock histories to extract a
 *                                       report from.
 * @return {Object} Report of all total consumed, returned, and refilled items.
 */
export const getReport = histories => _.chain(histories)
  .map(getReportEntry)
  .reduce(sumReports)
  .omit('unknown')
  .value();

const getHistoryPreRangeStart = (variant, stockRoom) => {
  if (_.isEmpty(stockRoom)) {
    return _.get(variant, 'stocks[0].historyPreRangeStart');
  } else {
    const stocks = _.get(variant, 'stocks');
    const matchingStock = _.find(stocks, s => s.stockRoom === stockRoom);
    return _.get(matchingStock, 'historyPreRangeStart');
  }
};

/**
 * Extracts a variant's stock history.
 *
 * @param {InventoryVariant} variant - variantVariant whose stock history will
 *                                     be extracted.
 * @param {String} stockRoom
 * @return {InventoryStock[]} Array of stock histories for the variant.
 */
export const getHistory = (variant, stockRoom) => {
  if (_.isEmpty(stockRoom)) {
    return _.get(variant, 'stocks[0].history');
  } else {
    const stocks = _.get(variant, 'stocks');
    const matchingStock = _.find(stocks, s => s.stockRoom === stockRoom);
    return _.get(matchingStock, 'history');
  }
};

/**
 * Filters out a variant's stock history for only the specific day.
 *
 * @param {InventoryVariant} variant - Variant whose stock history will be filtered.
 * @param {Date} date - Day for which stock history will be filtered.
 * @param {String} stockRoom
 * @return {InventoryStock[]} Array of stock histories for the specified variant
 * and day.
 */
export const getDailyHistory = (variant, date, stockRoom) =>
  _.filter(getHistory(variant, stockRoom), h => isSameDay(date, new Date(h._createdAt)));

const getPrevStock = (variant, stockRoom) => {
  // if historyPreRangeStart exists, get latest quantity
  const historyPreRangeStart = _.sortBy(getHistoryPreRangeStart(variant, stockRoom), 'createdAt').pop();
  if (!_.isEmpty(historyPreRangeStart)) return _.get(historyPreRangeStart, 'quantity');

  // if history exists, get earliest initialStock
  const history = _.sortBy(getHistory(variant, stockRoom), 'createdAt').shift();
  if (!_.isEmpty(history)) return _.get(history, 'initialStock');

  // otherwise, use stock directly
  return _.get(variant, 'stocks[0].quantity');
};

const sumEndStock = (prevStock = 0, {
  consumed = 0,
  transfers = 0,
  returns = 0,
  refills = 0,
}) => +prevStock - +consumed - +transfers + +returns + +refills;

const buildReport = (variant, report, prevStock) => ({
  variant,
  ...report,
  prevStock,
  endStock: sumEndStock(prevStock, report),
});

/**
 * Extracts a variant's total report.
 *
 * @param {InventoryVariant} variant - Variant whose report will be extracted.
 * @param {String} stockRoom - stockRoom
 * @return {Object} Variant report.
 */
export const getVariantReport = (variant, stockRoom) =>
  buildReport(variant, getReport(getHistory(variant, stockRoom)), getPrevStock(variant, stockRoom));

/**
 * Like {@link getVariantReport}, but filtered for a specific day.
 *
 * @param {InventoryVariant} variant - Variant whose daily report will be extracted.
 * @param {Date} date - Day for which the report will be based.
 * @param {String} stockRoom
 * @return {Object} Variant daily report.
 */
export const getVariantDailyReport = (variant, date, stockRoom) =>
  buildReport(variant, getReport(getDailyHistory(variant, date, stockRoom)),
    getPrevStock(variant, stockRoom));

export const getVariantDateRangeReport = (variant, startDate, endDate, stockRoom) => ({
  ...getVariantReport(variant, stockRoom),
  days: _.map(eachDay(startDate, endDate),
    date => getVariantDailyReport(variant, date, stockRoom)),
});
