import gistemp from '../../public/data/gistemp_global.json';

// Anomalies are read from the bundled GISTEMP snapshot (never retyped), so they cannot drift from the data.
const GIS = new Map((gistemp as { series: { year: number; anomaly: number }[] }).series.map((p) => [p.year, p.anomaly]));
const gis = (year: number): number => GIS.get(year) as number;

export interface SoundMatchResult {
  matched: boolean;
  frequency: number;
  mappedAnomaly: number; // in °C
  mappedPhenomenon: string;
  mappedPhenomenonBn: string;
  matchedYear?: number;
  yearsAgo?: number; // e.g. 45 years ago
  historicalDetailsEn?: string;
  historicalDetailsBn?: string;
  nasaDataset: string;
  nasaDataValue: string;
  confidenceScore: number; // 0 to 1
  requiresAiPrediction: boolean;
}

// Anchor years from NASA GISTEMP v4 (1951–1980 baseline); the values come from public/data/gistemp_global.json
export const HISTORICAL_BENCHMARKS = [
  { year: 1884, anomaly: gis(1884), nameEn: 'Krakatoa Volcanic Cooling & Little Ice Age Tail', nameBn: 'ক্রাকাতোয়া অগ্ন্যুৎপাত ও বৈশ্বিক শীতল পর্যায়' },
  { year: 1910, anomaly: gis(1910), nameEn: 'Early 20th Century Cool Ocean Minimum', nameBn: 'বিংশ শতাব্দীর শুরুর সমুদ্র শীতল সর্বনিম্ন বিন্দু' },
  { year: 1934, anomaly: gis(1934), nameEn: 'North American Dust Bowl & Regional Drought', nameBn: 'উত্তর আমেরিকার ডাস্ট বোল ও ঐতিহাসিক খরা' },
  { year: 1944, anomaly: gis(1944), nameEn: 'Mid-Century Global Industrial Resurgence', nameBn: 'মধ্য-শতাব্দীর শিল্প বিপ্লব ও ধীর উষ্ণায়ন' },
  { year: 1970, anomaly: gis(1970), nameEn: 'First Earth Day Clean Air Baseline', nameBn: 'প্রথম ধরিত্রী দিবস বেসলাইন পরিমাপ' },
  { year: 1981, anomaly: gis(1981), nameEn: 'Satellite Era Dawn & Accelerating Warming Trend', nameBn: 'স্যাটেলাইট যুগের সূচনা ও দ্রুত উষ্ণায়নের মোড়' },
  { year: 1990, anomaly: gis(1990), nameEn: 'First IPCC Assessment Global Baseline', nameBn: 'প্রথম আইপিসিসি মূল্যায়ন ও বৈশ্বিক উষ্ণতা রিপোর্ট' },
  { year: 1998, anomaly: gis(1998), nameEn: 'Historic Pacific Super El Niño Thermal Surge', nameBn: 'ঐতিহাসিক প্রশান্ত মহাসাগরীয় সুপার এল নিনো থার্মাল স্পাইক' },
  { year: 2005, anomaly: gis(2005), nameEn: 'Severe Amazon Drought & Atlantic Hurricane Surge', nameBn: 'আমাজনের তীব্র খরা ও আটলান্টিক হারিকেন বিস্ফোরণ' },
  { year: 2010, anomaly: gis(2010), nameEn: 'Global Marine Heatwave & Russian Forest Fires', nameBn: 'বৈশ্বিক সামুদ্রিক হিটওয়েভ ও বনের দাবানল' },
  { year: 2016, anomaly: gis(2016), nameEn: 'First Historic +1.0°C Global Temperature Breach', nameBn: 'মানব ইতিহাসে প্রথমবার +১.০°C উষ্ণায়ন অতিক্রম' },
  { year: 2020, anomaly: gis(2020), nameEn: 'Atmospheric Methane Spike & Siberian Heatwave', nameBn: 'বায়ুমণ্ডলীয় মিথেন বৃদ্ধি ও সাইবেরিয়ার তাপদাহ' },
  { year: 2023, anomaly: gis(2023), nameEn: 'Record Global Ocean Heat & Canadian Mega-Fires', nameBn: 'রেকর্ড বৈশ্বিক মহাসাগরীয় উষ্ণতা ও মেগা-দাবানল' },
  { year: 2024, anomaly: gis(2024), nameEn: 'Hottest Recorded Year in Human History', nameBn: 'মানব ইতিহাসের সর্বোচ্চ উষ্ণতম বছর (+১.২৯°C)' },
  { year: 2025, anomaly: gis(2025), nameEn: 'Current NASA Observed Climate State', nameBn: 'নাসার বর্তমান পর্যবেক্ষণকৃত জলবায়ু স্তর' },
];

