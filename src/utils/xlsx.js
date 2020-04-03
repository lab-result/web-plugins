import * as XLSX from 'xlsx';
import _ from 'lodash';

/**
 * Converts an XLSX file into a JSON array of objects.
 *
 * @param {File} file - XLSX file to convert.
 * @param {string[]} headers - Array of keys to assign for each column.
 * @param {Object} opts
 * @param {boolean} opts.ignoreFirstRow - Do not treat first row as data.
 */
export const convertXlsxToJson = (file, headers, { ignoreFirstRow = true } = {}) => {
  if (!file) throw Error('file is required.');
  if (!headers) throw Error('headers are required.');

  // read workbook
  const wb = XLSX.read(file, { type: 'binary', cellDates: true });

  // grab first sheet
  const wsname = wb.SheetNames[0];
  const ws = wb.Sheets[wsname];

  // get row data
  const data = XLSX.utils.sheet_to_json(ws, { header: headers });

  return ignoreFirstRow ? _.drop(data) : data;
};

/**
 * Converts a JSON array of objects into an XLSX file.
 *
 * @param {Object[]} json - JSON to convert.
 * @param {string[]} headers - Array of headers to assign for each column.
 * @param {Object} opts
 * @param {string} opts.filename - Filename to be used for saving.
 * @param {string} [opts.bookType='xlsx'] - Book type to use for file.
 */
export const convertJsonToXlsx = (json, headers, {
  filename,
  bookType = 'xlsx',
} = {}) => {
  if (!json) throw Error('json is required.');
  if (!headers) throw Error('headers are required.');
  if (!filename) throw Error('Filename is required.');

  // create workbook
  const wb = XLSX.utils.book_new();

  // create sheet from json data
  const ws = XLSX.utils.json_to_sheet(json, { header: headers });

  // add as Sheet1
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // save to local files
  XLSX.writeFile(wb, filename, { bookType });
};
