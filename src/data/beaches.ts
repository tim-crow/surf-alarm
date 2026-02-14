export interface WindAngles {
  ideal: number;
  idealLabel: string;
  offshoreRange: [number, number];  // degrees
  crossShoreRange: [number, number][];  // can have two ranges
  onshoreRange: [number, number];
}

export interface TidePreference {
  type: 'low' | 'low-mid' | 'mid' | 'mid-high' | 'high' | 'all';
  label: string;
  minTide: number;
  maxTide: number;
}

export interface Beach {
  id: number;
  name: string;
  state: string;
  region: string;
  wind: WindAngles;
  tide: TidePreference;
}

// Helper to convert degree to compass direction
export function degreeToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

// Tide presets
const tidePresets: Record<string, TidePreference> = {
  'low': { type: 'low', label: 'Low', minTide: 0, maxTide: 0.6 },
  'low-mid': { type: 'low-mid', label: 'Low to Mid', minTide: 0, maxTide: 1.2 },
  'mid': { type: 'mid', label: 'Mid', minTide: 0.5, maxTide: 1.5 },
  'mid-high': { type: 'mid-high', label: 'Mid to High', minTide: 0.8, maxTide: 2.2 },
  'high': { type: 'high', label: 'High', minTide: 1.2, maxTide: 2.5 },
  'all': { type: 'all', label: 'All Tides', minTide: 0, maxTide: 2.5 },
};

