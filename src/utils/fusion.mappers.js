import {
  guard,
  prettifyDoctorNameFirst,
} from './string';
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  addMonths,
  addDays,
  format,
} from 'date-fns';
import _ from 'lodash';

export const getAttendingDoctor = doctors => {
  const doctorRoles = [
    'doctor',
    'doctor_pathologist',
    'doctor_radiologist',
    'doctor_sonologist',
    'doctor_cardiologist',
    'doctor_pme',
  ];
  if (doctors && doctors.length) {
    const newDoctors = doctors
      .filter(doctor => {
        const roles = _.get(doctor, 'roles') || [];
        return doctorRoles.findIndex(dr => roles
          .findIndex(mr => mr === dr) > -1,
        ) > -1;
      });

    return _.last(newDoctors);
  }

  return null;
};

export const formatAttendingDoctorName = doctors => {
  const doctor = getAttendingDoctor(doctors);
  if (!_.isEmpty(doctor)) {
    return prettifyDoctorNameFirst(doctor);
  }

  return null;
};

export const formatAttendingDoctorPRCNo = doctors => {
  const doctor = getAttendingDoctor(doctors);
  if (!_.isEmpty(doctor)) {
    return _.get(doctor, 'doc_PRCLicenseNo') || _.get(doctor, 'PRCLicenseNo');
  }

  return null;
};

export const formatAttendingDoctorPTRNo = doctors => {
  const doctor = getAttendingDoctor(doctors);
  if (!_.isEmpty(doctor)) return _.get(doctor, 'doc_PTRNumber');

  return null;
};

export const formatAttendingDoctorESig = doctors => {
  const doctor = getAttendingDoctor(doctors);
  if (!_.isEmpty(doctor)) {
    const base64 = _.get(doctor, 'doc_eSignatureDataURI');
    const url = base64 || _.get(doctor, 'doc_eSignatureURL');
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.setAttribute('height', '75');
      return img.outerHTML;
    }
  }

  return null;
};

export const fuzzySexMatch = sex => {
  switch (_.lowerCase(sex)) {
    case 'male':
    case 'm':
      return 'Male';
    case 'female':
    case 'f':
      return 'Female';
    default:
      return null;
  }
};

export const fuzzyMaritalStatusMatch = sex => {
  switch (_.lowerCase(sex)) {
    case 'single':
      return 'Single';
    case 'married':
      return 'Married';
    case 'widow':
      return 'Widow';
    case 'widower':
      return 'Widower';
    default:
      return null;
  }
};

export const calculateAge = (dateOfBirth, date = new Date()) => {
  if (!dateOfBirth) return null;
  const diffYears = differenceInYears(date, dateOfBirth);
  const year = `${diffYears} year${diffYears <= 1 ? '' : 's'}`;
  const diffMonths = differenceInMonths(date, dateOfBirth);
  const months = diffMonths - (diffYears * 12);
  const month = `${months} month${months <= 1 ? '' : 's'}`;
  if (diffYears < 1) return month;
  if (diffYears >= 1 && diffYears <= 5) return `${year} ${month}`;
  return diffYears;
};

export const getRecords = (records, type, subtype) => {
  const exp = r => r.type === type && (!subtype || r.subtype === subtype);
  return (records || []).filter(exp);
};

export const getPatientHMO = patient => {
  const data = patient?.insuranceCards || [];
  const hmos = patient?.hmos || patient?.$populated?.hmos ||
    patient?.insuranceCardsData || patient?.$populated?.insuranceCardsData || [];

  return data.map(card => {
    const hmo = hmos.find(h => h.id === card.insurance);
    if (hmo) {
      card.insurerName = hmo.insurerName || hmo.name || card.name;
    }
    return card;
  });
};

export const getPatientCompanies = patient => {
  const data = patient?.companies || [];
  const partners = patient?.companyPartners || patient.$populated?.companyPartners || [];
  return data.map(card => {
    card.insurerName = card.name;
    const company = partners.find(c => c.id === card.id || c.id === card.company);
    if (company) {
      card.insurerName = company.name || company.insurerName || card.name;
    }
    return card;
  });
};

