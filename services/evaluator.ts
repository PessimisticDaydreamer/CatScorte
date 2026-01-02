
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

  const disclaimer = "Para conocer el valor real exacto de los nutrientes no declarados, se recomienda contactar directamente al fabricante.";

  // Normalización a Materia Seca
  Object.entries(rawNutrients).forEach(([key, value]) => {
    if (typeof value === 'number') {
      let val = value;
      if (key === 'taurine' && val > 2.0) val = val / 10000;
      if (key !== 'moisture') (dmNutrients as any)[key] = val * dmFactor;
    }
  });

  // Estimaciones si faltan datos
  if (!dmNutrients.taurine && ingredients.hasTaurineAdded) {
    dmNutrients.taurine = NUTRITIONAL_TARGETS.TAURINE.min; 
    assumptions.push(`Taurina: Estimada al mínimo (${NUTRITIONAL_TARGETS.TAURINE.min}% MS) por mención en ingredientes.`);
  }
  if (!dmNutrients.calcium && ingredients.hasChelatedMinerals) {
    dmNutrients.calcium = NUTRITIONAL_TARGETS.MINERALS.CALCIUM.min;
    assumptions.push(`Calcio: Estimado al mínimo (${NUTRITIONAL_TARGETS.MINERALS.CALCIUM.min}% MS) por suplementación.`);
  }
  if (!dmNutrients.phosphorus && dmNutrients.calcium) {
    dmNutrients.phosphorus = dmNutrients.calcium / NUTRITIONAL_TARGETS.RATIOS.CA_P_IDEAL;
    assumptions.push(`Fósforo: Estimado para balancear el calcio (${dmNutrients.phosphorus.toFixed(2)}% MS).`);
  }

  // --- PUNTAJE (0-100) ---
  let proteinScore = 0;      // Max 20
  let fatScore = 0;          // Max 10
  let taurineScore = 0;      // Max 10
  let mineralScore = 0;      // Max 15 (Ca:P + Quelatos)
  let ingredientScore = 0;   // Max 30 (Top3, No Vegetal, No Sal)
  let transparencyScore = 0; // Max 15 (Subproductos, Vitaminas)

  // 1. Proteína (Max 20) - Ideal 38%
  const protein = dmNutrients.protein || 0;
  if (protein >= NUTRITIONAL_TARGETS.PROTEIN.ideal && protein <= NUTRITIONAL_TARGETS.PROTEIN.max) {
    proteinScore = 20;
    observations.push("Proteína en nivel ideal (38% MS o más).");
  } else if (protein >= NUTRITIONAL_TARGETS.PROTEIN.min) {
    // Proximidad lineal
    const pRange = NUTRITIONAL_TARGETS.PROTEIN.ideal - NUTRITIONAL_TARGETS.PROTEIN.min;
    const pCurrent = protein - NUTRITIONAL_TARGETS.PROTEIN.min;
    proteinScore = 5 + (pCurrent / pRange) * 15;
  } else {
    proteinScore = (protein / NUTRITIONAL_TARGETS.PROTEIN.min) * 5;
    warnings.push("Deficiencia crítica de proteína.");
  }

  // 2. Grasa (Max 10) - Ideal 9%, "más o menos no bueno"
  const fat = dmNutrients.fat || 0;
  const fatDiff = Math.abs(fat - NUTRITIONAL_TARGETS.FAT.ideal);
  if (fatDiff === 0) {
    fatScore = 10;
    observations.push("Grasa en el nivel ideal absoluto (9% MS).");
  } else if (fatDiff < 10) {
    fatScore = Math.max(0, 10 - fatDiff); // Pierde 1 punto por cada 1% de desviación
  } else {
    warnings.push("Nivel de grasa muy alejado del ideal (9% MS).");
  }

  // 3. Taurina (Max 10) - Ideal 0.2%
  const taurine = dmNutrients.taurine || 0;
  if (taurine >= NUTRITIONAL_TARGETS.TAURINE.ideal) {
    taurineScore = 10;
    observations.push("Excelente aporte de Taurina.");
  } else if (taurine >= NUTRITIONAL_TARGETS.TAURINE.min) {
    const tRange = NUTRITIONAL_TARGETS.TAURINE.ideal - NUTRITIONAL_TARGETS.TAURINE.min;
    const tCurrent = taurine - NUTRITIONAL_TARGETS.TAURINE.min;
    taurineScore = 5 + (tCurrent / tRange) * 5;
  } else {
    taurineScore = 0;
    warnings.push("Nivel de Taurina insuficiente.");
  }

  // 4. Minerales y Ratio Ca:P (Max 15)
  if (dmNutrients.calcium && dmNutrients.phosphorus) {
    const ratio = dmNutrients.calcium / dmNutrients.phosphorus;
    if (ratio >= 1.0 && ratio <= 1.8) {
      const rDiff = Math.abs(ratio - 1.2);
      mineralScore += 10 * (1 - rDiff / 0.6); // Escala según cercanía a 1.2
      if (rDiff < 0.1) observations.push("Ratio Calcio:Fósforo óptimo.");
    } else {
      mineralScore -= 5;
      warnings.push(`Ratio Ca:P fuera de rango (${ratio.toFixed(2)}:1).`);
    }
  }
  if (ingredients.hasChelatedMinerals) {
    mineralScore += 5;
    observations.push("Incluye minerales quelados de alta absorción.");
  }

  // 5. Omega 3:6 Ratio (Max 5)
  if (dmNutrients.omega3 && dmNutrients.omega6) {
    if (dmNutrients.omega3 >= dmNutrients.omega6) {
      ingredientScore += 5;
      observations.push("Excelente balance Omega 3:6 (Omega 3 >= Omega 6).");
    } else {
      warnings.push("Exceso de Omega 6 frente a Omega 3.");
    }
  } else if (ingredients.hasOmegaSources) {
    ingredientScore += 2; // Puntos parciales por tener fuentes pero no declarar valores
  }

  // 6. Ingredientes (Max 25 restantes de ingredientScore + transparencyScore)
  // Top 3 Animales (Max 10)
  if (ingredients.meatInTopThree) {
    ingredientScore += 10;
    observations.push("Los primeros 3 ingredientes son de origen animal.");
  } else if (ingredients.firstIngredientAnimal) {
    ingredientScore += 5;
    observations.push("El primer ingrediente es de origen animal.");
  }

  // Sin Sal añadida (Max 5)
  if (!ingredients.hasSaltInIngredients) {
    ingredientScore += 5;
    observations.push("Sin sal ni cloruro de sodio añadido en ingredientes.");
  } else {
    warnings.push("Contiene sal añadida en la lista de ingredientes.");
  }

  // Pureza (No vegetales/rellenos) (Max 10)
  let purityBonus = 10;
  if (ingredients.hasVegetableProtein) purityBonus -= 4;
  if (ingredients.hasGluten) purityBonus -= 4;
  if (ingredients.fractionatedCereals) purityBonus -= 2;
  ingredientScore += Math.max(0, purityBonus);

  // 7. Transparencia y Vitaminas (Max 15)
  let transBonus = 15;
  if (ingredients.hasGenericByproducts) {
    transBonus -= 10;
    warnings.push("Uso de subproductos genéricos: falta de honestidad en etiqueta.");
  }
  if (ingredients.hasVariableFormulation) transBonus -= 5;
  
  if (ingredients.hasEssentialVitamins) {
    transBonus += 5; // Bonus por completar el pack vitamínico
    observations.push("Pack completo de vitaminas esenciales (A, D, E, B).");
  }
  transparencyScore = Math.max(0, transBonus);

  // Consolidación final
  const granularScores: GranularScores = {
    animalProtein: Math.max(0, Math.min(25, proteinScore + (ingredientScore * 0.2))),
    fillersAndCereals: Math.max(0, Math.min(25, transparencyScore + (ingredientScore * 0.2))),
    transparency: Math.max(0, Math.min(25, transparencyScore)),
    additives: Math.max(0, Math.min(25, taurineScore + mineralScore + fatScore))
  };

  let totalScore = proteinScore + fatScore + taurineScore + mineralScore + ingredientScore + transparencyScore;
  totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  let tier = FoodTier.D;
  if (totalScore >= 90) tier = FoodTier.S;
  else if (totalScore >= 75) tier = FoodTier.A;
  else if (totalScore >= 60) tier = FoodTier.B;
  else if (totalScore >= 40) tier = FoodTier.C;

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    timestamp: Date.now(),
    rawNutrients,
    dryMatterNutrients: dmNutrients,
    ingredients,
    score: totalScore,
    granularScores,
    tier,
    summary: aiSummary,
    observations,
    warnings,
    assumptions
  };
}