export const beaches: Beach[] = [
  // Queensland (QLD)
  {
    id: 18159,
    name: "Noosa Main Beach",
    state: "QLD",
    region: "Sunshine Coast",
    wind: {
      ideal: 180,
      idealLabel: "S",
      offshoreRange: [135, 225],
      crossShoreRange: [[90, 135], [225, 270]],
      onshoreRange: [270, 90],
    },
    tide: tidePresets['high'],
  },
  {
    id: 18156,
    name: "Maroochydore Beach",
    state: "QLD",
    region: "Sunshine Coast",
    wind: {
      ideal: 270,
      idealLabel: "W",
      offshoreRange: [225, 315],
      crossShoreRange: [[180, 225], [315, 360]],
      onshoreRange: [0, 180],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 5956,
    name: "Burleigh Heads",
    state: "QLD",
    region: "Gold Coast",
    wind: {
      ideal: 225,
      idealLabel: "SW",
      offshoreRange: [180, 270],
      crossShoreRange: [[135, 180], [270, 315]],
      onshoreRange: [315, 135],
    },
    tide: tidePresets['low-mid'],
  },
  {
    id: 5972,
    name: "Currumbin",
    state: "QLD",
    region: "Gold Coast",
    wind: {
      ideal: 200,
      idealLabel: "SSW",
      offshoreRange: [155, 245],
      crossShoreRange: [[110, 155], [245, 290]],
      onshoreRange: [290, 110],
    },
    tide: tidePresets['low-mid'],
  },
  {
    id: 18118,
    name: "Coolangatta Beach",
    state: "QLD",
    region: "Gold Coast",
    wind: {
      ideal: 180,
      idealLabel: "S",
      offshoreRange: [135, 225],
      crossShoreRange: [[90, 135], [225, 270]],
      onshoreRange: [270, 90],
    },
    tide: tidePresets['all'],
  },

  // New South Wales (NSW)
  {
    id: 19017,
    name: "Byron Bay Beach",
    state: "NSW",
    region: "Northern Rivers",
    wind: {
      ideal: 180,
      idealLabel: "S",
      offshoreRange: [135, 225],
      crossShoreRange: [[90, 135], [225, 270]],
      onshoreRange: [270, 90],
    },
    tide: tidePresets['mid-high'],
  },
  {
    id: 3736,
    name: "Coffs Harbour",
    state: "NSW",
    region: "Mid North Coast",
    wind: {
      ideal: 270,
      idealLabel: "W",
      offshoreRange: [225, 315],
      crossShoreRange: [[180, 225], [315, 360]],
      onshoreRange: [0, 180],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 17641,
    name: "Newcastle Beach",
    state: "NSW",
    region: "Hunter",
    wind: {
      ideal: 270,
      idealLabel: "W",
      offshoreRange: [225, 315],
      crossShoreRange: [[180, 225], [315, 360]],
      onshoreRange: [0, 180],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 17814,
    name: "Manly Beach",
    state: "NSW",
    region: "Sydney",
    wind: {
      ideal: 270,
      idealLabel: "W",
      offshoreRange: [225, 315],
      crossShoreRange: [[180, 225], [315, 360]],
      onshoreRange: [0, 180],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 4988,
    name: "Bondi Beach",
    state: "NSW",
    region: "Sydney",
    wind: {
      ideal: 270,
      idealLabel: "W",
      offshoreRange: [225, 315],
      crossShoreRange: [[180, 225], [315, 360]],
      onshoreRange: [0, 180],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 3168,
    name: "Cronulla",
    state: "NSW",
    region: "Sydney",
    wind: {
      ideal: 290,
      idealLabel: "WNW",
      offshoreRange: [245, 335],
      crossShoreRange: [[200, 245], [335, 20]],
      onshoreRange: [20, 200],
    },
    tide: tidePresets['mid-high'],
  },

  // Victoria (VIC)
  {
    id: 13364,
    name: "Torquay Surf Beach",
    state: "VIC",
    region: "Surf Coast",
    wind: {
      ideal: 360,
      idealLabel: "N",
      offshoreRange: [315, 45],
      crossShoreRange: [[270, 315], [45, 90]],
      onshoreRange: [90, 270],
    },
    tide: tidePresets['mid-high'],
  },
  {
    id: 11642,
    name: "Bells Beach",
    state: "VIC",
    region: "Surf Coast",
    wind: {
      ideal: 315,
      idealLabel: "NW",
      offshoreRange: [270, 360],
      crossShoreRange: [[225, 270], [0, 45]],
      onshoreRange: [45, 225],
    },
    tide: tidePresets['mid-high'],
  },
  {
    id: 19298,
    name: "13th Beach",
    state: "VIC",
    region: "Surf Coast",
    wind: {
      ideal: 360,
      idealLabel: "N",
      offshoreRange: [315, 45],
      crossShoreRange: [[270, 315], [45, 90]],
      onshoreRange: [90, 270],
    },
    tide: tidePresets['mid'],
  },
  {
    id: 13591,
    name: "Cape Woolamai",
    state: "VIC",
    region: "Phillip Island",
    wind: {
      ideal: 20,
      idealLabel: "NNE",
      offshoreRange: [335, 65],
      crossShoreRange: [[290, 335], [65, 110]],
      onshoreRange: [110, 290],
    },
    tide: tidePresets['low-mid'],
  },
  {
    id: 13866,
    name: "Portsea Back Beach",
    state: "VIC",
    region: "Mornington Peninsula",
    wind: {
      ideal: 20,
      idealLabel: "NNE",
      offshoreRange: [335, 65],
      crossShoreRange: [[290, 335], [65, 110]],
      onshoreRange: [110, 290],
    },
    tide: tidePresets['mid'],
  },

  // Western Australia (WA)
  {
    id: 19555,
    name: "Scarborough Beach",
    state: "WA",
    region: "Perth",
    wind: {
      ideal: 90,
      idealLabel: "E",
      offshoreRange: [45, 135],
      crossShoreRange: [[0, 45], [135, 180]],
      onshoreRange: [180, 0],
    },
    tide: tidePresets['all'],
  },
  {
    id: 18919,
    name: "Trigg Beach",
    state: "WA",
    region: "Perth",
    wind: {
      ideal: 90,
      idealLabel: "E",
      offshoreRange: [45, 135],
      crossShoreRange: [[0, 45], [135, 180]],
      onshoreRange: [180, 0],
    },
    tide: tidePresets['all'],
  },
  {
    id: 15258,
    name: "Margaret River",
    state: "WA",
    region: "Margaret River",
    wind: {
      ideal: 110,
      idealLabel: "ESE",
      offshoreRange: [65, 155],
      crossShoreRange: [[20, 65], [155, 200]],
      onshoreRange: [200, 20],
    },
    tide: tidePresets['all'],
  },

  // South Australia (SA)
  {
    id: 19399,
    name: "South Port",
    state: "SA",
    region: "Fleurieu Peninsula",
    wind: {
      ideal: 70,
      idealLabel: "ENE",
      offshoreRange: [25, 115],
      crossShoreRange: [[340, 25], [115, 160]],
      onshoreRange: [160, 340],
    },
    tide: tidePresets['mid-high'],
  },
  {
    id: 10135,
    name: "Middleton",
    state: "SA",
    region: "Fleurieu Peninsula",
    wind: {
      ideal: 360,
      idealLabel: "N",
      offshoreRange: [315, 45],
      crossShoreRange: [[270, 315], [45, 90]],
      onshoreRange: [90, 270],
    },
    tide: tidePresets['mid-high'],
  },
];

export const beachesByState = beaches.reduce((acc, beach) => {
  if (!acc[beach.state]) {
    acc[beach.state] = [];
  }
  acc[beach.state].push(beach);
  return acc;
}, {} as Record<string, Beach[]>);

export const stateOrder = ["QLD", "NSW", "VIC", "WA", "SA"];

export const stateNames: Record<string, string> = {
  "QLD": "Queensland",
  "NSW": "New South Wales",
  "VIC": "Victoria",
  "WA": "Western Australia",
  "SA": "South Australia",
};

// Default wind speed limits by type
export const defaultWindSpeeds = {
  offshore: 25,      // Up to 25 km/h for offshore/cross-offshore
  crossShore: 10,    // Up to 10 km/h for cross-shore
  onshore: 5,        // Up to 5 km/h for onshore
};

// Format wind range for display
export function formatWindRange(start: number, end: number): string {
  const startCompass = degreeToCompass(start);
  const endCompass = degreeToCompass(end);
  return `${startCompass}-${endCompass} (${start}°-${end}°)`;
}