export const formatPatientHMO = patient => {
  return getPatientHMO(patient)
    .map(r => r.name || r.insurerName)
    .filter(r => !_.isEmpty(r))
    .join(', ');
};

export const formatPatientHMOCardNo = patient => {
  return (_.get(patient, 'insuranceCards') || [])
    .map(r => r.number)
    .filter(r => !_.isEmpty(r))
    .join(', ');
};

export const formatPatientHMOValidityDate = patient => {
  const card = _.get(patient, 'insuranceCards[0]');
  if (card && card.validAt) {
    return format(card.validAt, 'MMMM D, YYYY');
  }

  return null;
};

export const formatPatientHMOExpiryDate = patient => {
  const card = _.get(patient, 'insuranceCards[0]');
  if (card && card.expiresAt) {
    return format(card.expiresAt, 'MMMM D, YYYY');
  }

  return null;
};

export const formatPatientHMOStatus = patient => {
  const card = _.get(patient, 'insuranceCards[0]');
  if (card && card.status) {
    return card.status;
  }

  return null;
};

export const formatPatientCompanies = patient => {
  if (_.get(patient, 'companyPartners') || _.get(patient, 'companies')) {
    return getPatientCompanies(patient)
      .map(r => r.name || r.insurerName)
      .filter(r => !_.isEmpty(r))
      .join(', ');
  } else if (_.get(patient, 'company')) {
    return _.get(patient, 'company');
  }

  return null;
};

export const formatPatientCompaniesCardNo = patient => {
  return (_.get(patient, 'companies') || [])
    .map(r => r.companyId)
    .filter(r => !_.isEmpty(r))
    .join(', ');
};

export const formatPatientDisplayPicture = (patient, width = '75', height = '75') => {
  const img = document.createElement('img');
  if (_.get(patient, 'picURL')) {
    img.src = _.get(patient, 'picURL');
  }
  img.setAttribute('height', height);
  img.setAttribute('width', width);

  return img.outerHTML;
};

export const formatSocialHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.exercises) res.push('Exercising');
  if (r.drinksAlcohol) res.push('Drinking Alcohol');
  if (r.smoking) {
    let i = 'Smoking';
    if (r.smokingSticksPerDay) {
      i = `${i} (${r.smokingSticksPerDay} sticks per day)`;
    }
    if (r.smokingYears) {
      i = `${i} (${r.smokingYears} years of smoking)`;
    }
    res.push(i);
  }
  if (r.usesProhibitedDrugs) {
    let i = 'Uses prohibited drugs';
    if (r.drugName) {
      i = `${i} (${r.drugName})`;
    }
    if (r.drugLastUsedAt) {
      i = `${i} (Last used: ${format(r.drugLastUsedAt, 'MM/DD/YY')})`;
    }
    res.push(i);
  }
  if (r.sexuallyActive) {
    let i = 'Sexually active';
    if (r.numOfSexualPartners) {
      i = `${i} (No. of partners: ${r.numOfSexualPartners})`;
    }
    res.push(i);
  }
  if (r.educationalLevel) res.push(`Educational Level: ${r.educationalLevel}`);
  if (r.others) res.push(`Others: ${r.others}`);

  return res.join(' ');
};

export const formatSocialHxPackYears = r => {
  if (_.isEmpty(r)) return null;
  if (!r.smoking) return null;
  if (!r.smokingSticksPerDay && !r.smokingYears) return null;
  const x = r.smokingSticksPerDay;
  const y = r.smokingYears;
  const z = (+x / 20) * +y;
  return `${z} pack/year`;
};

export const formatBirthHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.deliveredAt) res.push(`${format(r.deliveredAt, 'MM/DD/YY')}`);
  if (r.methodOfDelivery) res.push(`${r.methodOfDelivery}`);
  if (r.attendedBy) res.push(`${r.attendedBy}`);
  if (r.complications) res.push(`${r.complications}`);
  if (r.notes) res.push(`${r.notes}`);

  return res.join(' ');
};

