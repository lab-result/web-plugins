export const NAV_GROUPS = [
  {
    title: 'My Clinic',
    icon: 'mdi-hospital-building',
    active: false,
    roles: ['admin', 'superadmin'],
    navs: [
      {
        title: 'Details',
        route: { name: 'settings-clinic-details' },
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Members',
        route: { name: 'settings-clinic-members' },
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Branches',
        route: { name: 'settings-clinic-branches' },
        roles: ['admin', 'superadmin'],
        clinicTypes: ['cms'],
      },
      {
        title: 'History',
        route: { name: 'settings-clinic-history' },
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Printing Header',
        route: { name: 'settings-clinic-printing-header' },
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Terminology Settings',
        route: { name: 'settings-clinic-language-settings' },
        roles: ['admin', 'superadmin'],
      },
    ],
  },
  {
    title: 'Partners',
    icon: 'mdi-briefcase',
    active: false,
    roles: ['admin', 'superadmin'],
    navs: [
      {
        title: 'Companies',
        route: { name: 'settings-partners-companies' },
        roles: ['admin', 'superadmin'],
      },
      {
        title: 'Diagnostic Centers',
        route: { name: 'settings-partners-diagnostic-centers' },
        roles: ['admin', 'superadmin'],
      },
    ],
  },
  {
    title: 'Laboratory Settings',
    icon: 'mdi-microscope',
    active: false,
    roles: ['admin', 'lab_head', 'superadmin'],
    navs: [
      {
        title: 'Test Directory',
        route: { name: 'settings-laboratory-test-directory' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Analyzers',
        route: { name: 'settings-laboratory-analyzers' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Report Templates',
        route: { name: 'settings-laboratory-report-templates' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Order Templates',
        route: { name: 'settings-laboratory-order-templates' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Specimen Report Recipients',
        route: { name: 'settings-laboratory-report-targets' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Printing Settings',
        route: { name: 'settings-laboratory-printing' },
        roles: ['admin', 'lab_head', 'superadmin'],
      },
      {
        title: 'Specimen ID Configuration',
        route: { name: 'settings-laboratory-order-specimen-id' },
        roles: ['admin', 'superadmin'],
      },
    ],
  },
];
