export const RECORDS_BY_IMPORTANCE = [
  {
    id: 'medical-history',
    name: 'Medical History',
    records: [
      {
        name: 'Past Medical History',
        type: 'medical-history',
      },
      {
        name: 'Family History',
        type: 'family-history',
      },
      {
        name: 'Social History',
        type: 'social-history',
      },
      {
        name: 'Allergies History',
        type: 'allergy',
      },
      {
        name: 'Birth History',
        type: 'birth-history',
      },
      {
        name: 'Gynecological History',
        type: 'gynecological-history',
      },
      {
        name: 'Hospitalization History',
        type: 'hospitalization-history',
      },
      {
        name: 'Immunization/Vaccination History',
        type: 'vaccination',
      },
      {
        name: 'Menstrual History',
        type: 'menstrual-history',
      },
      {
        name: 'Obstetric History',
        type: 'obstetric-history',
      },
      {
        name: 'Surgery History',
        type: 'surgical-history',
      },
      {
        name: 'Dental History',
        type: 'dental-history',
      },
    ],
  },
  {
    id: 'ros',
    name: 'Review of Sytems',
    records: [
      {
        type: 'ros',
      },
    ],
  },
  {
    id: 'dev-milestones',
    name: 'Developmental Milestones',
    records: [
      {
        type: '',
      },
    ],
  },
  {
    id: 'vitals',
    name: 'Vitals',
    records: [
      {
        type: 'vitals',
      },
    ],
  },
  {
    id: 'specialty-feats',
    name: 'Specialty Features',
    records: [
      {
        type: 'ent-note',
        name: 'ENT',
      },
      {
        type: 'ob-note',
        name: 'OB-GYN',
      },
    ],
  },
  {
    id: 'pe',
    name: 'Physical Exam',
    records: [
      {
        type: 'physical-exam',
      },
    ],
  },
  {
    id: 'impression',
    name: 'Impression',
    records: [
      {
        name: 'Impression',
        type: 'assessment',
        subtype: 'impression',
      },
    ],
  },
  {
    id: 'diagnosis',
    name: 'Diagnosis',
    records: [
      {
        name: 'Diagnosis',
        type: 'assessment',
        subtype: 'diagnosis',
      },
    ],
  },
  {
    id: 'care-plan',
    name: 'Care Plan',
    records: [
      {
        type: 'care-plan',
      },
    ],
  },
  {
    id: 'medication-order',
    name: 'Prescriptions',
    records: [
      {
        type: 'medication-order',
      },
    ],
  },
  {
    id: 'diagnostic-order',
    name: 'Diagnostic Orders',
    records: [
      {
        name: 'Laboratory Order',
        type: 'lab-test-order',
      },
      {
        name: 'Imaging Order',
        type: 'imaging-test-order',
      },
    ],
  },
  {
    id: 'diagnostic-results',
    name: 'Diagnostic Results',
    records: [
      {
        type: '',
      },
    ],
  },
  {
    id: 'dental-baseline',
    name: 'Dental Baseline',
    records: [
      {
        type: '',
      },
    ],
  },
  {
    id: 'dental-work-proposed',
    name: 'Dental Work Proposed',
    records: [
      {
        type: '',
      },
    ],
  },
  {
    id: 'dental-work-done',
    name: 'Dental Work Done',
    records: [
      {
        type: '',
      },
    ],
  },
  {
    id: 'medical-forms',
    name: 'Medical Forms',
    records: [
      {
        name: 'Medical Certificate',
        type: 'med-certificate',
      },
      {
        name: 'Fitness Certificate',
        type: 'fit-certificate',
      },
      {
        name: 'Questionnaire',
        type: 'health-history',
      },
      {
        name: 'Waiver',
        type: 'waiver',
      },
    ],
  },
  {
    id: 'attachments',
    name: 'Attachments',
    records: [
      {
        type: '',
      },
    ],
  },
];

export const ALL_RECORD_TYPES = [
  {
    type: 'medical-history',
    name: 'Past Medical History',
    article: 'a',
  },
  {
    type: 'medical-procedure',
    name: 'Medical Procedure',
    article: 'a',
  },
  {
    type: 'medical-procedure-order',
    name: 'Medical Procedure Order',
    article: 'a',
  },
  {
    type: 'family-history',
    name: 'Family History',
    article: 'a',
  },
  {
    type: 'social-history',
    name: 'Social History',
    article: 'a',
  },
  {
    type: 'allergy',
    name: 'Allergies History',
    article: 'an',
  },
  {
    type: 'birth-history',
    name: 'Birth History',
    article: 'a',
  },
  {
    type: 'gynecological-history',
    name: 'Gynecological History',
    article: 'a',
  },
  {
    type: 'hospitalization-history',
    name: 'Hospitalization History',
    article: 'a',
  },
  {
    type: 'vaccination',
    name: 'Immunization/Vaccination History',
    article: 'an',
  },
  {
    type: 'menstrual-history',
    name: 'Menstrual History',
    article: 'a',
  },
  {
    type: 'obstetric-history',
    name: 'Obstetric History',
    article: 'a',
  },
  {
    type: 'surgical-history',
    name: 'Surgery History',
    article: 'a',
  },
  {
    type: 'dental-history',
    name: 'Dental History',
    article: 'a',
  },
  {
    type: 'dental-note',
    name: 'Dental Note',
    article: 'a',
  },
  {
    type: 'ros',
    name: 'Review of Systems',
    article: 'a',
  },
  {
    type: 'ros',
    name: 'Review of Systems',
    article: 'a',
  },
  {
    type: 'vitals',
    name: 'Vitals',
    article: 'a',
  },
  {
    type: 'ent-note',
    name: 'ENT',
    article: 'an',
  },
  {
    type: 'ob-note',
    name: 'OB-GYN',
    article: 'an',
  },
  {
    type: 'physical-exam',
    name: 'Physical Exam',
    article: 'a',
  },
  {
    type: 'assessment',
    name: 'Impression',
    subtype: 'impression',
    article: 'an',
  },
  {
    type: 'assessment',
    name: 'Diagnosis',
    subtype: 'diagnosis',
    article: 'a',
  },
  {
    type: 'care-plan',
    name: 'Care Plan Notes',
    article: 'a',
  },
  {
    type: 'medication-order',
    name: 'Prescription',
    article: 'a',
  },
  {
    name: 'Laboratory Order',
    type: 'lab-test-order',
    article: 'a',
  },
  {
    name: 'Imaging Order',
    type: 'imaging-test-order',
    article: 'an',
  },
  {
    type: 'diagnostic-results',
    name: 'Diagnostic Results',
    article: 'a',
  },
  {
    id: 'dental-baseline',
    name: 'Dental Baseline',
    article: 'a',
  },
  {
    id: 'dental-work-proposed',
    name: 'Dental Work Proposed',
    article: 'a',
  },
  {
    id: 'dental-work-done',
    name: 'Dental Work Done',
    article: 'a',
  },
  {
    type: 'med-certificate',
    name: 'Medical Certificate',
    article: 'a',
  },
  {
    type: 'fit-certificate',
    name: 'Fitness Certificate',
    article: 'a',
  },
  {
    type: 'health-history',
    name: 'Questionnaire',
    article: 'a',
  },
  {
    type: 'waiver',
    name: 'Waiver',
    article: 'a',
  },
  {
    type: 'attachment',
    name: 'Attachments',
    article: 'an',
  },
  {
    type: 'chief-complaint',
    name: 'Chief Complaint',
    article: 'a',
  },
  {
    type: 'hpi',
    name: 'History of Present Illness',
    article: 'a',
  },
];