export const formatGynecologicHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.prevCervicSmearsDate) res.push(`Previous Cervix Smears Date: ${format(r.prevCervicSmearsDate, 'MM/DD/YY')}`);
  if (r.prevCervicSmearsResult) res.push(`Previous Cervix Smears Result: ${r.prevCervicSmearsResult}`);
  if (r.prevProblemsTreatments) res.push(`Previous Problems/Treatments: ${r.prevProblemsTreatments}`);
  if (r.currentContraception) res.push(`Current Contraception: ${r.currentContraception}`);
  if (r.notes) res.push(`Notes: ${r.notes}`);

  return res.join(' ');
};

export const formatHospitalizationHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.hospitalizedAt) res.push(`${format(r.hospitalizedAt, 'MM/DD/YY')}`);
  if (r.hospitalName) res.push(`${r.hospitalName}`);
  if (r.diagnosis) res.push(`${r.diagnosis}`);
  if (r.treatment) res.push(`${r.treatment}`);
  if (r.notes) res.push(`${r.notes}`);

  return res.join(' ');
};

export const formatMenstrualHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.menarche) res.push(`Menarche: ${r.menarche}`);
  if (r.interval) res.push(`Interval (days): ${r.interval}`);
  if (r.duration) res.push(`Duration (days): ${r.duration}`);
  if (r.amount) res.push(`Amount (mL): ${r.amount}`);
  if (r.notes) res.push(`Notes: ${r.notes}`);

  return res.join(' ');
};

export const formatObstestricHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.LMP) res.push(`LMP: ${r.LMP}`);
  if (r.PMP) res.push(`PMP: ${r.PMP}`);
  if (r.gravidity) res.push(`Gravidity: ${r.gravidity}`);
  if (r.parity) res.push(`Parity: ${r.parity}`);
  if (r.notes) res.push(`Notes: ${r.notes}`);

  return res.join(' ');
};

export const formatSurgicalHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.performedAt) res.push(`${format(r.performedAt, 'MM/DD/YY')}`);
  if (r.hospitalName) res.push(`${r.hospitalName}`);
  if (r.procedure) res.push(`${r.procedure}`);
  if (r.notes) res.push(`${r.notes}`);

  return res.join(' ');
};

export const formatDentalHistory = r => {
  const res = [];
  if (!r) return null;
  if (r.medicalConditionAt) res.push(`Date occured: ${format(r.medicalConditionAt, 'MM/DD/YY')}`);
  if (r.teeth && r.teeth.length) res.push(`Teeth: ${r.teeth.join(', ')}`);
  if (r.gingivae) res.push(`Gingivae: ${r.gingivae}`);
  if (r.palate) res.push(`Palate: ${r.palate}`);
  if (r.frenum) res.push(`Frenum: ${r.frenum}`);
  if (r.profile) res.push(`Profile: ${r.profile}`);
  if (r.hygiene) res.push(`Hygiene: ${r.hygiene}`);
  if (r.abrasions) res.push(`Abrasions: ${r.abrasions}`);
  if (r.recededGums) res.push(`Receded gums: ${r.recededGums}`);
  if (r.mouthOpening) res.push(`Mouth opening: ${r.mouthOpening}`);
  if (r.oropharynx) res.push(`Oropharynx: ${r.oropharynx}`);
  if (r.teethDiscoloration) res.push(`Teeth discoloration: ${r.teethDiscoloration}`);
  if (r.calculus) res.push(`Calculus: ${r.calculus}`);
  if (r.malocclusion) res.push(`Malocclusion: ${r.malocclusion}`);
  if (r.mentalis) res.push(`Mentalis: ${r.mentalis}`);
  if (r.swallowing) res.push(`Swallowing: ${r.swallowing}`);
  if (r.gagFlex) res.push(`Gag flex: ${r.gagFlex}`);
  if (r.habits && r.habits.length) res.push(`Habits: ${r.habits.join(', ')}`);
  if (r.complications && r.complications.length) res.push(`Complications: ${r.complications.join(', ')}`);

  return res.join(', ');
};

