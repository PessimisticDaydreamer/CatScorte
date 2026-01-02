
import React, { useState, useMemo } from 'react';
import { parseFoodLabel } from './services/geminiService';
import { evaluateFood } from './services/evaluator';
import { EvaluationResult, FoodTier } from './types';
import { TIER_COLORS, NUTRITIONAL_TARGETS } from './constants';

const App: React.FC = () => {
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !analysis || !ingredients) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);
    setShowDetails(false);

    try {
      const parsedData = await parseFoodLabel(name, analysis, ingredients);
      const result = evaluateFood(
        name,
        parsedData.nutrients,
        parsedData.ingredients,
        parsedData.summary
      );
      setResults(prev => [result, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Error al procesar la etiqueta. Intenta pegar el texto más limpio.");
    } finally {
      setLoading(false);
    }
  };

  const currentResult = results[0];

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectedResults = useMemo(() => {
    return results.filter(r => selectedIds.has(r.id));
  }, [results, selectedIds]);

  const handleStartComparison = () => {
    if (selectedIds.size < 2) {
      alert("Selecciona al menos 2 alimentos para comparar.");
      return;
    }
    setIsComparing(true);
    setShowHistory(false);
  };

  const getNutrientStatusColor = (key: string, value: number | undefined) => {
    if (value === undefined || value === null) return 'bg-slate-200';
    
    switch (key) {
      case 'protein':
        if (value < NUTRITIONAL_TARGETS.PROTEIN.min) return 'bg-rose-500';
        if (value < NUTRITIONAL_TARGETS.PROTEIN.ideal) return 'bg-amber-400';
        return 'bg-emerald-500';
      case 'fat':
        if (value < NUTRITIONAL_TARGETS.FAT.min) return 'bg-rose-500';
        return 'bg-emerald-500';
      case 'taurine':
        if (value < NUTRITIONAL_TARGETS.TAURINE.min) return 'bg-rose-500';
        if (value < NUTRITIONAL_TARGETS.TAURINE.ideal) return 'bg-amber-400';
        return 'bg-emerald-500';
      case 'calcium':
        if (value < NUTRITIONAL_TARGETS.MINERALS.CALCIUM.min || value > 1.5) return 'bg-rose-500';
        if (value > NUTRITIONAL_TARGETS.MINERALS.CALCIUM.recommended_max) return 'bg-amber-400';
        return 'bg-emerald-500';
      case 'phosphorus':
        if (value < NUTRITIONAL_TARGETS.MINERALS.PHOSPHORUS.min || value > 1.2) return 'bg-rose-500';
        if (value > NUTRITIONAL_TARGETS.MINERALS.PHOSPHORUS.recommended_max) return 'bg-amber-400';
        return 'bg-emerald-500';
      case 'sodium':
        if (value > NUTRITIONAL_TARGETS.MINERALS.SODIUM.clinical_risk) return 'bg-rose-500';
        if (value > NUTRITIONAL_TARGETS.MINERALS.SODIUM.recommended_max) return 'bg-amber-400';
        return 'bg-emerald-500';
      default:
        return 'bg-indigo-500';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setShowHistory(false); setIsComparing(false);}}>
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl">CS</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">CatScore</h1>
          </div>
          <div className="flex items-center gap-4">
            {results.length > 0 && (
              <button 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setIsComparing(false);
                }}
                className={`text-sm font-medium transition-colors ${showHistory ? 'text-indigo-600 underline' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                {showHistory ? 'Cerrar Historial' : 'Ver Historial'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {!showHistory && !isComparing && (
          <div className="grid md:grid-cols-1 gap-8">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Analizar Alimento
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Catchow Carne" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Composición Garantizada</label>
                    <textarea value={analysis} onChange={(e) => setAnalysis(e.target.value)} rows={4} placeholder="Proteína 32%, Grasa 10%, Calcio 1.1%..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lista de Ingredientes</label>
                    <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} placeholder="Harina de vísceras, maíz, sal, taurina..." className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-40 resize-none text-sm" />
                  </div>
                </div>
                {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-sm">{error}</div>}
                <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{loading ? 'Calculando Nutrientes...' : 'Evaluar Calidad'}</button>
              </form>
            </section>

            {currentResult && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentResult.name}</h2>
                      <p className="text-slate-500 mt-1">Calificación técnica integral</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-4xl font-black text-indigo-600">{currentResult.score}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Puntos / 100</div>
                      </div>
                      <div className={`w-20 h-20 rounded-3xl border-2 flex items-center justify-center text-4xl font-black shadow-lg ${TIER_COLORS[currentResult.tier]}`}>{currentResult.tier}</div>
                    </div>
                  </div>

                  <div className="p-8 space-y-10">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Veredicto Nutricional</h3>
                      <p className="text-lg text-slate-700 leading-relaxed italic border-l-4 border-indigo-400 pl-6 py-2">"{currentResult.summary}"</p>
                      <button onClick={() => setShowDetails(!showDetails)} className="mt-4 text-indigo-600 text-sm font-bold hover:underline">
                        {showDetails ? '↑ Ocultar Detalles de Calidad' : '↓ Ver Desglose por Áreas'}
                      </button>
                    </div>

                    {showDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300">
                         {[
                           { key: 'animalProtein', label: 'Valor Biológico', color: 'bg-indigo-500', desc: 'Calidad de la proteína animal' },
                           { key: 'fillersAndCereals', label: 'Pureza de Receta', color: 'bg-emerald-500', desc: 'Control de granos y gluten' },
                           { key: 'transparency', label: 'Integridad Etiqueta', color: 'bg-amber-500', desc: 'Precisión en los ingredientes' },
                           { key: 'additives', label: 'Balance Vital', color: 'bg-rose-500', desc: 'Minerales, Taurina y Sodio' }
                         ].map(cat => (
                           <div key={cat.key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{cat.label}</p>
                             <div className="text-xl font-black text-slate-800 my-1">{(currentResult.granularScores as any)[cat.key].toFixed(2)} <span className="text-sm font-normal text-slate-400">/ 25</span></div>
                             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                               <div className={`${cat.color} h-full`} style={{ width: `${((currentResult.granularScores as any)[cat.key]/25)*100}%` }}></div>
                             </div>
                             <p className="text-[10px] text-slate-400 leading-tight">{cat.desc}</p>
                           </div>
                         ))}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gráfico de Nutrientes Clave (Materia Seca)</h3>
                        <div className="flex gap-4 text-[10px] font-bold">
                           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Crítico</div>
                           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Alerta</div>
                           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ideal</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { key: 'protein', label: 'Proteína', unit: '%', val: currentResult.dryMatterNutrients.protein, max: 60 },
                          { key: 'fat', label: 'Grasa', unit: '%', val: currentResult.dryMatterNutrients.fat, max: 30 },
                          { key: 'taurine', label: 'Taurina', unit: '%', val: currentResult.dryMatterNutrients.taurine, max: 0.5 },
                          { key: 'calcium', label: 'Calcio', unit: '%', val: currentResult.dryMatterNutrients.calcium, max: 2.5 },
                          { key: 'phosphorus', label: 'Fósforo', unit: '%', val: currentResult.dryMatterNutrients.phosphorus, max: 2.0 },
                          { key: 'sodium', label: 'Sodio', unit: '%', val: currentResult.dryMatterNutrients.sodium, max: 1.0 },
                          { key: 'ash', label: 'Cenizas', unit: '%', val: currentResult.dryMatterNutrients.ash, max: 15 },
                          { key: 'moisture', label: 'Humedad (Declarada)', unit: '%', val: currentResult.rawNutrients.moisture, max: 15, isRaw: true }
                        ].map((nut) => (
                          <div key={nut.key} className="group relative">
                            <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-600">
                              <span>{nut.label} {nut.isRaw ? '' : '(MS)'}</span>
                              <span className="text-slate-900">{nut.val ? nut.val.toFixed(2) : '--'}{nut.unit}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full transition-all duration-1000 ${getNutrientStatusColor(nut.key, nut.val)}`}
                                style={{ width: `${nut.val ? Math.min(100, (nut.val / nut.max) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0 -mt-8 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none z-20">
                               Valor preciso: {nut.val?.toFixed(4) || 'N/A'}{nut.unit}
                            </div>
                          </div>
                        ))}
                      </div>

                      {currentResult.dryMatterNutrients.calcium && currentResult.dryMatterNutrients.phosphorus && (
                        <div className="p-4 bg-indigo-600 rounded-2xl flex items-center justify-between text-white shadow-lg">
                          <div className="flex items-center gap-3">
                             <div className="bg-white/20 p-2 rounded-lg">⚖️</div>
                             <span className="text-xs font-bold uppercase tracking-widest opacity-90">Ratio Calcio:Fósforo</span>
                          </div>
                          <span className={`text-xl font-black ${(currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus! > 2.0 || currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus! < 1.0) ? 'text-rose-300' : 'text-white'}`}>
                            {(currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus!).toFixed(2)} : 1
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-black text-rose-600 flex items-center gap-2 uppercase text-xs tracking-widest">⚠️ Riesgos y Advertencias</h4>
                        <ul className="space-y-3">
                          {currentResult.warnings.length > 0 ? currentResult.warnings.map((w, i) => <li key={i} className="text-sm bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-100 shadow-sm leading-relaxed">{w}</li>) : <li className="text-sm text-slate-400 italic">No se detectaron riesgos críticos en este alimento.</li>}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-black text-emerald-600 flex items-center gap-2 uppercase text-xs tracking-widest">✅ Virtudes del Alimento</h4>
                        <ul className="space-y-3">
                          {currentResult.observations.length > 0 ? currentResult.observations.map((o, i) => <li key={i} className="text-sm bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 shadow-sm leading-relaxed">{o}</li>) : <li className="text-sm text-slate-400 italic">No hay puntos positivos destacados.</li>}
                        </ul>
                      </div>
                    </div>

                    {currentResult.assumptions.length > 0 && (
                      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-inner">
                        <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-3">Supuestos del Análisis (Faltaban datos en etiqueta)</p>
                        <div className="text-xs text-amber-900 space-y-2 font-medium">{currentResult.assumptions.map((a, i) => <p key={i}>• {a}</p>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {showHistory && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-slate-800">Historial</h2>
              <button onClick={handleStartComparison} disabled={selectedIds.size < 2} className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${selectedIds.size < 2 ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>Comparar Alimentos ({selectedIds.size})</button>
            </div>
            <div className="grid gap-4">
              {results.length === 0 ? <p className="text-slate-400 italic text-center py-10">Historial vacío.</p> : results.map((res) => (
                <div key={res.id} onClick={() => toggleSelection(res.id)} className={`bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:border-indigo-300 ${selectedIds.has(res.id) ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${selectedIds.has(res.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>{selectedIds.has(res.id) && <span className="font-bold">✓</span>}</div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{res.name}</h3>
                      <p className="text-xs text-slate-400">{new Date(res.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><div className="text-xl font-black text-indigo-600">{res.score} <span className="text-xs font-normal text-slate-400">pts</span></div></div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-sm ${TIER_COLORS[res.tier]}`}>{res.tier}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isComparing && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between border-b pb-4">
              <button onClick={() => setIsComparing(false)} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all">← Volver</button>
              <h2 className="text-2xl font-black text-slate-800">Comparativa Cara a Cara</h2>
            </div>

            <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
                {selectedResults.map((res) => {
                  const isTop = res.score === Math.max(...selectedResults.map(r => r.score)) && selectedResults.length > 1;
                  
                  const nutrientsToCompare = [
                    { label: 'Proteína', val: res.dryMatterNutrients.protein, unit: '%' },
                    { label: 'Grasa', val: res.dryMatterNutrients.fat, unit: '%' },
                    { label: 'Sodio (Riñones)', val: res.dryMatterNutrients.sodium, unit: '%' },
                    { label: 'Taurina', val: res.dryMatterNutrients.taurine, unit: '%' },
                    { 
                      label: 'Ca:P Ratio', 
                      val: (res.dryMatterNutrients.calcium && res.dryMatterNutrients.phosphorus) ? (res.dryMatterNutrients.calcium / res.dryMatterNutrients.phosphorus) : null, 
                      unit: ':1' 
                    }
                  ].filter(n => n.val !== null && n.val !== undefined && n.val !== 0);

                  return (
                    <div key={res.id} className={`w-80 flex-shrink-0 bg-white rounded-3xl border-2 transition-all shadow-xl overflow-hidden flex flex-col ${isTop ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
                      <div className="p-5 bg-slate-50 border-b flex items-center justify-between">
                        <div className="max-w-[70%]">
                          <h3 className="font-black text-slate-800 truncate leading-tight">{res.name}</h3>
                          <div className={`mt-2 inline-block px-2 py-0.5 rounded-lg text-[10px] font-black ${TIER_COLORS[res.tier]}`}>TIER {res.tier}</div>
                        </div>
                        <div className="text-3xl font-black text-indigo-600">{res.score}</div>
                      </div>
                      <div className="p-6 space-y-8 flex-grow">
                         <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Nutrientes (MS)</p>
                            <div className="space-y-2.5">
                               {nutrientsToCompare.map((nut, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm">
                                   <span className="text-slate-500 font-medium">{nut.label}</span>
                                   <span className="font-black text-slate-800">
                                     {typeof nut.val === 'number' ? nut.val.toFixed(2) : nut.val}{nut.unit}
                                   </span>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Evaluación por Áreas</p>
                            <div className="space-y-3">
                               {[
                                 { label: 'Valor Biológico', val: res.granularScores.animalProtein, color: 'bg-indigo-500' },
                                 { label: 'Pureza Receta', val: res.granularScores.fillersAndCereals, color: 'bg-emerald-500' },
                                 { label: 'Integridad Etiqueta', val: res.granularScores.transparency, color: 'bg-amber-500' },
                                 { label: 'Balance Vital', val: res.granularScores.additives, color: 'bg-rose-500' }
                               ].map((cat, i) => (
                                 <div key={i}>
                                   <div className="flex justify-between text-[10px] mb-1.5">
                                      <span className="font-bold text-slate-600">{cat.label}</span>
                                      <span className="font-black text-slate-800">{cat.val.toFixed(2)}/25</span>
                                   </div>
                                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                      <div className={`${cat.color} h-full transition-all duration-1000`} style={{ width: `${(cat.val/25)*100}%` }}></div>
                                   </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
               <h3 className="text-xl font-black mb-2 text-indigo-400">💡 Nota de Salud Renal</h3>
               <p className="text-slate-300 text-sm leading-relaxed">
                 Un ratio Calcio:Fósforo cercano a 1.2:1 y niveles de sodio menores al 0.5% (MS) son ideales para gatos adultos. 
                 Si el gato tiene historial de cristales o problemas renales, priorice alimentos con Tiers altos (S/A) y niveles de cenizas bajos.
               </p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-16 bg-slate-100 text-slate-400 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <p className="text-xs italic leading-loose max-w-2xl mx-auto">
            CatScore es una herramienta educativa basada en guías nutricionales. Las estimaciones de materia seca (MS) se utilizan para normalizar la comparación. Consulte a su veterinario antes de cambiar dietas.
          </p>
        </div>
      </footer>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
