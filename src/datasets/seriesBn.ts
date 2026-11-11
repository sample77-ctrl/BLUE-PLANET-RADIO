import type { DataSeries } from './series';
import type { Lang } from '../lib/strings';

/** Bangla for the variable and source names the series adapters write in English. Unknown strings pass through unchanged (never a guessed translation). */
const VARIABLE: Record<string, string> = {
  'Global surface temperature anomaly': 'বৈশ্বিক ভূপৃষ্ঠের তাপমাত্রার বিচ্যুতি',
  'Atmospheric CO₂ (Mauna Loa annual mean)': 'বায়ুমণ্ডলের CO₂ (মৌনা লোয়ার বার্ষিক গড়)',
  'Arctic sea ice extent (September)': 'আর্কটিক সমুদ্রবরফের বিস্তৃতি (সেপ্টেম্বর)',
  'Fire radiative power (max per 2° cell)': 'আগুনের বিকিরণ ক্ষমতা (প্রতি ২° ঘরে সর্বোচ্চ)',
  'Strongest fire of the day (max FRP in any 2° cell)': 'দিনের সবচেয়ে শক্তিশালী আগুন (যেকোনো ২° ঘরে সর্বোচ্চ FRP)',
  'Daily precipitation (PRECTOTCORR)': 'দৈনিক বৃষ্টিপাত (PRECTOTCORR)',
  'Sea surface temperature anomaly (monthly)': 'সমুদ্রপৃষ্ঠের তাপমাত্রার বিচ্যুতি (মাসিক)',
  'Global mean sea surface temperature anomaly': 'বৈশ্বিক গড় সমুদ্রপৃষ্ঠের তাপমাত্রার বিচ্যুতি',
  'Air temperature at 2 m': '২ মিটার উচ্চতায় বাতাসের তাপমাত্রা',
  'Precipitation (bias-corrected)': 'বৃষ্টিপাত (ভুল-সংশোধিত)',
};
const SOURCE: Record<string, string> = {
  'NASA GISS Surface Temperature Analysis (GISTEMP v4), Land-Ocean global annual mean (J-D)': 'নাসা GISS সারফেস টেম্পারেচার অ্যানালাইসিস (GISTEMP v4), ভূমি ও সমুদ্র মিলিয়ে বৈশ্বিক বার্ষিক গড় (J-D)',
  'NASA GISS GISTEMP v4': 'নাসা GISS GISTEMP v4',
  'NASA GISS GISTEMP v4, global land-ocean annual mean, anomaly vs 1951–1980': 'নাসা GISS GISTEMP v4, ভূমি ও সমুদ্র মিলিয়ে বৈশ্বিক বার্ষিক গড়, ১৯৫১–১৯৮০-র তুলনায় বিচ্যুতি',
  'NOAA GML Mauna Loa annual mean CO₂ (the record on NASA Vital Signs)': 'NOAA GML মৌনা লোয়ার বার্ষিক গড় CO₂ (নাসা ভাইটাল সাইনসের রেকর্ড)',
  'NASA FIRMS VIIRS S-NPP NRT': 'নাসা FIRMS VIIRS S-NPP (প্রায়-রিয়েল-টাইম)',
  'NASA POWER (MERRA-2 based), daily': 'নাসা POWER (MERRA-2 ভিত্তিক), দৈনিক',
  'NASA JPL MUR SST via NOAA CoastWatch ERDDAP': 'নাসা JPL MUR SST, NOAA CoastWatch ERDDAP-এর মাধ্যমে',
};

export function localizeSeries(s: DataSeries, lang: Lang): DataSeries {
  if (lang !== 'bn') return s;
  const variable = VARIABLE[s.variable] ?? s.variable, source = SOURCE[s.source] ?? s.source;
  return variable === s.variable && source === s.source ? s : { ...s, variable, source };
}
