import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
  differenceInYears,
  differenceInMonths,
} from 'date-fns';

export const parseDateFilter = (filter) => {
  const range = {
    start: new Date(),
    end: new Date(),
  };
  switch (filter) {
    case 'Today':
      range.start = startOfDay(new Date());
      range.end = endOfDay(new Date());
      break;
    case 'Yesterday':
      range.start = startOfDay(subDays(new Date(), 1));
      range.end = endOfDay(subDays(new Date(), 1));
      break;
    case 'Last 7 Days':
      range.start = subDays(new Date(), 6);
      range.end = new Date();
      break;
    case 'Last 30 Days':
      range.start = subDays(new Date(), 29);
      range.end = new Date();
      break;
    case 'This Month':
      range.start = startOfMonth(new Date());
      range.end = endOfMonth(new Date());
      break;
    case 'Last Month':
      range.start = startOfMonth(subMonths(new Date(), 1));
      range.end = endOfMonth(subMonths(new Date(), 1));
      break;
  }
  return range;
};

export const calcExactAgeUtil = (date) => {
  if (!date) return null;
  const diffYears = differenceInYears(new Date(), date);
  const year = `${diffYears} year${diffYears <= 1 ? '' : 's'}`;
  const diffMonths = differenceInMonths(new Date(), date);
  const months = diffMonths - (diffYears * 12);
  const month = `${months} month${months <= 1 ? '' : 's'}`;
  if (diffYears < 1) return month;
  if (diffYears >= 1 && diffYears <= 5) return `${year} ${month}`;
  return diffYears;
};
