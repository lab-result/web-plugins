import { intersect } from './list';
import _ from 'lodash';

const withSuperadminOverride = fn => (member, ...args) =>
  _.get(member, 'superadmin') || fn(member, ...args);

const BASE_ROLES = [
  'admin',
  'billing',
  'doctor',
  'frontdesk',
  'imaging',
  'lab',
  'nurse',
  'pme',
  'proofreader',
  'releasing',
  'therapist',
  'warehouse',
];

const matchBaseRole = role => _.find(BASE_ROLES, b => _.startsWith(role, b));

/**
 * @param {string[]} roles - Roles to match with their respective base roles.
 * @return {string[]} Matched base roles.
 */
export const matchBaseRoles = roles => _.uniq(_.map(roles, matchBaseRole));

const intersectBaseRoles = (baseRoles, roles) =>
  !_.isEmpty(intersect(baseRoles, matchBaseRoles(roles)));

/**
 * @param {OrganizationMember} member - Member for whom roles will be checked.
 * @param {string[]} baseRoles - Base roles to permit.
 * @return {boolean} Returns true if member roles match.
 */
export const checkBaseRoles = (member, baseRoles) =>
  intersectBaseRoles(baseRoles, _.get(member, 'roles'));

/**
 * Like {@link checkBaseRoles}, but with superadmin override.
 *
 * @param {OrganizationMember} member - Member for whom roles will be checked.
 * @param {string[]} baseRoles - Base roles to permit.
 * @return {boolean} Returns true if member is permitted.
 */
export const permitBaseRoles = withSuperadminOverride(checkBaseRoles);

/**
 * @param {OrganizationMember} member - Member for whom roles will be checked.
 * @param {string[]} roles - Roles to permit.
 * @return {boolean} Returns true if member is permitted.
 */
export const checkRoles = (member, roles) =>
  !_.isEmpty(intersect(roles, _.get(member, 'roles')));

/**
 * Like {@link checkRoles}, but with superadmin override.
 *
 * @param {OrganizationMember} member - Member for whom roles will be checked.
 * @param {string[]} roles - Roles to permit.
 * @return {boolean} Returns true if member is permitted.
 */
export const permitRoles = withSuperadminOverride(checkRoles);