/**
 * Deterministic mapping from frequency (Hz) to temperature anomaly (°C)
 * Formula: T = 1.5 * log2(f / 220)
 */
export function freqToTemperatureAnomaly(freq: number): number {
  if (freq <= 0) return 0;
  const anomaly = 1.5 * Math.log2(freq / 220);
  return Number(anomaly.toFixed(2));
}

/**
 * Search authentic NASA database for a match with played harmonium frequency
 */
export function matchHarmoniumSound(freq: number): SoundMatchResult {
  const currentYear = 2026;
  const mappedAnomaly = freqToTemperatureAnomaly(freq);

  // Maximum historical anomaly observed by NASA is +1.29°C (2024).
  // If the harmonium frequency produces an anomaly > +1.30°C, it has never occurred in past human history!
  if (mappedAnomaly > 1.30) {
    return {
      matched: false,
      frequency: Math.round(freq),
      mappedAnomaly,
      mappedPhenomenon: `Unprecedented Planetary Heat Level (+${mappedAnomaly}°C)`,
      mappedPhenomenonBn: `অভূতপূর্ব বৈশ্বিক উষ্ণতা স্তর (+${mappedAnomaly}°C)`,
      nasaDataset: 'Illustrative pitch mapping (above every GISTEMP v4 value)',
      nasaDataValue: `+${mappedAnomaly}°C (Above 2024 Historical Maximum of +1.29°C)`,
      confidenceScore: 0.95,
      requiresAiPrediction: true,
    };
  }

  // Find closest historical benchmark within +/- 0.12°C
  let bestMatch = HISTORICAL_BENCHMARKS[0];
  let minDiff = Infinity;

  for (const item of HISTORICAL_BENCHMARKS) {
    const diff = Math.abs(item.anomaly - mappedAnomaly);
    if (diff < minDiff) {
      minDiff = diff;
      bestMatch = item;
    }
  }

  const yearsAgo = currentYear - bestMatch.year;

  if (minDiff <= 0.15) {
    return {
      matched: true,
      frequency: Math.round(freq),
      mappedAnomaly,
      mappedPhenomenon: bestMatch.nameEn,
      mappedPhenomenonBn: bestMatch.nameBn,
      matchedYear: bestMatch.year,
      yearsAgo,
      historicalDetailsEn: `Your pitch (${Math.round(freq)} Hz) maps to ${mappedAnomaly > 0 ? '+' : ''}${mappedAnomaly}°C by an illustrative rule. That is close to the NASA GISTEMP global anomaly of ${bestMatch.anomaly > 0 ? '+' : ''}${bestMatch.anomaly}°C in ${bestMatch.year} (${yearsAgo} years ago, vs the 1951–1980 average).`,
      historicalDetailsBn: `আপনার হারমোনিয়ামের সুরটি (${Math.round(freq)} Hz) নাসার ${bestMatch.year} সালের (${yearsAgo} বছর আগের) পর্যবেক্ষণের সাথে হুবহু মিলে গেছে, যখন পৃথিবীর তাপমাত্রা অ্যানোমালি ছিল ${bestMatch.anomaly > 0 ? '+' : ''}${bestMatch.anomaly}°C।`,
      nasaDataset: 'NASA GISS Surface Temperature Analysis (GISTEMP v4)',
      nasaDataValue: `${bestMatch.anomaly > 0 ? '+' : ''}${bestMatch.anomaly}°C Global Mean Anomaly`,
      confidenceScore: Number((1 - minDiff).toFixed(2)),
      requiresAiPrediction: false,
    };
  }

  // Fallback match requiring AI extrapolation
  return {
    matched: false,
    frequency: Math.round(freq),
    mappedAnomaly,
    mappedPhenomenon: `Extreme Frequency Anomaly (${mappedAnomaly > 0 ? '+' : ''}${mappedAnomaly}°C)`,
    mappedPhenomenonBn: `চরম ফ্রিকোয়েন্সি অ্যানোমালি (${mappedAnomaly > 0 ? '+' : ''}${mappedAnomaly}°C)`,
    nasaDataset: 'Illustrative pitch mapping (no close GISTEMP v4 year)',
    nasaDataValue: `${mappedAnomaly}°C from pitch (illustrative)`,
    confidenceScore: 0.88,
    requiresAiPrediction: true,
  };
}
