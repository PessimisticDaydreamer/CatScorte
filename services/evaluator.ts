
import { Nutrients, IngredientAnalysis, EvaluationResult, FoodTier, GranularScores } from "../types";
import { NUTRITIONAL_TARGETS, DEFAULT_MOISTURE } from "../constants";

export function evaluateFood(
  name: string,
  rawNutrients: Nutrients,
  ingredients: IngredientAnalysis,
  aiSummary: string
): EvaluationResult {
  const moisture = rawNutrients.moisture ?? DEFAULT_MOISTURE;
  const dmFactor = 100 / (100 - moisture);

  const dmNutrients: Nutrients = {};
  const assumptions: string[] = [];
  const warnings: string[] = [];
  const observations: string[] = [];

  // 1. Normalización y manejo de omisiones
  const keys: (keyof Nutrients)[] = ['protein', 'fat', 'taurine', 'calcium', 'phosphorus', 'sodium', 'magnesium'];
  
  keys.forEach(key => {
    let val = rawNutrients[key];
    if (val === undefined || val === null) return;

    if (val >= 50 && val < 1000) val = val / 10;
    else if (val >= 1000) val = val / 10000;

    (dmNutrients as any)[key] = val * dmFactor;
  });

  // --- LOGICA DE PUNTUACION PURAMENTE ADITIVA (Decimales para exactitud) ---
  let proteinPoints = 0;   // Max 30
  let essentialPoints = 0; // Max 40
  let qualityPoints = 0;   // Max 30

  // A. PROTEINA (30 pts)
  if (dmNutrients.protein) {
    // 5 pts por cumplir mínimo FEDIAF
    if (dmNutrients.protein >= NUTRITIONAL_TARGETS.PROTEIN.min) {
      proteinPoints += 5;
    }
    // Hasta 10 pts extra por acercarse al ideal del 38%
    if (dmNutrients.protein > NUTRITIONAL_TARGETS.PROTEIN.min) {
      const pRange = NUTRITIONAL_TARGETS.PROTEIN.ideal - NUTRITIONAL_TARGETS.PROTEIN.min;
      const progress = Math.min(1, (dmNutrients.protein - NUTRITIONAL_TARGETS.PROTEIN.min) / pRange);
      proteinPoints += progress * 10;
    }
    
    // Puntos por calidad de fuente animal
    if (ingredients.firstIngredientAnimal) proteinPoints += 7.5;
    if (ingredients.meatInTopThree) proteinPoints += 7.5;
    
    if (ingredients.firstIngredientAnimal) observations.push("Proteína de base animal.");
    else warnings.push("Base proteica principal vegetal (relleno).");
  }

  // B. NUTRIENTES ESENCIALES (40 pts)
  // Grasa (10 pts)
  if (dmNutrients.fat) {
    if (dmNutrients.fat >= NUTRITIONAL_TARGETS.FAT.min && dmNutrients.fat <= NUTRITIONAL_TARGETS.FAT.max) {
      // 10 puntos si está en el rango recomendado
      essentialPoints += 10;
    }
  }

  // Taurina (10 pts)
  const tTarget = NUTRITIONAL_TARGETS.TAURINE.ideal;
  if (dmNutrients.taurine) {
    if (dmNutrients.taurine >= tTarget) {
      essentialPoints += 10;
    } else {
      warnings.push(`Taurina insuficiente para el ideal (${dmNutrients.taurine.toFixed(2)}% vs 0.20%).`);
    }
  } else if (ingredients.hasTaurineAdded) {
    const fediafMin = moisture > 50 ? NUTRITIONAL_TARGETS.TAURINE.min_wet : NUTRITIONAL_TARGETS.TAURINE.min_dry;
    // Si se asume el mínimo (0.1%), no suma los 10 puntos del ideal (0.2%)
    assumptions.push(`Taurina: valor no declarado pero presente en ingredientes por lo que se asume el mínimo legal (${fediafMin}% según la FEDIAF). Para saber el valor real, consulte al fabricante.`);
    if (fediafMin >= tTarget) essentialPoints += 10;
  }

  // Vitaminas (10 pts)
  if (ingredients.hasEssentialVitamins) {
    essentialPoints += 10;
  }

  // Minerales (10 pts total, 2.5 c/u)
  if (dmNutrients.calcium && dmNutrients.calcium >= NUTRITIONAL_TARGETS.MINERALS.CALCIUM.min && dmNutrients.calcium <= NUTRITIONAL_TARGETS.MINERALS.CALCIUM.max) essentialPoints += 2.5;
  if (dmNutrients.phosphorus && dmNutrients.phosphorus >= NUTRITIONAL_TARGETS.MINERALS.PHOSPHORUS.min && dmNutrients.phosphorus <= NUTRITIONAL_TARGETS.MINERALS.PHOSPHORUS.max) essentialPoints += 2.5;
  if (dmNutrients.sodium !== undefined && dmNutrients.sodium <= NUTRITIONAL_TARGETS.MINERALS.SODIUM.max) essentialPoints += 2.5;
  if (dmNutrients.magnesium !== undefined && dmNutrients.magnesium <= NUTRITIONAL_TARGETS.MINERALS.MAGNESIUM.max) essentialPoints += 2.5;

  // C. CALIDAD Y TRANSPARENCIA (30 pts)
  // Ratio Ca:P (10 pts)
  if (dmNutrients.calcium && dmNutrients.phosphorus) {
    const ratio = dmNutrients.calcium / dmNutrients.phosphorus;
    if (ratio >= 1.0 && ratio <= 1.5) qualityPoints += 10;
    else if (ratio > 1.5 && ratio <= 1.8) qualityPoints += 5;
  }

  // Transparencia (10 pts) - Antes "Honestidad"
  if (!ingredients.hasVariableFormulation) {
    qualityPoints += 10;
  } else {
    warnings.push("Uso de 'y/o' en ingredientes: Transparencia nula.");
  }

  // Pureza (10 pts)
  if (!ingredients.hasGenericByproducts && !ingredients.hasVegetableProtein) {
    qualityPoints += 10;
  }

  // CÁLCULO FINAL
  const totalRaw = proteinPoints + essentialPoints + qualityPoints;
  const score = Math.max(0, Math.min(100, parseFloat(totalRaw.toFixed(2))));

  // Granular Scores para el UI
  const granularScores: GranularScores = {
    animalProtein: parseFloat(((proteinPoints / 30) * 25).toFixed(2)),
    fillersAndCereals: parseFloat(((qualityPoints / 30) * 25).toFixed(2)),
    transparency: ingredients.hasVariableFormulation ? 0 : 25,
    additives: parseFloat(((essentialPoints / 40) * 25).toFixed(2))
  };

  // Ajuste de Tiers para diferenciar mejor las gamas
  let tier = FoodTier.D;
  if (score >= 88) tier = FoodTier.S;
  else if (score >= 72) tier = FoodTier.A;
  else if (score >= 58) tier = FoodTier.B;
  else if (score >= 42) tier = FoodTier.C; // Cat Chow debería caer aquí
  else tier = FoodTier.D; // Don Kat debería caer aquí

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    timestamp: Date.now(),
    rawNutrients,
    dryMatterNutrients: dmNutrients,
    ingredients,
    score,
    granularScores,
    tier,
    summary: aiSummary,
    observations,
    warnings,
    assumptions
  };
}
