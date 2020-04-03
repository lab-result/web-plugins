import _ from 'lodash';

/**
 * Template tag for guarding expansions and the corresponding substrings to the
 * left.
 *
 * @example
 * const obj = {a: 1, c: 3};
 * const unguarded = `A is ${obj.a}, B is ${obj.b}, C is ${obj.c}`;
 * const guarded = guard`A is ${obj.a}, B is ${obj.b}, C is ${obj.c}`;
 *
 * console.log(unguarded);
 * // 'A is 1, B is undefined, C is 3'
 * console.log(guarded);
 * // 'A is 1, C is 3'
 */
export const guard = (strings, ...expansions) => {
  const pairs = _.zip(_.dropRight(strings), expansions);
  const result = _.flatten(pairs?.filter(pair => !_.isNil(pair[1]))).join('');

  return result + _.last(strings);
};

/**
 * Like {@link guard}, but guards substrings to the right.
 *
 * @example
 * const obj = {a: 1, c: 3};
 * const unguarded = `${obj.a}A, ${obj.b}B, ${obj.c}C`;
 * const guarded = guard`${obj.a}A, ${obj.b}B, ${obj.c}C`;
 *
 * console.log(unguarded);
 * // '1A, undefinedB, 3C'
 * console.log(guarded);
 * // '1A, 3C'
 */
export const guardRight = (strings, ...expansions) => {
  const pairs = _.zip(expansions, _.tail(strings));
  const result = _.flatten(pairs?.filter(pair => !_.isNil(pair[0]))).join('');

  return _.head(strings) + result;
};

/**
 * Template tag for compiling a template literal for later use. Expansions in
 * the template literal must be string expressions, which will be used as keys.
 *
 * The compiled template takes the form of a function, with a single object
 * argument. The keys will then be used to extract data from this object and
 * interpolate them into the template literal.
 *
 * @see https://lodash.com/docs/4.17.11#template
 *
 * @example
 * const stringifyFruits = compile`apples: ${'apples'}, bananas: ${'bananas'}`;
 *
 * console.log(stringifyFruits({apples: 2, bananas: 3}));
 * // 'apples: 2, bananas: 3'
 * console.log(stringifyFruits({apples: 5}));
 * // 'apples: 5'
 */
export const compile = (strings, ...paths) => data => {
  const expansions = paths.map(path => _.get(data, path));

  return guard(strings, ...expansions);
};

/**
 * Formats a name object into a readable string. Last name first.
 *
 * @example
 * const user = {id: 1, name: {firstName: 'John', lastName: 'Doe'}};
 *
 * console.log(prettifyName(user));
 * // 'Doe, John'
 *
 * @param {Name} name - Name object to be formatted
 * @param {string} name.firstName
 * @param {string} [name.middleInitial]
 * @param {string} name.lastName
 * @param {string} [name.suffix] - Suffixes such as "Jr.", "Sr.", etc.
 */
export const prettifyName = compile`${'lastName'}, ${'firstName'} ${'middleInitial'}, ${'suffix'}`;

/**
 * Like {@link prettifyName}, but first name first.
 */
export const prettifyNameFirst = compile`${'firstName'} ${'middleInitial'} ${'lastName'}, ${'suffix'}`;

/**
 * Injects middleInitial in a name.
 *
 * @example
 * const user = {name: {firstName: 'John', lastName: 'Doe', middleName: 'Something'}};
 *
 * console.log(middleInitalInjector(user.name));
 * // {name: {firstName: 'John', lastName: 'Doe', middleInitial: 'S.', middleName: 'Something'}};
 *
 * @param {Name} name - Name object to be formatted
 * @param {string} [name.middleName] - Subject's middle name
 */
export const middleInitalInjector = (name, isMiddleInitial = true) => {
  return {
    ...name,
    middleInitial: isMiddleInitial
      ? guardRight`${_.head(_.get(name, 'middleName'))}.`.toUpperCase()
      : (_.get(name, 'middleName') || ''),
  };
};

/**
 * Formats doctor details into a full name, including any suffixes. Last name
 * first.
 *
 * Uses {@link prettifyName}.
 *
 * @example
 * const doctorDetails = {
 *   name: { firstName: 'John', lastName: 'Doe' },
 *   doc_professions: ['MD', 'DDS']
 * };
 * console.log(prettifyDoctorNameFirst(doctorDetails));
 * // 'Doe, John, MD, DDS'
 * @param {PersonalDetails} details - Personal details object to be formatted
 * @return {String} Fully formatted name
 */
