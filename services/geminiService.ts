
import { GoogleGenAI, Type } from "@google/genai";
import { Nutrients, IngredientAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseFoodLabel(name: string, guaranteedAnalysis: string, ingredientsText: string) {
  const prompt = `
    ROL: Transcriptor Técnico Neutral.
    MISION: Extraer datos de la etiqueta de alimento para gatos sin evaluar.
    REGLA DE ORO: No uses palabras como "bueno", "malo", "estándar", "pobre", "bajo" o "alto". No emitas juicios.

    --- INSTRUCCIONES ---
    1. ANALISIS GARANTIZADO: Extrae los porcentajes tal cual aparecen. Si dice "TAMRINA", asume que es Taurina.
    2. INGREDIENTES: Identifica si el ingrediente #1 es animal, si los 3 primeros lo son, si hay proteínas vegetales (soya, gluten, maíz) y si hay cláusulas "y/o".
    3. SUMMARY (Lectura de Etiqueta): Escribe una descripción técnica objetiva de 2 líneas imitando una lectura humana profesional.
       Ejemplo: "Primer ingrediente: [Nombre]. Contiene [X]% proteína. Lista con formulación variable (y/o) y presencia de [ingredientes]."

    DATOS:
    PRODUCTO: ${name}
    ANALISIS: ${guaranteedAnalysis}
    INGREDIENTES: ${ingredientsText}

    JSON:
    {
      "nutrients": { "protein": float, "fat": float, "moisture": float, "fiber": float, "ash": float, "calcium": float, "phosphorus": float, "sodium": float, "taurine": float, "magnesium": float },
      "ingredients": { "firstIngredientAnimal": bool, "meatInTopThree": bool, "hasVegetableProtein": bool, "hasGluten": bool, "fractionatedCereals": bool, "hasGenericByproducts": bool, "hasVariableFormulation": bool, "hasTaurineAdded": bool, "hasChelatedMinerals": bool, "hasOmegaSources": bool, "hasEssentialVitamins": bool, "hasSaltInIngredients": bool },
      "summary": "Texto de lectura técnica"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nutrients: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER, nullable: true },
              fat: { type: Type.NUMBER, nullable: true },
              moisture: { type: Type.NUMBER, nullable: true },
              fiber: { type: Type.NUMBER, nullable: true },
              ash: { type: Type.NUMBER, nullable: true },
              calcium: { type: Type.NUMBER, nullable: true },
              phosphorus: { type: Type.NUMBER, nullable: true },
              sodium: { type: Type.NUMBER, nullable: true },
              taurine: { type: Type.NUMBER, nullable: true },
              magnesium: { type: Type.NUMBER, nullable: true }
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
