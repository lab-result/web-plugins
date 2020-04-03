const LB_PER_KG = 2.2046;
const FT_PER_CM = 0.032808;

export const calcBMIUtil = (w = 0, h = 0) => {
  const weight = parseInt(w);
  const height = parseInt(h);
  let final;
  if (weight && height) {
    const bmi = (weight / (height * height)) * 10000;
    final = Math.round(bmi * 100) / 100;
  }
  return final;
};

export const getLbUtil = (w = 0) => {
  return +w * LB_PER_KG;
};

export const getKgUtil = (w = 0) => {
  return +w / LB_PER_KG;
};

export const getFtUtil = (h = 0) => {
  return +h * FT_PER_CM;
};

export const getCmUtil = (h = 0) => {
  return +h / FT_PER_CM;
};