export const formatROS = r => {
  const res = [];
  if (!r) return null;
  if (r.general) res.push(`General: ${r.general}`);
  if (r.eyes) res.push(`Eyes: ${r.eyes}`);
  if (r.skin) res.push(`Skin: ${r.skin}`);
  if (r.ent) res.push(`HEENT: ${r.ent}`);
  if (r.neck) res.push(`Neck: ${r.neck}`);
  if (r.breasts) res.push(`Chest/Breast: ${r.breasts}`);
  if (r.respiratory) res.push(`Respiratory/Lungs: ${r.respiratory}`);
  if (r.cardiovascular) res.push(`Heart: ${r.cardiovascular}`);
  if (r.gastrointestinal) res.push(`Gastrointestinal/Abdomen: ${r.gastrointestinal}`);
  if (r.peripheralVascular) res.push(`Peripheral Vascular: ${r.peripheralVascular}`);
  if (r.genitourinary) res.push(`Genitourinary: ${r.genitourinary}`);
  if (r.musculoskeletal) res.push(`Musculoskeletal: ${r.musculoskeletal}`);
  if (r.psychiatric) res.push(`Psychiatric: ${r.psychiatric}`);
  if (r.hematologicLymphatic) res.push(`Hematologic: ${r.hematologicLymphatic}`);
  if (r.endocrine) res.push(`Endocrine: ${r.endocrine}`);
  if (r.allergicImmunologic) res.push(`Allergic Immunologic: ${r.allergicImmunologic}`);

  return res.join(', ');
};

export const calcBMI = (w, h) => {
  if (typeof w !== 'number') return;
  if (typeof h !== 'number') return;
  const weight = parseInt(w);
  const height = parseInt(h);
  let final;
  if (weight && height) {
    const bmi = (weight / (height * height)) * 10000;
    final = Math.round(bmi * 100) / 100;
  }
  return final;
};
export const getLbUtil = (w) => {
  const LB_PER_KG = 2.2046;
  if (!w) return;
  return +(w * LB_PER_KG).toFixed(2);
};
export const getFtUtil = (h) => {
  const FT_PER_CM = 0.032808;
  if (!h) return;
  return +(h * FT_PER_CM).toFixed(2);
};
const computeEdcByDate = (date) => {
  if (!date) return '--';
  return format(addDays(addMonths(date, 9), 7), 'MM/DD/YY');
};
const computeAOGUsingLMP = (date, createdAt) => {
  if (!date) return '--';

  if (!createdAt) createdAt = Date.now();

  const totalDiffDays = differenceInDays(createdAt, date);
  const weeks = Math.floor(totalDiffDays / 7);
  const remainderDays = totalDiffDays % 7;

  if (weeks < 1) {
    const desc = remainderDays === 1 ? 'day' : 'days';
    return `${remainderDays} ${desc}`;
  }

  return `${weeks} w, ${remainderDays} d`;
};
const computeEDCUsingUS = (date, aog) => {
  if (!date || !aog) return '--';
  const days = 280 - aog;
  return format(addDays(date, days), 'MM/DD/YY');
};

