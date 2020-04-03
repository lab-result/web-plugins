import { getTime, startOfDay, eachDay } from 'date-fns';
import _ from 'lodash';

const generateDateMap = (startDate, endDate) =>
  _.reduce(eachDay(startDate, endDate), (acc, val) => ({
    ...acc,
    [getTime(startOfDay(val))]: [],
  }), {});

export const groupByDay = (data, { startDate, endDate, key = 'date' }) =>
  _.defaults(
    _.groupBy(data, d => getTime(startOfDay(d[key]))),
    generateDateMap(startDate, endDate),
  );
