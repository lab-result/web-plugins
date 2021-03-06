
export const PRIVILEGE_DESCRIPTION = [
  { key: 'superadmin', desc: 'Super Admin' },
  { key: 'members', desc: 'Staff Management' },
  { key: 'membersCreate', desc: 'Staff Management - Create' },
  { key: 'membersRead', desc: 'Staff Management - View' },
  { key: 'membersUpdate', desc: 'Staff Management - Update' },
  { key: 'membersDelete', desc: 'Staff Management - Remove' },
  { key: 'org_configs', desc: 'Clinic Configurations' },
  { key: 'aptmnt_items', desc: 'Appointments' },
  { key: 'aptmnt_itemsCreate', desc: 'Appointments - Create' },
  { key: 'aptmnt_itemsRead', desc: 'Appointments - View' },
  { key: 'aptmnt_itemsUpdate', desc: 'Appointments - Update' },
  { key: 'aptmnt_itemsDelete', desc: 'Appointments - Remove' },
  { key: 'frm_templates', desc: 'Form Templates' },
  { key: 'frm_templatesCreate', desc: 'Form Templates - Create' },
  { key: 'frm_templatesRead', desc: 'Form Templates - View' },
  { key: 'frm_templatesUpdate', desc: 'Form Templates - Update' },
  { key: 'frm_templatesDelete', desc: 'Form Templates - Remove' },
  // { key: 'wall_postCreate', desc: 'Wall post - Create' },
  // { key: 'wall_postRemove', desc: 'Wall post - Remove' },
  { key: 'queue_create', desc: 'Queue Labels - Create' },
  { key: 'queue_remove', desc: 'Queue Labels - Remove' },
  { key: 'queue_items', desc: 'Queue Management' },
  { key: 'ward_rooms', desc: 'Ward Room Management' },
  { key: 'ward_roomsCreate', desc: 'Ward Room Management - Create' },
  { key: 'ward_roomsRead', desc: 'Ward Room Management - View' },
  { key: 'ward_roomsUpdate', desc: 'Ward Room Management - Update' },
  { key: 'ward_roomsDelete', desc: 'Ward Room Management - Remove' },
  { key: 'ward_bedAssignments', desc: 'Ward Bed Management' },
  { key: 'ward_bedAssignmentsCreate', desc: 'Ward Bed Management - Create' },
  { key: 'ward_bedAssignmentsRead', desc: 'Ward Bed Management - View' },
  { key: 'ward_bedAssignmentsUpdate', desc: 'Ward Bed Management - Update' },
  { key: 'ward_bedAssignmentsDelete', desc: 'Ward Bed Management - Remove' },
  { key: 'bl_invoices', desc: 'Invoice Management' },
  { key: 'bl_invoicesCreate', desc: 'Invoice Management - Create' },
  { key: 'bl_invoicesRead', desc: 'Invoice Management - View' },
  { key: 'bl_invoicesUpdate', desc: 'Invoice Management - Update' },
  { key: 'bl_invoicesDelete', desc: 'Invoice Management - Remove' },
  { key: 'bl_invoiceItems', desc: 'Invoices Items Management' },
  { key: 'bl_invoiceItemsCreate', desc: 'Invoices Items Management - Create' },
  { key: 'bl_invoiceItemsRead', desc: 'Invoices Items Management - View' },
  { key: 'bl_invoiceItemsUpdate', desc: 'Invoices Items Management - Update' },
  { key: 'bl_invoiceItemsDelete', desc: 'Invoices Items Management - Remove' },
  { key: 'bl_payments', desc: 'Payments' },
  { key: 'bl_paymentsCreate', desc: 'Payments - Create' },
  { key: 'bl_paymentsRead', desc: 'Payments - View' },
  { key: 'bl_paymentsUpdate', desc: 'Payments - Update' },
  { key: 'bl_paymentsDelete', desc: 'Payments - Remove' },
  { key: 'bl_expenses', desc: 'Expenses' },
  { key: 'bl_expensesCreate', desc: 'Expenses - Create' },
  { key: 'bl_expensesRead', desc: 'Expenses - View' },
  { key: 'bl_expensesUpdate', desc: 'Expenses - Update' },
  { key: 'bl_expensesDelete', desc: 'Expenses - Remove' },
  { key: 'bl_printInvoice', desc: 'Print - Invoice' },
  { key: 'bl_soas', desc: 'Billin SOA Management ' },
  // { key: 'hg_materials', desc: '' },
  { key: 'insurance_contracts', desc: 'HMO Settings' },
  { key: 'insurance_contractsCreate', desc: 'HMO Settings - Create' },
  { key: 'insurance_contractsRead', desc: 'HMO Settings - View' },
  { key: 'insurance_contractsUpdate', desc: 'HMO Settings - Update' },
  { key: 'insurance_contractsDelete', desc: 'HMO Settings - Remove' },
  { key: 'mf_analytics', desc: 'Analytics' },
  { key: 'mf_registrationKiosk', desc: 'Registration Kiosk' },
  { key: 'mf_patient', desc: 'Patient Profile', virtual: true },
  { key: 'mf_patientCreate', desc: 'Patient Profile - Create' },
  { key: 'mf_patientRead', desc: 'Patient Profile - View' },
  { key: 'mf_patientUpdate', desc: 'Patient Profile - Update' },
  { key: 'mf_services', desc: 'Clinic Services' },
  { key: 'mf_servicesCreate', desc: 'Clinic Services - Create' },
  { key: 'mf_servicesRead', desc: 'Clinic Services - View' },
  { key: 'mf_servicesUpdate', desc: 'Clinic Services - Update' },
  { key: 'mf_servicesDelete', desc: 'Clinic Services - Remove' },
  { key: 'mf_reports', desc: 'Medical Reports' },
  { key: 'mf_reportsCreate', desc: 'Medical Reports - Create' },
  { key: 'mf_reportsRead', desc: 'Medical Reports - View' },
  { key: 'mf_reportsUpdate', desc: 'Medical Reports - Update' },
  { key: 'mf_reportsDelete', desc: 'Medical Reports - Remove' },
  { key: 'mf_printReports', desc: 'Medical Reports Print' },
  { key: 'mf_encounters', desc: 'Encounter' },
  { key: 'mf_encountersCreate', desc: 'Encounter - Create' },
  { key: 'mf_encountersRead', desc: 'Encounter - View' },
  { key: 'mf_encountersUpdate', desc: 'Encounter - Update' },
  { key: 'mf_encountersDelete', desc: 'Encounter - Remove' },
  { key: 'mf_encountersFinalize', desc: 'Encounter - Finalize' },
  { key: 'med_records', desc: 'Medical Records' },
  { key: 'med_recordsCreate', desc: 'Medical Records - Create' },
  { key: 'med_recordsRead', desc: 'Medical Records - View' },
  { key: 'med_recordsUpdate', desc: 'Medical Records - Update' },
  { key: 'med_recordsDelete', desc: 'Medical Records - Delete' },
  { key: 'med_recordsApeReport', desc: 'PME Results' },
  { key: 'med_recordsApeReportCreate', desc: 'PME Results - Create' },
  { key: 'med_recordsApeReportRead', desc: 'PME Results - View' },
  { key: 'med_recordsApeReportUpdate', desc: 'PME Results - Update' },
  { key: 'med_recordsApeReportDelete', desc: 'PME Results - Delete' },
  { key: 'lis_results', desc: 'Lab Result Management' },
  { key: 'lis_resultsCreate', desc: 'Lab Result Management - Create' },
  { key: 'lis_resultsRead', desc: 'Lab Result Management - View' },
  { key: 'lis_resultsUpdate', desc: 'Lab Result Management - Update' },
  { key: 'lis_resultsDelete', desc: 'Lab Result Management - Remove' },
  { key: 'lis_tests', desc: 'Lab Test Management' },
  { key: 'lis_testsCreate', desc: 'Lab Test Management - Create' },
  { key: 'lis_testsRead', desc: 'Lab Test Management - View' },
  { key: 'lis_testsUpdate', desc: 'Lab Test Management - Update' },
  { key: 'lis_testsDelete', desc: 'Lab Test Management - Remove' },
  { key: 'lis_orders', desc: 'Lab Order Management' },
  { key: 'lis_ordersCreate', desc: 'Lab Order Management - Create' },
  { key: 'lis_ordersRead', desc: 'Lab Order Management - View' },
  { key: 'lis_ordersUpdate', desc: 'Lab Order Management - Update' },
  { key: 'lis_ordersDelete', desc: 'Lab Order Management - Remove' },
  { key: 'lis_analyzers', desc: 'Lab Analyzer Management' },
  { key: 'lis_analyzersCreate', desc: 'Lab Analyzer Management - Create' },
  { key: 'lis_analyzersRead', desc: 'Lab Analyzer Management - View' },
  { key: 'lis_analyzersUpdate', desc: 'Lab Analyzer Management - Update' },
  { key: 'lis_analyzersDelete', desc: 'Lab Analyzer Management - Remove' },
  { key: 'lis_verify', desc: 'Lab Verification' },
  { key: 'lis_printClaimStub', desc: 'Lab claim stub - Print' },
  { key: 'lis_printResults', desc: 'Lab results - Print' },
  { key: 'ris_results', desc: 'Imaging Result Management' },
  { key: 'ris_resultsCreate', desc: 'Imaging Result Management - Create' },
  { key: 'ris_resultsRead', desc: 'Imaging Result Management - View' },
  { key: 'ris_resultsUpdate', desc: 'Imaging Result Management - Update' },
  { key: 'ris_resultsDelete', desc: 'Imaging Result Management - Remove' },
  { key: 'ris_tests', desc: 'Imaging Test Management' },
  { key: 'ris_testsCreate', desc: 'Imaging Test Management - Create' },
  { key: 'ris_testsRead', desc: 'Imaging Test Management - View' },
  { key: 'ris_testsUpdate', desc: 'Imaging Test Management - Update' },
  { key: 'ris_testsDelete', desc: 'Imaging Test Management - Remove' },
  { key: 'ris_orders', desc: 'Imaging Order Management' },
  { key: 'ris_ordersCreate', desc: 'Imaging Order Management - Create' },
  { key: 'ris_ordersRead', desc: 'Imaging Order Management - View' },
  { key: 'ris_ordersUpdate', desc: 'Imaging Order Management - Update' },
  { key: 'ris_ordersDelete', desc: 'Imaging Order Management - Remove' },
  { key: 'ris_verify', desc: 'Imaging Verification' },
  { key: 'ris_printClaimStub', desc: 'Imaging claim stub - Print' },
  { key: 'ris_printResults', desc: 'Imaging results - Print' },
  { key: 'wh_productTypes', desc: 'Product Types' },
  { key: 'wh_productTypesCreate', desc: 'Product Types - Create' },
  { key: 'wh_productTypesRead', desc: 'Product Types - View' },
  { key: 'wh_productTypesUpdate', desc: 'Product Types - Update' },
  { key: 'wh_productTypesDelete', desc: 'Product Types - Remove' },
  { key: 'wh_productCategories', desc: 'Product Categories' },
  { key: 'wh_productCategoriesCreate', desc: 'Product Categories - Create' },
  { key: 'wh_productCategoriesRead', desc: 'Product Categories - View' },
  { key: 'wh_productCategoriesUpdate', desc: 'Product Categories - Update' },
  { key: 'wh_productCategoriesDelete', desc: 'Product Categories - Remove' },
  { key: 'wh_stockAdjustmentReasons', desc: 'Stock Adjustment Settings' },
  { key: 'wh_stockAdjustmentReasonsCreate', desc: 'Stock Adjustment Settings - Create' },
  { key: 'wh_stockAdjustmentReasonsRead', desc: 'Stock Adjustment Settings - View' },
  { key: 'wh_stockAdjustmentReasonsUpdate', desc: 'Stock Adjustment Settings - Update' },
  { key: 'wh_stockAdjustmentReasonsDelete', desc: 'Stock Adjustment Settings - Remove' },
  { key: 'wh_products', desc: 'Products' },
  { key: 'wh_productsCreate', desc: 'Products - Create' },
  { key: 'wh_productsRead', desc: 'Products - View' },
  { key: 'wh_productsUpdate', desc: 'Products - Update' },
  { key: 'wh_productsDelete', desc: 'Products - Remove' },
  { key: 'wh_suppliers', desc: 'Suppliers' },
  { key: 'wh_suppliersCreate', desc: 'Suppliers - Create' },
  { key: 'wh_suppliersRead', desc: 'Suppliers - View' },
  { key: 'wh_suppliersUpdate', desc: 'Suppliers - Update' },
  { key: 'wh_suppliersDelete', desc: 'Suppliers - Remove' },
  { key: 'wh_sales', desc: 'Sales' },
  { key: 'wh_salesCreate', desc: 'Sales - Create' },
  { key: 'wh_salesRead', desc: 'Sales - View' },
  { key: 'wh_salesUpdate', desc: 'Sales - Update' },
  { key: 'wh_salesDelete', desc: 'Sales - Remove' },
  { key: 'wh_adjustments', desc: 'Stock Adjustments' },
  { key: 'wh_adjustmentsCreate', desc: 'Stock Adjustments - Create' },
  { key: 'wh_adjustmentsRead', desc: 'Stock Adjustments - View' },
  { key: 'wh_adjustmentsUpdate', desc: 'Stock Adjustments - Update' },
  { key: 'wh_adjustmentsDelete', desc: 'Stock Adjustments - Remove' },
  { key: 'wh_purchases', desc: 'Purchases' },
  { key: 'wh_purchasesCreate', desc: 'Purchases - Create' },
  { key: 'wh_purchasesRead', desc: 'Purchases - View' },
  { key: 'wh_purchasesUpdate', desc: 'Purchases - Update' },
  { key: 'wh_purchasesDelete', desc: 'Purchases - Remove' },
  { key: 'wh_transfers', desc: 'Transfers' },
  { key: 'wh_transfersCreate', desc: 'Transfers - Create' },
  { key: 'wh_transfersRead', desc: 'Transfers - View' },
  { key: 'wh_transfersUpdate', desc: 'Transfers - Update' },
  { key: 'wh_transfersDelete', desc: 'Transfers - Remove' },
  { key: 'wh_receiving', desc: 'Receiving' },
  { key: 'wh_receivingCreate', desc: 'Receiving - Create' },
  { key: 'wh_receivingRead', desc: 'Receiving - View' },
  { key: 'wh_receivingUpdate', desc: 'Receiving - Update' },
  { key: 'wh_receivingDelete', desc: 'Receiving - Remove' },
  { key: 'wh_packaging', desc: 'Packaging' },
  { key: 'wh_packagingCreate', desc: 'Packaging - Create' },
  { key: 'wh_packagingRead', desc: 'Packaging - View' },
  { key: 'wh_packagingUpdate', desc: 'Packaging - Update' },
  { key: 'wh_packagingDelete', desc: 'Packaging - Remove' },
  { key: 'wh_returns', desc: 'Returns' },
  { key: 'wh_returnsCreate', desc: 'Returns - Create' },
  { key: 'wh_returnsRead', desc: 'Returns - View' },
  { key: 'wh_returnsUpdate', desc: 'Returns - Update' },
  { key: 'wh_returnsDelete', desc: 'Returns - Remove' },
  { key: 'wh_brands', desc: 'Brands' },
  { key: 'wh_brandsCreate', desc: 'Brands - Create' },
  { key: 'wh_brandsRead', desc: 'Brands - View' },
  { key: 'wh_brandsUpdate', desc: 'Brands - Update' },
  { key: 'wh_brandsDelete', desc: 'Brands - Remove' },
  { key: 'partners', desc: 'Partners' },
  { key: 'analytics', desc: 'Analytics' },
  { key: 'analyticsRead', desc: 'Analytics - Read' },
  { key: 'activityLogsRead', desc: 'Activity Logs - Read' },
  { key: 'attendance', desc: 'Attendance' },
  { key: 'attendanceRead', desc: 'Attendance - Read' },
  { key: 'attendanceWrite', desc: 'Attendance - Write' },
  { key: 'attendanceOpen', desc: 'Attendance - Open' },
  { key: 'attendanceClose', desc: 'Attendance - Close' },
  { key: 'queue_ops', desc: 'Queue Options' },
  { key: 'queueMonitor', desc: 'Queue Monitor' },
  { key: 'med_recordsAnalytics', desc: 'Medical Records - Analytics' },
  { key: 'bl_analytics', desc: 'Billing Analytics' },
  { key: 'lis_analytics', desc: 'Laboratory Analytics' },
  { key: 'lis_ordersSendout', desc: 'Laboratory Orders - Send Outs' },
  { key: 'lis_ordersComplete', desc: 'Laboratory Orders - Complete' },
  { key: 'lis_ordersVerify', desc: 'Laboratory Orders - Verify' },
  { key: 'lis_ordersFinalize', desc: 'Laboratory Orders - Finalize' },
  { key: 'ris_analytics', desc: 'Imaging Analytics' },
  { key: 'ris_ordersSendout', desc: 'Imaging Orders - Send Outs' },
  { key: 'ris_ordersComplete', desc: 'Imaging Orders - Complete' },
  { key: 'ris_ordersVerify', desc: 'Imaging Orders - Verify' },
  { key: 'ris_ordersFinalize', desc: 'Imaging Orders - Finalize' },
  { key: 'ris_analyticsRead', desc: 'Imaging Analytics - Read' },
  { key: 'bl_reports', desc: 'Billing - Reports' },
  { key: 'wh_reports', desc: 'Warehouse - Reports' },
  { key: 'wh_pos', desc: 'Warehouse - POS' },
  { key: 'mf_dentalFixtures', desc: 'Dental Fixtures' },
  { key: 'pharmacy_reports', desc: 'Pharmacy - Reports' },
].reduce((acc, val) => ({ ...acc, [val.key]: val.desc }), {});

