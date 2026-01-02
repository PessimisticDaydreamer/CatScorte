
export enum FoodTier {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

export interface Nutrients {
  protein?: number;
  fat?: number;
  moisture?: number;
  fiber?: number;
  ash?: number;
  calcium?: number;
  phosphorus?: number;
  magnesium?: number;
  sodium?: number;
  potassium?: number;
  omega3?: number;
  omega6?: number;
  taurine?: number; // can be percentage or mg/kg
}

export interface IngredientAnalysis {
  firstIngredientAnimal: boolean;
  meatInTopThree: boolean;
  hasVegetableProtein: boolean;
  hasGluten: boolean;
  fractionatedCereals: boolean;
  hasGenericByproducts: boolean;
  hasVariableFormulation: boolean; // "y/o"
  hasTaurineAdded: boolean;
  hasChelatedMinerals: boolean;
  hasOmegaSources: boolean;
  hasExcessiveSalt: boolean;
  hasEssentialVitamins: boolean; // Vit A, D, E, B complex
  hasSaltInIngredients: boolean; // Si aparece "sal" o "cloruro de sodio"
}

export interface GranularScores {
  animalProtein: number;
  fillersAndCereals: number;
  transparency: number;
  additives: number;
}

export interface EvaluationResult {
  id: string;
  name: string;
  timestamp: number;
  rawNutrients: Nutrients;
  dryMatterNutrients: Nutrients;
  ingredients: IngredientAnalysis;
  score: number;
  granularScores: GranularScores;
  tier: FoodTier;
  summary: string;
  observations: string[];
  warnings: string[];
  assumptions: string[];
}
