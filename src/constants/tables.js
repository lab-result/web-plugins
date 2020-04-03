
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  getTime,
} from 'date-fns';

export const DEFAULT_PAGINATION_VALUE = {
  descending: false,
  page: 1,
  rowsPerPage: 20,
  sortBy: null,
  totalItems: 0,
};

export const DEFAULT_DIAGNOSTIC_STATUS_FILTER_VALUE = { name: 'Pending', status: 'pending' };

export const DEFAULT_DATE_FILTER_VALUE = {
  text: 'Today',
  start: getTime(startOfDay(new Date())),
  end: getTime(endOfDay(new Date())),
  past: false,
};

export const MONTH_DATE_FILTER_VALUE = {
  text: 'This Month',
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
  past: true,
};
