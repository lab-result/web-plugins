export const DATE_FIELD_COMPONENTS = Object.freeze(['DD', 'MM', 'YY', 'YYYY']);

export const TIME_FIELD_COMPONENTS = Object.freeze(['HH', 'mm', 'ss']);

export const TOKENS = Object.freeze([
  '###section_code###',
  '###control_counter###',
  '###specimen_counter###',
]);

export const TOKENS_WITH_LABEL = Object.freeze({
  '###section_code###': 'Section Code',
  '###control_counter###': 'Control Counter',
  '###specimen_counter###': 'Specimen Counter',
});

export const DEFAULT_IMAGING_FIELDS = [
  'Custom Text',
  'Date Time',
  'Control Counter',
  'Section Code',
];

export const DEFAULT_LAB_FIELDS = [
  'Custom Text',
  'Date Time',
  'Specimen Counter',
];

export const POSITIONS = Object.freeze([
  { text: 'Before', value: 'before' },
  { text: 'After', value: 'after' },
]);

export const RESET_INTERVALS = Object.freeze([
  { text: 'Daily', value: 'daily' },
  { text: 'Weekly', value: 'weekly' },
  { text: 'Monthly', value: 'monthly' },
  { text: 'Yearly', value: 'yearly' },
]);