export const formatVitals = r => {
  const res = [];
  if (!r) return null;
  if (r.takenAt) res.push(`Date Taken: ${format(r.takenAt, 'MM/DD/YY')}`);
  if (r.weight) res.push(`Weight (kg): ${r.weight}`);
  if (r.height) res.push(`Hieght (cm): ${r.height}`);
  if (r.weight && r.height) res.push(`BMI: ${calcBMI(r.weight, r.height)}`);
  if (r.bpSystolic) res.push(`BP Systolic: ${r.bpSystolic}`);
  if (r.bpDiastolic) res.push(`BP Diastolic: ${r.bpDiastolic}`);
  if (r.pulse) res.push(`Pulse Rate (bpm): ${r.pulse}`);
  if (r.respiration) res.push(`Respiration Rate (rpm): ${r.respiration}`);
  if (r.temperature) res.push(`Temp (°C): ${r.temperature}`);
  if (r.temperatureMethod) res.push(`Temp Location: ${r.temperatureMethod}`);
  if (r.headCircumference) res.push(`Head Circ (cm): ${r.headCircumference}`);
  if (r.waistCircumference) res.push(`Waist Circ (cm): ${r.waistCircumference}`);
  if (r.neckCircumference) res.push(`Neck Circ (cm): ${r.neckCircumference}`);
  if (r.abdominalCircumference) res.push(`Abdominal Circ (cm): ${r.abdominalCircumference}`);
  if (r.chestCircumference) res.push(`Chest Circ (cm): ${r.chestCircumference}`);
  if (r.endocrine) res.push(`Chest Inspiration (cm): ${r.endocrine}`);
  if (r.chestExpiration) res.push(`Chest Expiration (cm): ${r.chestExpiration}`);
  if (r.o2sats) res.push(`O2 Sat (mm): ${r.o2sats}`);
  if (r.lmp) res.push(`LMP Date:  ${format(r.lmp, 'MM/DD/YY')}`);
  if (r.lmp) res.push(`EDC: ${computeEdcByDate(r.lmp)}`);
  if (r.lmp) res.push(`AOG: ${computeAOGUsingLMP(r.lmp, r.createdAt)}`);
  // - Old Visual Acuity Fields - will only show if there are old existing records
  if (r.visualAcuityDsntUncorrectL) res.push(`Distant Uncorrected (L): 20/${r.visualAcuityDsntUncorrectL}`);
  if (r.visualAcuityDsntUncorrectR) res.push(`Distant Uncorrected (R): 20/${r.visualAcuityDsntUncorrectR}`);
  if (r.visualAcuityDsntCorrectL) res.push(`Distant Corrected (L): 20/${r.visualAcuityDsntCorrectL}`);
  if (r.visualAcuityDsntCorrectR) res.push(`Distant Corrected (R): 20/${r.visualAcuityDsntCorrectR}`);
  if (r.visualAcuityNearUncorrectL) res.push(`Near Uncorrected (L): 20/${r.visualAcuityNearUncorrectL}`);
  if (r.visualAcuityNearUncorrectR) res.push(`Near Uncorrected (R): 20/${r.visualAcuityNearUncorrectR}`);
  if (r.visualAcuityNearCorrectL) res.push(`Near Corrected (L): 20/${r.visualAcuityNearCorrectL}`);
  if (r.visualAcuityNearCorrectR) res.push(`Near Corrected (R): 20/${r.visualAcuityNearCorrectR}`);
  // - Added colorVision checker to avoid records confusion
  if (r.visualAcuityVisionNormal && !r.colorVision) res.push(`Color Vision (Normal): ${r.visualAcuityVisionNormal}`);
  if (r.visualAcuityVisionAbnormal && !r.colorVision) res.push(`Color Vision (Abnormal): ${r.visualAcuityVisionAbnormal}`);
  // - New Visual Acuity Fields
  if (r.visualAcuityLeft) res.push(`Visual Acuity (L): ${r.visualAcuityLeft}`);
  if (r.visualAcuityRight) res.push(`Visual Acuity (R): ${r.visualAcuityRight}`);
  if (r.visualRemarks) res.push(`Visual Remarks: ${r.visualRemarks}`);
  if (r.colorVision) res.push(`Color Vision: ${r.colorVision}`);

  return res.join(', ');
};

// const formatVitalsWeightKgToLbs = weight => {
//   const LB_PER_KG = 2.2046;
//   return +(weight * LB_PER_KG).toFixed(2);
// };

// const formatVitalsWeightLbsToKg = weight => {
//   const LB_PER_KG = 2.2046;
//   return +(weight / LB_PER_KG).toFixed(2);
// };

// const formatVitalsHeightCmToFt = height => {
//   const FT_PER_CM = 0.032808;
//   return +(height * LB_PER_KG).toFixed(2);
// };

// const formatVitalsHeightFtToCm = height => {
//   const FT_PER_CM = 0.032808;
//   return +(height / LB_PER_KG).toFixed(2);
// };

