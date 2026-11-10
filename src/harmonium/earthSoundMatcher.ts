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

// Key anchor benchmarks from NASA GISTEMP v4 (1880–2025)
export const HISTORICAL_BENCHMARKS = [
  { year: 1884, anomaly: -0.29, nameEn: 'Krakatoa Volcanic Cooling & Little Ice Age Tail', nameBn: 'ক্রাকাতোয়া অগ্ন্যুৎপাত ও বৈশ্বিক শীতল পর্যায়' },
  { year: 1910, anomaly: -0.42, nameEn: 'Early 20th Century Cool Ocean Minimum', nameBn: 'বিংশ শতাব্দীর শুরুর সমুদ্র শীতল সর্বনিম্ন বিন্দু' },
  { year: 1934, anomaly: -0.12, nameEn: 'North American Dust Bowl & Regional Drought', nameBn: 'উত্তর আমেরিকার ডাস্ট বোল ও ঐতিহাসিক খরা' },
  { year: 1944, anomaly: 0.16, nameEn: 'Mid-Century Global Industrial Resurgence', nameBn: 'মধ্য-শতাব্দীর শিল্প বিপ্লব ও ধীর উষ্ণায়ন' },
  { year: 1970, anomaly: 0.03, nameEn: 'First Earth Day Clean Air Baseline', nameBn: 'প্রথম ধরিত্রী দিবস বেসলাইন পরিমাপ' },
  { year: 1981, anomaly: 0.32, nameEn: 'Satellite Era Dawn & Accelerating Warming Trend', nameBn: 'স্যাটেলাইট যুগের সূচনা ও দ্রুত উষ্ণায়নের মোড়' },
  { year: 1990, anomaly: 0.45, nameEn: 'First IPCC Assessment Global Baseline', nameBn: 'প্রথম আইপিসিসি মূল্যায়ন ও বৈশ্বিক উষ্ণতা রিপোর্ট' },
  { year: 1998, anomaly: 0.65, nameEn: 'Historic Pacific Super El Niño Thermal Surge', nameBn: 'ঐতিহাসিক প্রশান্ত মহাসাগরীয় সুপার এল নিনো থার্মাল স্পাইক' },
  { year: 2005, anomaly: 0.69, nameEn: 'Severe Amazon Drought & Atlantic Hurricane Surge', nameBn: 'আমাজনের তীব্র খরা ও আটলান্টিক হারিকেন বিস্ফোরণ' },
  { year: 2010, anomaly: 0.73, nameEn: 'Global Marine Heatwave & Russian Forest Fires', nameBn: 'বৈশ্বিক সামুদ্রিক হিটওয়েভ ও বনের দাবানল' },
  { year: 2016, anomaly: 1.01, nameEn: 'First Historic +1.0°C Global Temperature Breach', nameBn: 'মানব ইতিহাসে প্রথমবার +১.০°C উষ্ণায়ন অতিক্রম' },
  { year: 2020, anomaly: 1.01, nameEn: 'Atmospheric Methane Spike & Siberian Heatwave', nameBn: 'বায়ুমণ্ডলীয় মিথেন বৃদ্ধি ও সাইবেরিয়ার তাপদাহ' },
  { year: 2023, anomaly: 1.17, nameEn: 'Record Global Ocean Heat & Canadian Mega-Fires', nameBn: 'রেকর্ড বৈশ্বিক মহাসাগরীয় উষ্ণতা ও মেগা-দাবানল' },
  { year: 2024, anomaly: 1.29, nameEn: 'Hottest Recorded Year in Human History', nameBn: 'মানব ইতিহাসের সর্বোচ্চ উষ্ণতম বছর (+১.২৯°C)' },
  { year: 2025, anomaly: 1.19, nameEn: 'Current NASA Observed Climate State', nameBn: 'নাসার বর্তমান পর্যবেক্ষণকৃত জলবায়ু স্তর' },
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
      nasaDataset: 'NASA GISS GISTEMP v4 / IPCC Future Climate Projections',
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
      historicalDetailsEn: `Your harmonium sound (${Math.round(freq)} Hz) acoustically matches NASA observations from ${bestMatch.year} (${yearsAgo} years ago), when Earth's global temperature anomaly was recorded at ${bestMatch.anomaly > 0 ? '+' : ''}${bestMatch.anomaly}°C.`,
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
    nasaDataset: 'NASA Earth Information Jukebox Data Registry',
    nasaDataValue: `${mappedAnomaly}°C Projected Anomaly`,
    confidenceScore: 0.88,
    requiresAiPrediction: true,
  };
}
