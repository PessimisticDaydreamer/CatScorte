
import React from 'react';

/**
 * Niveles recomendados para alimento completo de gatos (Base Materia Seca)
 * Basado estrictamente en FEDIAF - Adultos proporcionado por el usuario.
 */
export const NUTRITIONAL_TARGETS = {
  PROTEIN: { 
    min: 25.0,    // FEDIAF g/100g MS
    ideal: 38.0   // Ideal solicitado
  },
  FAT: { 
    min: 9.0,     // FEDIAF g/100g MS
    ideal: 9.0,
    max: 20.0     // Límite para no sumar puntos
  },
  TAURINE: { 
    min_dry: 0.10, // FEDIAF g/100g MS
    min_wet: 0.20,
    ideal: 0.20    // Solicitado: "ideal de taurina en ≥ 0.20 g para todos"
  },
  MINERALS: {
    CALCIUM: { 
      min: 0.40,      
      max: 1.00 
    },
    PHOSPHORUS: { 
      min: 0.26,      
      max: 0.84 
    },
    MAGNESIUM: {
      max: 0.05
    },
    SODIUM: { 
      max: 0.16   
    }
  },
  RATIOS: {
    CA_P_IDEAL: 1.0, // FEDIAF 1:1
    CA_P_MIN: 1.0,
    CA_P_MAX: 1.8
  },
  VITAMINS: {
    A: 333, // IU
    D: 25,  // IU
    E: 3.8  // IU
  }
};

export const TIER_COLORS = {
  S: 'bg-yellow-400 text-yellow-900 border-yellow-500',
  A: 'bg-emerald-400 text-emerald-900 border-emerald-500',
  B: 'bg-blue-400 text-blue-900 border-blue-500',
  C: 'bg-orange-400 text-orange-900 border-orange-500',
  D: 'bg-rose-400 text-rose-900 border-rose-500'
};

export const DEFAULT_MOISTURE = 10;