export const formatENTNote = r => {
  const res = [];
  if (!r) return null;
  if (r.cpapPressure) res.push(`CPAP Pressure (cmH2O): ${r.cpapPressure}`);
  if (r.height) res.push(`BIPAP Inspiration (cmH2O): ${r.height}`);
  if (r.bipapExpiration) res.push(`BIPAP Expiration (cmH2O): ${r.bipapExpiration}`);
  if (r.lsatPressure) res.push(`LSAT Pressure (%): ${r.lsatPressure}`);
  if (r.ahi) res.push(`AHI (events/hr): ${r.ahi}`);
  if (r.pulse) res.push(`Ramp Time (minutes): ${r.pulse}`);
  if (r.psgDiagnostic) res.push(`PSG Diagnostic: ${r.psgDiagnostic}`);
  if (r.psgTherapeutic) res.push(`PSG Therapeutic: ${r.psgTherapeutic}`);
  if (r.psgSplit) res.push(`PSG Split: ${r.psgSplit}`);

  return res.join(', ');
};

export const formatOBNote = r => {
  const res = [];
  if (!r) return null;
  if (r.lmp) res.push(`LMP Date: ${format(r.lmp, 'MM/DD/YY')}`);
  if (r.ultrasoundDate) res.push(`US Date: ${format(r.ultrasoundDate, 'MM/DD/YY')}`);
  if (r.ultrasoundAog) res.push(`AOG by US: ${r.ultrasoundAog}`);
  if (r.lmp) res.push(`EDC: ${computeEdcByDate(r.lmp)}`);
  if (r.lmp) res.push(`AOG: ${computeAOGUsingLMP(r.lmp, r.createdAt)}`);
  if (r.ultrasoundDate && r.ultrasoundAog) res.push(`EDC by US: ${computeEDCUsingUS(r.ultrasoundDate, r.ultrasoundAog)}`);
  if (r.fundalHeight) res.push(`Fundal Height (cm): ${r.fundalHeight}`);
  if (r.fetalHeartTone) res.push(`Fetal Heart Tone (bpm): ${r.fetalHeartTone}`);
  if (r.examFindings) res.push(`Internal Exam Findings: ${r.examFindings}`);

  return res.join(', ');
};

export const levelOfConsciousness = consciousnessLevel => {
  const type1Level = [
    { title: 'Alert', image: 'alert.png', val: 1 },
    { title: 'Verbal Stimuli', image: 'verbal.png', val: 2 },
    { title: 'Painful Stimuli', image: 'painful.png', val: 3 },
    { title: 'Unresponsive', image: 'unresponsive.png', val: 4 },
  ];
  if (consciousnessLevel) {
    const index = (type1Level || []).findIndex(val => val.val === consciousnessLevel);
    if (index > -1) {
      return type1Level[index];
    }
  }

  return undefined;
};
const painAssessment = painAssessment => {
  const type1Level = [
    { title: 'No Pain', image: 'pain-no.png', val: 1 },
    { title: 'Mild', image: 'pain-mild.png', val: 2 },
    { title: 'Moderate', image: 'pain-moderate.png', val: 3 },
    { title: 'Severe', image: 'pain-severe.png', val: 4 },
    { title: 'Very Severe', image: 'pain-very.png', val: 5 },
    { title: 'Worst Pain Possible', image: 'pain-worst.png', val: 6 },
  ];
  if (painAssessment) {
    const index = (type1Level || []).findIndex(val => val.val === painAssessment);
    if (index > -1) {
      return type1Level[index];
    }
  }

  return undefined;
};

export const dentalExamLocations = [
  { key: 'dentalExamRightUpper', name: 'Dental Examination - Upper Right' },
  { key: 'dentalExamRightLower', name: 'Dental Examination - Lower Right' },
  { key: 'dentalExamLeftUpper', name: 'Dental Examination - Upper Right' },
  { key: 'dentalExamLeftLower', name: 'Dental Examination - Lower Right' },
];
const dentalExamFields = ['8', '7', '6', '5', '4', '3', '2', '1'];
const isDentalExaminationVisible = (key, record) => {
  if (record) {
    for (const field of dentalExamFields) {
      if (!_.isEmpty(record[`${key}${field}`])) { return true; }
    }
  }
};
export const formatPE = r => {
  const res = [];
  if (!r) return null;
  if (r.physicalExam) res.push(`Physical Exam: ${r.physicalExam}`);
  if (r.consciousnessLevel) res.push(`Level of Consciousness: ${levelOfConsciousness(r.consciousnessLevel)?.title}`);
  if (r.consciousnessLevelScale) res.push(`Level of Consciousness: ${r.consciousnessLevelScale}/7`);
  if (r.painAssessment) res.push(`Pain Assessment: ${painAssessment(r.painAssessment)?.title}`);
  if (r.painAssessmentScale) res.push(`Pain Assessment: ${r.painAssessmentScale}/10`);
  for (const loc of dentalExamLocations) {
    if (isDentalExaminationVisible(loc.key, r)) {
      let item = loc.name;
      for (const field of dentalExamFields) {
        const data = r[loc.key + field];
        if (data) item = item + ` (${data})`;
      }
      res.push(item);
    }
  }
  if (r.dentalNote) res.push(`Dental Survey: ${r.dentalNote}`);

  return res.join(', ');
};