const BASE_PRIVILEGE_MAP = {
  membersCreate: 'members',
  membersRead: 'members',
  membersUpdate: 'members',
  membersDelete: 'members',
  aptmnt_itemsCreate: 'aptmnt_items',
  aptmnt_itemsRead: 'aptmnt_items',
  aptmnt_itemsUpdate: 'aptmnt_items',
  aptmnt_itemsDelete: 'aptmnt_items',
  frm_templatesCreate: 'frm_templates',
  frm_templatesRead: 'frm_templates',
  frm_templatesUpdate: 'frm_templates',
  frm_templatesDelete: 'frm_templates',
  ward_roomsCreate: 'ward_rooms',
  ward_roomsRead: 'ward_rooms',
  ward_roomsUpdate: 'ward_rooms',
  ward_roomsDelete: 'ward_rooms',
  ward_bedAssignmentsCreate: 'ward_bedAssignments',
  ward_bedAssignmentsRead: 'ward_bedAssignments',
  ward_bedAssignmentsUpdate: 'ward_bedAssignments',
  ward_bedAssignmentsDelete: 'ward_bedAssignments',
  bl_invoicesCreate: 'bl_invoices',
  bl_invoicesRead: 'bl_invoices',
  bl_invoicesUpdate: 'bl_invoices',
  bl_invoicesDelete: 'bl_invoices',
  bl_invoiceItemsCreate: 'bl_invoiceItems',
  bl_invoiceItemsRead: 'bl_invoiceItems',
  bl_invoiceItemsUpdate: 'bl_invoiceItems',
  bl_invoiceItemsDelete: 'bl_invoiceItems',
  bl_invoiceItemsForConfirmation: 'bl_invoiceItems',
  bl_invoiceItemsConfirm: 'bl_invoiceItems',
  bl_paymentsCreate: 'bl_payments',
  bl_paymentsRead: 'bl_payments',
  bl_paymentsUpdate: 'bl_payments',
  bl_paymentsDelete: 'bl_payments',
  bl_expensesCreate: 'bl_expenses',
  bl_expensesRead: 'bl_expenses',
  bl_expensesUpdate: 'bl_expenses',
  bl_expensesDelete: 'bl_expenses',
  insurance_contractsCreate: 'insurance_contracts',
  insurance_contractsRead: 'insurance_contracts',
  insurance_contractsUpdate: 'insurance_contracts',
  insurance_contractsDelete: 'insurance_contracts',
  mf_patientCreate: 'mf_patient',
  mf_patientRead: 'mf_patient',
  mf_patientUpdate: 'mf_patient',
  mf_servicesCreate: 'mf_services',
  mf_servicesRead: 'mf_services',
  mf_servicesUpdate: 'mf_services',
  mf_servicesDelete: 'mf_services',
  mf_reportsCreate: 'mf_reports',
  mf_reportsRead: 'mf_reports',
  mf_reportsUpdate: 'mf_reports',
  mf_reportsDelete: 'mf_reports',
  mf_encountersCreate: 'mf_encounters',
  mf_encountersRead: 'mf_encounters',
  mf_encountersUpdate: 'mf_encounters',
  mf_encountersDelete: 'mf_encounters',
  mf_encountersFinalize: 'mf_encounters',
  med_recordsRead: 'med_records',
  med_recordsCreate: 'med_records',
  med_recordsUpdate: 'med_records',
  med_recordsDelete: 'med_records',
  med_recordsApeReportRead: 'med_recordsApeReport',
  med_recordsApeReportCreate: 'med_recordsApeReport',
  med_recordsApeReportUpdate: 'med_recordsApeReport',
  med_recordsApeReportDelete: 'med_recordsApeReport',
  lis_resultsCreate: 'lis_results',
  lis_resultsRead: 'lis_results',
  lis_resultsUpdate: 'lis_results',
  lis_resultsDelete: 'lis_results',
  lis_testsCreate: 'lis_tests',
  lis_testsRead: 'lis_tests',
  lis_testsUpdate: 'lis_tests',
  lis_testsDelete: 'lis_tests',
  lis_ordersCreate: 'lis_orders',
  lis_ordersRead: 'lis_orders',
  lis_ordersUpdate: 'lis_orders',
  lis_ordersDelete: 'lis_orders',
  lis_analyzersCreate: 'lis_analyzers',
  lis_analyzersRead: 'lis_analyzers',
  lis_analyzersUpdate: 'lis_analyzers',
  lis_analyzersDelete: 'lis_analyzers',
  ris_resultsCreate: 'ris_results',
  ris_resultsRead: 'ris_results',
  ris_resultsUpdate: 'ris_results',
  ris_resultsDelete: 'ris_results',
  ris_testsCreate: 'ris_tests',
  ris_testsRead: 'ris_tests',
  ris_testsUpdate: 'ris_tests',
  ris_testsDelete: 'ris_tests',
  ris_ordersCreate: 'ris_orders',
  ris_ordersRead: 'ris_orders',
  ris_ordersUpdate: 'ris_orders',
  ris_ordersDelete: 'ris_orders',
  wh_productTypesCreate: 'wh_productTypes',
  wh_productTypesRead: 'wh_productTypes',
  wh_productTypesUpdate: 'wh_productTypes',
  wh_productTypesDelete: 'wh_productTypes',
  wh_productCategoriesCreate: 'wh_productCategories',
  wh_productCategoriesRead: 'wh_productCategories',
  wh_productCategoriesUpdate: 'wh_productCategories',
  wh_productCategoriesDelete: 'wh_productCategories',
  wh_brandsCreate: 'wh_brands',
  wh_brandsRead: 'wh_brands',
  wh_brandsUpdate: 'wh_brands',
  wh_brandsDelete: 'wh_brands',
  wh_stockAdjustmentReasonsCreate: 'wh_stockAdjustmentReasons',
  wh_stockAdjustmentReasonsRead: 'wh_stockAdjustmentReasons',
  wh_stockAdjustmentReasonsUpdate: 'wh_stockAdjustmentReasons',
  wh_stockAdjustmentReasonsDelete: 'wh_stockAdjustmentReasons',
  wh_productsCreate: 'wh_products',
  wh_productsRead: 'wh_products',
  wh_productsUpdate: 'wh_products',
  wh_productsDelete: 'wh_products',
  wh_suppliersCreate: 'wh_suppliers',
  wh_suppliersRead: 'wh_suppliers',
  wh_suppliersUpdate: 'wh_suppliers',
  wh_suppliersDelete: 'wh_suppliers',
  wh_salesCreate: 'wh_sales',
  wh_salesRead: 'wh_sales',
  wh_salesUpdate: 'wh_sales',
  wh_salesDelete: 'wh_sales',
  wh_adjustmentsCreate: 'wh_adjustments',
  wh_adjustmentsRead: 'wh_adjustments',
  wh_adjustmentsUpdate: 'wh_adjustments',
  wh_adjustmentsDelete: 'wh_adjustments',
  wh_purchasesCreate: 'wh_purchases',
  wh_purchasesRead: 'wh_purchases',
  wh_purchasesUpdate: 'wh_purchases',
  wh_purchasesDelete: 'wh_purchases',
  wh_transfersCreate: 'wh_transfers',
  wh_transfersRead: 'wh_transfers',
  wh_transfersUpdate: 'wh_transfers',
  wh_transfersDelete: 'wh_transfers',
  wh_receivingCreate: 'wh_receiving',
  wh_receivingRead: 'wh_receiving',
  wh_receivingUpdate: 'wh_receiving',
  wh_receivingDelete: 'wh_receiving',
  wh_packagingCreate: 'wh_packaging',
  wh_packagingRead: 'wh_packaging',
  wh_packagingUpdate: 'wh_packaging',
  wh_packagingDelete: 'wh_packaging',
  wh_returnsCreate: 'wh_returns',
  wh_returnsRead: 'wh_returns',
  wh_returnsUpdate: 'wh_returns',
  wh_returnsDelete: 'wh_returns',
};

const matchBasePrivilege = privilege => _.get(BASE_PRIVILEGE_MAP, privilege);

const checkPrivilege = (member, privilege) => {
  if (_.get(member, privilege)) return true;
  const basePrivilege = matchBasePrivilege(privilege);
  if (basePrivilege && _.get(member, basePrivilege)) return true;
  return false;
};

/**
 * Checks if a member is authorized with the given privileges.
 *
 * @example
 * permit(this.$activeMembership, ['mf_encountersRead']);
 * // returns true if current user has privilege mf_encountersRead
 * // in currently selected clinic
 *
 * @param {OrganizationMember} member - Member for whom privileges will be checked.
 * @param {string[]} privileges - Privileges to permit.
 * @return {boolean} Returns true if member is permitted.
 */
export const checkPrivileges = (member, privileges) =>
  _.some(privileges, priv => checkPrivilege(member, priv));

/**
 * Like {@link checkPrivileges}, but with superadmin override.
 */
export const permitPrivileges = withSuperadminOverride(checkPrivileges);