export const ROLES = [
  {
    name: 'Admin',
    id: 'admin',
    color: '#212121',
    privileges: [
      'members',
      'org_configs',
      'partners',
      'analytics',
      'activityLogsRead',
      'attendanceRead',
      'attendanceWrite',
      'attendanceOpen',
      'attendanceClose',
      'mf_patientCreate',
      'mf_patientRead',
      'mf_patientUpdate',
      'queue_remove',
      'queue_items',
      'queue_ops',
      'queue_create',
      'queueMonitor',
      'mf_registrationKiosk',
      'aptmnt_items',
      'med_recordsRead',
      'frm_templatesRead',
      'med_recordsAnalytics',
      'mf_encounters',
      'bl_invoices',
      'bl_invoiceItems',
      'bl_payments',
      'mf_services',
      'bl_expenses',
      'bl_soas',
      'bl_analytics',
      'bl_reports',
      'wh_products',
      'wh_productTypes',
      'wh_productCategories',
      'wh_purchases',
      'wh_transfers',
      'wh_receiving',
      'wh_adjustments',
      'wh_packaging',
      'wh_stockAdjustmentReasons',
      'wh_reports',
      'wh_suppliers',
      'wh_pos',
      'pharmacy_reports',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_resultsRead',
      'lis_analyzersRead',
      'lis_analytics',
      'ris_testsRead',
      'ris_ordersRead',
      'ris_resultsRead',
      'ris_analytics',
      'insurance_contractsRead',
      'insurance_contractsUpdate',
      'mf_dentalFixtures',
      'mf_reports',
    ],
  },
  {
    name: 'Clinic Manager',
    id: 'clinic_manager',
    color: '#4a05ed',
    privileges: [
      'members',
      'org_configs',
      'partners',
      'analyticsRead',
      'activityLogsRead',
      'attendanceRead',
      'attendanceWrite',
      'attendanceOpen',
      'attendanceClose',
      'mf_patientRead',
      'mf_patientUpdate',
      'queue_items',
      'queue_create',
      'queue_remove',
      'queueMonitor',
      'mf_registrationKiosk',
      'aptmnt_itemsRead',
      'aptmnt_itemsUpdate',
      'med_recordsRead',
      'frm_templatesRead',
      'med_recordsAnalytics',
      'mf_encountersRead',
      'mf_encountersUpdate',
      'bl_invoicesRead',
      'bl_invoicesUpdate',
      'bl_invoiceItemsRead',
      'bl_invoiceItemsUpdate',
      'bl_paymentsRead',
      'bl_paymentsUpdate',
      'mf_servicesRead',
      'mf_servicesUpdate',
      'bl_expenses',
      'bl_soas',
      'bl_analytics',
      'bl_reports',
      'wh_productsRead',
      'wh_productsUpdate',
      'wh_productTypesRead',
      'wh_productCategoriesRead',
      'wh_productCategoriesUpdate',
      'wh_purchasesRead',
      'wh_purchasesUpdate',
      'wh_transfersRead',
      'wh_transfersUpdate',
      'wh_receivingRead',
      'wh_receivingUpdate',
      'wh_adjustmentsRead',
      'wh_adjustmentsUpdate',
      'wh_packagingRead',
      'wh_packagingUpdate',
      'wh_stockAdjustmentReasonsRead',
      'wh_stockAdjustmentReasonsUpdate',
      'wh_reports',
      'wh_suppliersRead',
      'wh_suppliersUpdate',
      'wh_pos',
      'pharmacy_reports',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_resultsRead',
      'lis_analyzersRead',
      'lis_analytics',
      'ris_testsRead',
      'ris_ordersRead',
      'ris_resultsRead',
      'ris_analytics',
      'insurance_contractsRead',
      'insurance_contractsUpdate',
    ],
  },
  {
    name: 'Data Analyst',
    id: 'admin_analyst',
    color: '#77909d',
    privileges: [
      'mf_reports',
      'members',
      'org_configs',
      'partners',
      'analyticsRead',
      'activityLogsRead',
      'attendanceRead',
      'mf_patientRead',
      'queue_items',
      'queueMonitor',
      'mf_registrationKiosk',
      'aptmnt_itemsRead',
      'med_recordsRead',
      'frm_templatesRead',
      'med_recordsAnalytics',
      'mf_encountersRead',
      'bl_invoicesRead',
      'bl_invoiceItemsRead',
      'bl_paymentsRead',
      'mf_servicesRead',
      'bl_expensesRead',
      'bl_soas',
      'bl_analytics',
      'bl_reports',
      'wh_productsRead',
      'wh_productTypesRead',
      'wh_productCategoriesRead',
      'wh_productCategories',
      'wh_purchasesRead',
      'wh_transfersRead',
      'wh_receivingRead',
      'wh_adjustmentsRead',
      'wh_packagingRead',
      'wh_stockAdjustmentReasonsRead',
      'wh_reports',
      'wh_suppliersRead',
      'wh_pos',
      'pharmacy_reports',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_resultsRead',
      'lis_analyzersRead',
      'lis_analytics',
      'ris_testsRead',
      'ris_ordersRead',
      'ris_resultsRead',
      'ris_analytics',
      'insurance_contractsRead',
      'mf_dentalFixtures',
    ],
  },
  {
    name: 'Proofreader',
    id: 'proofreader',
    color: '#77909d',
    privileges: [
      'bl_invoices',
      'bl_invoiceItems',
      'bl_payments',
      'mf_services',
      'bl_expenses',
      'bl_soas',
      'bl_analytics',
      'bl_reports',
      'mf_patientCreate',
      'mf_patientRead',
      'mf_patientUpdate',
      'mf_encounters',
      'med_records',
      'frm_templates',
      'med_recordsAnalytics',
      'mf_reports',
      'mf_encounters',
      'lis_tests',
      'lis_results',
      'lis_orders',
      'lis_analyzers',
      'lis_ordersSendout',
      'lis_ordersComplete',
      'lis_ordersVerify',
      'lis_ordersFinalize',
      'lis_verify',
      'lis_analytics',
      'ris_tests',
      'ris_results',
      'ris_orders',
      'ris_verify',
      'ris_ordersSendout',
      'ris_ordersComplete',
      'ris_ordersVerify',
      'ris_ordersFinalize',
      'ris_analytics',
      'wh_sales',
      'wh_adjustments',
      'wh_purchases',
      'wh_packaging',
      'wh_returns',
      'wh_products',
      'wh_productTypes',
      'wh_productCategories',
      'wh_transfers',
      'wh_packaging',
      'wh_stockAdjustmentReasons',
      'wh_reports',
      'wh_suppliers',
      'wh_receiving',
      'wh_pos',
      'pharmacy_reports',
      'insurance_contractsRead',
      'insurance_contractsUpdate',
      'mf_dentalFixtures',
    ],
  },
  {
    name: 'Records Management',
    id: 'releasing',
    color: '#77909d',
    privileges: [
      'mf_patientRead',
      'mf_patientUpdate',
      'med_recordsRead',
      'frm_templatesRead',
      'med_recordsAnalytics',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_resultsRead',
      'lis_analytics',
      'ris_testsRead',
      'ris_ordersRead',
      'ris_resultsRead',
      'ris_analytics',
      'insurance_contractsRead',
      'mf_dentalFixtures',
    ],
  },
  {
    name: 'Doctor',
    id: 'doctor',
    color: '#1828f9',
    privileges: [
      'mf_patientRead',
      'queue_items',
      'queue_ops',
      'queueMonitor',
      'aptmnt_items',
      'med_records',
      'frm_templates',
      'med_recordsAnalytics',
      'mf_encounters',
      'bl_invoices',
      'bl_invoiceItems',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_resultsRead',
      'ris_testsRead',
      'ris_ordersRead',
      'ris_resultsRead',
      'mf_dentalFixtures',
    ],
  },
  {
    name: 'Pathologist',
    id: 'doctor_pathologist',
    color: '#96e8fc',
    ignoredClinicTypes: ['personal-clinic', 'pharmacy'],
    subscriptions: ['lis'],
    privileges: [
      'mf_patientRead',
      'aptmnt_itemsRead',
      'lis_results',
      'lis_testsRead',
      'lis_ordersRead',
      'lis_printClaimStub',
      'lis_printResults',
      'lis_ordersFinalize',
    ],
  },
  {
    name: 'Medical Technologist',
    id: 'med_tech',
    color: '#29b87f',
    ignoredClinicTypes: ['personal-clinic', 'pharmacy'],
    subscriptions: ['lis'],
    privileges: [
      'mf_patientRead',
      'queue_items',
      'queueMonitor',
      'aptmnt_items',
      'mf_encountersRead',
      'bl_invoicesRead',
      'bl_invoiceItemsRead',
      'bl_paymentsRead',
      'lis_testsRead',
      'lis_orders',
      'lis_results',
      'lis_printClaimStub',
      'lis_printResults',
      'lis_ordersSendout',
      'lis_ordersComplete',
      'lis_ordersVerify',
    ],
  },
  {
    name: 'Laboratory Technician',
    id: 'lab_tech',
    color: '#cbe100',
    ignoredClinicTypes: ['personal-clinic', 'pharmacy'],
    subscriptions: ['lis'],
    privileges: [
      'mf_patientRead',
      'queue_items',
      'queueMonitor',
      'aptmnt_items',
      'mf_encountersRead',
      'bl_invoicesRead',
      'bl_invoiceItemsRead',
      'bl_paymentsRead',
      'lis_testsRead',
      'lis_orders',
      'lis_results',
      'lis_analyzers',
      'lis_printClaimStub',
      'lis_printResults',
      'lis_ordersSendout',
      'lis_ordersComplete',
    ],
  },
  {
    name: 'Laboratory QC',
    id: 'lab_qc',
    color: '#fff048',
    ignoredClinicTypes: ['personal-clinic', 'pharmacy'],
    subscriptions: ['lis'],
    privileges: [
      'mf_patientRead',
      'lis_results',
      'lis_tests',
      'lis_orders',
      'lis_analyzers',
      'lis_verify',
      'lis_printClaimStub',
      'lis_printResults',
      'mf_encounters',
      'queue_items',
      'aptmnt_items',
    ],
  },
  {
    name: 'Laboratory Head',
    id: 'lab_head',
    color: '#ffcb00',
    ignoredClinicTypes: ['personal-clinic', 'pharmacy'],
    subscriptions: ['lis'],
    privileges: [
      'lis_tests',
      'mf_patientRead',
      'lis_results',
      'lis_tests',
      'lis_orders',
      'lis_analyzers',
      'lis_verify',
      'lis_ordersSendout',
      'lis_ordersComplete',
      'lis_ordersVerify',
      'lis_ordersFinalize',
      'lis_analytics',
      'lis_printClaimStub',
      'lis_printResults',
      'frm_templates',
      'mf_encountersRead',
      'queue_items',
      'aptmnt_items',
      'queueMonitor',
      'bl_invoicesRead',
      'bl_invoiceItemsRead',
      'bl_paymentsRead',
      'wh_productsRead',
      'wh_productTypesRead',
      'wh_productCategoriesRead',
      'wh_purchasesCreate',
      'wh_purchasesRead',
      'wh_purchasesUpdate',
      'wh_transfersCreate',
      'wh_transfersRead',
      'wh_transfersUpdate',
      'wh_receivingCreate',
      'wh_receivingRead',
      'wh_receivingUpdate',
      'wh_adjustmentsCreate',
      'wh_adjustmentsRead',
      'wh_adjustmentsUpdate',
      'wh_packagingRead',
      'wh_stockAdjustmentReasonsRead',
      'wh_reports',
    ],
  },
];

