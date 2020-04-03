import _ from 'lodash';
import { format } from 'date-fns';

export const generateSpecimenId = id => {
  if (!id) throw new Error('ID required');

  const prefix = id.substring(id.length - 5);
  const now = `${_.now()}`;
  const suffix = now.substring(now.length - 5);
  return `${prefix}-${suffix}`;
};

export const injectValues = function (text, token, value) {
  if (!text) return;
  return text.split(token).join(value);
};

/**
 * @param {object} payload
 * @param {string} payload.paddingPosition
 * @param {number} payload.paddingLength
 * @param {string} payload.paddingCharacter
 * @param {number} payload.counter
 */
export const generateCustomId = function (payload) {
  if (typeof payload.counter !== 'number') throw new Error('Counter is required');
  const { paddingPosition = 'before', paddingLength = 0, paddingCharacter = '0', counter } = payload;
  if (paddingLength < 4) return counter;
  if (paddingPosition === 'after') {
    return _.padEnd(counter.toString(), paddingLength, paddingCharacter);
  } else {
    return _.padStart(counter.toString(), paddingLength, paddingCharacter);
  }
};

export const generateDate = function (dateFormat) {
  const now = new Date();
  return format(now, dateFormat);
};

/**
 * @param {object} payload
 * @param {string} payload.controlIdFormat format template
 * @param {string} payload.dateFormat
 * @param {'ris'|'lis'} payload.type
 * @param {string} payload.sectionCode for type 'ris' only
 * @param {object} payload.customIdSettings
 * @param {string} payload.customIdSettings.paddingPosition
 * @param {number} payload.customIdSettings.paddingLength
 * @param {string} payload.customIdSettings.paddingCharacter
 * @param {number} payload.customIdSettings.counter
 *
 * @returns {string} injected value
 */
export const getInjectedValue = function (payload) {
  const { controlIdFormat, dateFormat, type, sectionCode = '', customIdSettings } = payload;
  let formatted = controlIdFormat;
  const counterTokenType = type === 'ris' ? '###control_counter###' : '###specimen_counter###';

  if (type === 'ris') formatted = injectValues(formatted, '###section_code###', sectionCode);
  formatted = injectValues(formatted, counterTokenType, generateCustomId(customIdSettings));
  formatted = injectValues(formatted, `###${dateFormat}###`, generateDate(dateFormat));
  return formatted;
};
