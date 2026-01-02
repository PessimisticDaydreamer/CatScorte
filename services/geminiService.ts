
import { GoogleGenAI, Type } from "@google/genai";
import { Nutrients, IngredientAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseFoodLabel(name: string, guaranteedAnalysis: string, ingredientsText: string) {
  const prompt = `
    Eres un experto en nutrición felina de clase mundial. Extrae la información nutricional de este texto (puede tener errores de OCR).
    
    PRODUCTO: ${name}
    ANÁLISIS: ${guaranteedAnalysis}
    INGREDIENTES: ${ingredientsText}

    REGLAS DE ORO PARA VALORES NUMÉRICOS:
    1. TAURINA: Suele estar entre 0.05% y 0.25%. Si ves un valor como 1500, asume mg/kg y conviértelo a % (1500 / 10000 = 0.15%). NUNCA devuelvas valores > 2.0% para taurina.
    2. CALCIO/FÓSFORO/SODIO: Si los valores están en g/kg o mg/kg, conviértelos a PORCENTAJE (%). 10g/kg = 1.0%.
    3. SODIO: Busca específicamente "Sodio" o "Sal". Si dice "Sal 0.5%", el sodio es aprox 0.2%.
    4. OMEGAS: Busca Omega 3 y Omega 6.
    5. Si un valor es obviamente erróneo (ej. Proteína 800%), corrígelo según el promedio de la industria o déjalo nulo.

    ANÁLISIS DE INGREDIENTES:
    - Identifica: Vitaminas (A, D, E, complejo B), Minerales Quelados, Taurina, Sal añadida, Fuentes de Omega.
    - hasEssentialVitamins: true solo si incluye A, D, E y complejo B explícitamente.
    - hasSaltInIngredients: true si aparece "sal", "cloruro de sodio" o similar en la lista.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              moisture: { type: Type.NUMBER },
              fiber: { type: Type.NUMBER },
              ash: { type: Type.NUMBER },
              calcium: { type: Type.NUMBER },
              phosphorus: { type: Type.NUMBER },
              sodium: { type: Type.NUMBER },
              omega3: { type: Type.NUMBER },
              omega6: { type: Type.NUMBER },
              taurine: { type: Type.NUMBER }
            }
          },
          ingredients: {
            type: Type.OBJECT,
            properties: {
              firstIngredientAnimal: { type: Type.BOOLEAN },
              meatInTopThree: { type: Type.BOOLEAN },
              hasVegetableProtein: { type: Type.BOOLEAN },
              hasGluten: { type: Type.BOOLEAN },
              fractionatedCereals: { type: Type.BOOLEAN },
              hasGenericByproducts: { type: Type.BOOLEAN },
              hasVariableFormulation: { type: Type.BOOLEAN },
              hasTaurineAdded: { type: Type.BOOLEAN },
              hasChelatedMinerals: { type: Type.BOOLEAN },
              hasOmegaSources: { type: Type.BOOLEAN },
              hasExcessiveSalt: { type: Type.BOOLEAN },
              hasEssentialVitamins: { type: Type.BOOLEAN },
              hasSaltInIngredients: { type: Type.BOOLEAN }
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["nutrients", "ingredients", "summary"]
      }
    }
  });

  return JSON.parse(response.text);
}