export const prettifyDoctorName = details => {
  const name = prettifyName(_.get(details, 'name'));
  const academicSuffix = _.get(details, 'name.academicSuffix') || '';
  const professionalSuffix = _.get(details, 'name.professionalSuffix') || '';
  const professions = _.get(details, 'doc_professions') || [];
  const suffixes = [
    ...professions,
    academicSuffix,
    professionalSuffix,
  ].filter(suffix => Boolean(suffix.trim()));

  // - Remove suffix duplicates
  const uniqSuffixes = _.uniqBy(suffixes, suffix => suffix.split('.').join('').toLowerCase());

  const suffixString = _.isEmpty(uniqSuffixes) ? null : _.join(uniqSuffixes, ', ');

  return guard`${name} ${suffixString}`;
};

/**
 * Formats doctor details into a full name, including any suffixes. First name
 * first.
 *
 * Uses {@link prettifyNameFirst}.
 *
 * @example
 * const doctorDetails = {
 *   name: { firstName: 'John', lastName: 'Doe' },
 *   doc_professions: ['MD', 'DDS']
 * };
 * console.log(prettifyDoctorNameFirst(doctorDetails));
 * // 'John Doe, MD, DDS'
 * @param {PersonalDetails} details - Personal details object to be formatted
 * @return {String} Fully formatted name
 */
export const prettifyDoctorNameFirst = details => {
  const name = prettifyNameFirst(_.get(details, 'name'));
  const academicSuffix = _.get(details, 'name.academicSuffix') || '';
  const professionalSuffix = _.get(details, 'name.professionalSuffix') || '';
  const professions = _.get(details, 'doc_professions') || [];
  const suffixes = [
    ...professions,
    academicSuffix,
    professionalSuffix,
  ].filter(suffix => Boolean(suffix.trim()));

  // - Remove suffix duplicates
  const uniqSuffixes = _.uniqBy(suffixes, suffix => suffix.split('.').join('').toLowerCase());

  const suffixString = _.isEmpty(uniqSuffixes) ? null : _.join(uniqSuffixes, ', ');

  return guard`${name} ${suffixString}`;
};

/**
 * Formats doctor details into a full name, including any suffixes. Last name
 * first.
 *
 * Uses {@link prettifyProfessionalName}.
 *
 * @example
 * const doctorDetails = {
 *   firstName: 'John',
 *   lastName: 'Doe' },
 *   doc_professions: ['MD', 'DDS']
 * };
 * console.log(prettifyProfessionalName(doctorDetails));
 * // 'John Doe, MD, DDS'
 * @param {PersonalDetails} details - Personal details object to be formatted
 * @return {String} Fully formatted name
 */
export const prettifyProfessionalName = details => {
  console.warn('orig', details);
  const name = prettifyNameFirst(details);

  console.warn('prettified', name);
  const academicSuffix = _.get(details, 'name.academicSuffix') || '';
  const professionalSuffix = _.get(details, 'name.professionalSuffix') || '';
  const professions = _.get(details, 'doc_professions') || [];
  const suffixes = [
    ...professions,
    academicSuffix,
    professionalSuffix,
  ].filter(suffix => Boolean(suffix.trim()));
  const suffixString = _.isEmpty(suffixes) ? null : _.join(suffixes, ', ');

  return guard`${name}, ${suffixString}`;
};

/**
 * Formats an address object into a readable string.
 *
 * @example
 * const address = {
 *   street1: "#107 Maginhawa St., Brgy. Teacher's Village",
 *   city: 'Quezon City',
 *   country: 'PHL'
 * }
 *
 * console.log(prettifyAddress(address));
 * // "#107 Maginhawa St., Brgy. Teacher's Village, Quezon City, PHL"
 *
 * @param {Address} address - Address object to be formatted
 * @param {string} [address.street1]
 * @param {string} [address.street2]
 * @param {string} [address.municipality]
 * @param {string} [address.city]
 * @param {string} [address.state]
 * @param {string} [address.province]
 * @param {string} [address.country]
 */
export const prettifyAddress = compile`${'street1'}, ${'street2'}, ${'municipality'}, ${'city'}, ${'state'}, ${'province'}, ${'country'}`;

/**
 * Formats a numeric value to the given number of decimal places (default 2).
 *
 * @example
 * console.log(formatDecimal(50000));
 * // 50,000.00
 *
 * @param {number} value - Value to be formatted.
 * @param {number} [digits=2] - Number of decimal places to display.
 * @return {string} Formatted string.
 */
export const formatDecimal = (value, digits = 2) => (
  _.isNil(value)
    ? null
    : (+value).toLocaleString('en', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
);
