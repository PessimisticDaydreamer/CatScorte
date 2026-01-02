
import React from 'react';

/**
 * Recommended levels for complete cat food (Dry Matter Basis)
 * Based on FEDIAF Table III-4a (Adult Maintenance 100 kcal/kg 0.67)
 * with user-specified high-quality ideals.
 */
export const NUTRITIONAL_TARGETS = {
  PROTEIN: { 
    min: 25.0,    // FEDIAF Minimum
    ideal: 38.0,  // User specified ideal
    max: 55.0 
  },
  FAT: { 
    min: 9.0,     // FEDIAF Minimum
    ideal: 9.0,   // User specified ideal: "menos o mas no bueno"
    safe_max: 20.0 
  },
  TAURINE: { 
    min: 0.10,    // FEDIAF Minimum
    ideal: 0.20   // User specified ideal
  },
  MINERALS: {
    CALCIUM: { 
      min: 0.40,      
      recommended_max: 1.0, 
      ideal: 0.6 
    },
    PHOSPHORUS: { 
      min: 0.26,      
      recommended_max: 0.84, 
      ideal: 0.5 
    },
    SODIUM: { 
      min: 0.08,             
      recommended_max: 0.2,   
      clinical_risk: 0.6      
    }
  },
  RATIOS: {
    CA_P_MIN: 1.0,
    CA_P_MAX: 1.8,    // User specified range max
    CA_P_IDEAL: 1.2   // User specified ideal
  }
};

export const TIER_COLORS = {
  S: 'bg-yellow-400 text-yellow-900 border-yellow-500',
  A: 'bg-emerald-400 text-emerald-900 border-emerald-500',
  B: 'bg-blue-400 text-blue-900 border-blue-500',
  C: 'bg-orange-400 text-orange-900 border-orange-500',
  D: 'bg-rose-400 text-rose-900 border-rose-500'
};

export const DEFAULT_MOISTURE = 10; // For dry food if not specified
