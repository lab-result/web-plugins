import _ from 'lodash';

export const getPrice = item => _.isObject(_.get(item, 'price'))
  ? _.get(item, 'price.value')
  : _.get(item, 'price');

export const getTax = item => _.isObject(_.get(item, 'tax'))
  ? _.get(item, 'tax.value')
  : _.get(item, 'tax');

export const computeTaxTotal = (item, isTaxExclusive) => {
  // no computation necessary if any of the factors are missing
  const price = getPrice(item);
  if (!item.quantity || !price) return;

  // no tax total if tax is missing
  const tax = getTax(item);
  if (!tax) return 0;

  if (isTaxExclusive) {
    // if tax exclusive, simply compute tax total by multiplying
    return +item.quantity * +price * +tax / 100;
  } else {
    // if tax inclusive, tax is implicit
    // compute as portion of price
    const taxFactor = 1 + (+tax / 100);
    const priceWithoutTax = +price / taxFactor;
    const taxTotal = priceWithoutTax * +tax / 100;
    return +item.quantity * taxTotal;
  }
};

export const computeTotal = (item, isTaxExclusive) => {
  // no computation necessary if any of the factors are missing
  const price = getPrice(item);
  if (!item.quantity || !price) return;

  // no tax computation necessary if tax is missing
  // or price is tax inclusive already
  const tax = getTax(item);
  if (!tax || !isTaxExclusive) return +item.quantity * +price;

  // tax is in percentage, so divide by 100 to get the factor
  // note the explicit Number casts
  const taxTotal = +price * +tax / 100;
  const unitTotal = +price + taxTotal;
  return +item.quantity * unitTotal;
};

const extractSku = item => _.get(item, 'sku') || _.get(item, 'variant.sku');
export const getItemsTotal = (item, transactionItems) =>
  _.filter(transactionItems, i => extractSku(i) === extractSku(item))
    .reduce((acc, i) => acc + +i.quantity, 0);