export const LANGUAGE_SETTINGS = [
  {
    group: 'Diagnostic',
    text: 'Date Requested',
    key: 'diagnosticDateRequested',
  },
  {
    group: 'Diagnostic',
    text: 'Date Released',
    key: 'diagnosticDateReleased',
  },
  {
    group: 'Diagnostic',
    text: 'Complete',
    key: 'diagnosticComplete',
  },
  {
    group: 'Diagnostic',
    text: 'Completed',
    key: 'diagnosticCompleted',
  },
  {
    group: 'Diagnostic',
    text: 'Completed By',
    key: 'diagnosticCompletedBy',
  },
  {
    group: 'Diagnostic',
    text: 'Verify',
    key: 'diagnosticVerify',
  },
  {
    group: 'Diagnostic',
    text: 'Verified',
    key: 'diagnosticVerified',
  },
  {
    group: 'Diagnostic',
    text: 'Verified By',
    key: 'diagnosticVerifiedBy',
  },
  {
    group: 'Diagnostic',
    text: 'Finalize',
    key: 'diagnosticFinalize',
  },
  {
    group: 'Diagnostic',
    text: 'Finalized',
    key: 'diagnosticFinalized',
  },
  {
    group: 'Diagnostic',
    text: 'Finalized By',
    key: 'diagnosticFinalizedBy',
  },
];

export const DOCTOR_ROLES = [
  'doctor',
  'doctor_pathologist',
  'doctor_radiologist',
  'doctor_sonologist',
  'doctor_cardiologist',
  'doctor_pme',
];

export const ROLES_MAP = ROLES.reduce((a, role) => ({ ...a, [role.id]: role }), {});
