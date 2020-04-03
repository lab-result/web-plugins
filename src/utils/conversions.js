import { compose } from './fn';

const MILLISECONDS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;

export const minutesToMilliseconds = time => {
  return time * MILLISECONDS_PER_MINUTE;
};

export const millisecondsToMinutes = time => {
  return time / MILLISECONDS_PER_MINUTE;
};

export const minutesToHours = time => time * MINUTES_PER_HOUR;
export const hoursToMinutes = time => time / MINUTES_PER_HOUR;

export const hoursToMilliseconds = compose(minutesToMilliseconds, hoursToMinutes);
export const millisecondsToHours = compose(minutesToHours, millisecondsToMinutes);