export const formatPrescription = r => {
  const res = [];
  if (!r) return null;
  if (r.items && r.items.length) {
    for (const item of r.items) {
      let i = guard`${item.genericName} ${item.formulation} # ${item.dispense}`;
      if (item.brandName) {
        i = i + `<br>${item.brandName}`;
      }
      if (item.dosageSig || item.frequency) {
        i = i + guard`<br>Sig: ${item.dosageSig} ${item.frequency}`;
      }
      if (item.note) {
        i = i + guard`<br>${item.note}`;
      }

      res.push(i);
    }
  }
  return res.join(', ');
};

export const formatDiagnosticOrder = r => {
  if (!r) return null;
  let i = '';
  if (r.tests && r.tests.length) {
    i = r.tests.map(t => t.name).join(', ');
  }
  if (r.reason) i = `${i}<br>Reason: ${r.reason}`;
  if (r.requestingPhysician) i = `${i}<br>Requesting Physician: ${r.requestingPhysician}`;

  return i;
};

export const formatDentalNote = r => {
  if (!r) return null;
  let i = '';
  if (r.teeth && r.teeth.length) i = `Location: (${r.tests.join(', ')})`;
  if (r.reason) i = `${i}<br>Reason: ${(r.status || {}).abbreviation || ''} - ${(r.status || {}).description || ''}`;

  return i;
};

export const formatClinicLogo = (clinic, width = '75', height = '75') => {
  const img = document.createElement('img');
  const base64 = _.get(clinic, 'picDataURI');
  const url = base64 || _.get(clinic, 'picURL');
  if (url) {
    img.src = url;
  }
  img.setAttribute('height', height);
  img.setAttribute('width', width);

  return img.outerHTML;
};

export const formatClinicBanner = (clinic, width = '100%', height = 'na') => {
  const img = document.createElement('img');
  if (_.get(clinic, 'mf_printHeaderTemplate.picURL')) {
    img.src = _.get(clinic, 'mf_printHeaderTemplate.picURL');
  }
  img.setAttribute('height', height);
  img.setAttribute('width', width);

  return img.outerHTML;
};

export const formatDentalNoteTable = (recs, diagnoses) => {
  const records = _.cloneDeep(recs) || [];
  if (records.length < 8) {
    for (var i = 0; i < (8 - records.length); i++) {
      records.push({});
    }
  }

  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  table.style['border-collapse'] = 'collapse';
  const tbody = document.createElement('tbody');
  const head = document.createElement('tr');

  // tooth
  const toothNoCol = document.createElement('td');
  toothNoCol.style.border = '1px solid #ddd';
  toothNoCol.style.fontWeight = '700';
  toothNoCol.style.padding = '2px';
  toothNoCol.style.width = '10%';
  toothNoCol.appendChild(document.createTextNode('TOOTH NO.'));
  head.appendChild(toothNoCol);

  // dianosis
  const diagnosisCol = document.createElement('td');
  diagnosisCol.style.border = '1px solid #ddd';
  diagnosisCol.style.fontWeight = '700';
  diagnosisCol.style.width = '23%';
  diagnosisCol.style.padding = '2px';
  diagnosisCol.appendChild(document.createTextNode('DIAGNOSIS'));
  head.appendChild(diagnosisCol);

  // procedure
  const procedureCol = document.createElement('td');
  procedureCol.style.border = '1px solid #ddd';
  procedureCol.style.fontWeight = '700';
  procedureCol.style.width = '23%';
  procedureCol.style.padding = '2px';
  procedureCol.appendChild(document.createTextNode('PROCEDURE DONE'));
  head.appendChild(procedureCol);

  // surface count
  const surfaceCol = document.createElement('td');
  surfaceCol.style.border = '1px solid #ddd';
  surfaceCol.style.fontWeight = '700';
  surfaceCol.style.width = '10%';
  surfaceCol.style.padding = '2px';
  surfaceCol.appendChild(document.createTextNode('NUMBER OF\nSURFACES'));
  head.appendChild(surfaceCol);

  // px signature count
  const pxSigCol = document.createElement('td');
  pxSigCol.style.border = '1px solid #ddd';
  pxSigCol.style.fontWeight = '700';
  pxSigCol.style.width = '23%';
  pxSigCol.style.padding = '2px';
  pxSigCol.appendChild(document.createTextNode('PATIENT\'S SIGNATURE'));
  head.appendChild(pxSigCol);

  // amount count
  const amountCol = document.createElement('td');
  amountCol.style.border = '1px solid #ddd';
  amountCol.style.fontWeight = '700';
  amountCol.style.width = '10%';
  amountCol.style.padding = '2px';
  amountCol.appendChild(document.createTextNode('AMOUNT'));
  head.appendChild(amountCol);

  tbody.appendChild(head);

  for (const r of records) {
    const row = document.createElement('tr');
    // tooth
    const toothNoCol = document.createElement('td');
    toothNoCol.style.border = '1px solid #ddd';
    toothNoCol.style.padding = '2px';
    toothNoCol.style.width = '10%';
    toothNoCol.style.height = '40px';
    const toothNo = document.createTextNode((r.teeth || []).join(', '));
    toothNoCol.appendChild(toothNo);
    row.appendChild(toothNoCol);

    // dianosis
    const diagnosisCol = document.createElement('td');
    diagnosisCol.style.border = '1px solid #ddd';
    diagnosisCol.style.width = '23%';
    diagnosisCol.style.padding = '2px';
    diagnosisCol.style.height = '40px';
    if (!_.isEmpty(r)) {
      const diagnosis = document.createTextNode((diagnoses || []).join(', ') || ' ');
      diagnosisCol.appendChild(diagnosis);
    }
    row.appendChild(diagnosisCol);

    // procedure
    const procedureCol = document.createElement('td');
    procedureCol.style.border = '1px solid #ddd';
    procedureCol.style.width = '23%';
    procedureCol.style.padding = '2px';
    procedureCol.style.height = '40px';
    let procedures = [
      (r.service || {}).name || '',
      ((r.$populated || {}).service || {}).name || '',
    ];
    procedures = procedures.filter(r => !_.isEmpty(r));
    const procedure = document.createTextNode(procedures.join(', ') || ' ');
    procedureCol.appendChild(procedure);
    row.appendChild(procedureCol);

    // surface count
    const surfaceCol = document.createElement('td');
    surfaceCol.style.border = '1px solid #ddd';
    surfaceCol.style.width = '10%';
    surfaceCol.style.padding = '2px';
    surfaceCol.style.height = '40px';
    const surface = document.createTextNode((r.surfaces || []).length || ' ');
    surfaceCol.appendChild(surface);
    row.appendChild(surfaceCol);

    // px signature count
    const pxSigCol = document.createElement('td');
    pxSigCol.style.border = '1px solid #ddd';
    pxSigCol.style.width = '23%';
    pxSigCol.style.padding = '2px';
    pxSigCol.style.height = '40px';
    pxSigCol.appendChild(document.createTextNode(' '));
    row.appendChild(pxSigCol);

    // amount count
    const amountCol = document.createElement('td');
    amountCol.style.border = '1px solid #ddd';
    amountCol.style.width = '10%';
    amountCol.style.padding = '2px';
    amountCol.style.height = '40px';
    amountCol.appendChild(document.createTextNode(' '));
    row.appendChild(amountCol);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  return table.outerHTML;
};
