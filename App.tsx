
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
      setError("Error al procesar la etiqueta. Verifica el formato del texto.");
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
        if (value < NUTRITIONAL_TARGETS.TAURINE.min_dry) return 'bg-rose-500';
        if (value < NUTRITIONAL_TARGETS.TAURINE.ideal) return 'bg-amber-400';
        return 'bg-emerald-500';
      case 'calcium':
        if (value < NUTRITIONAL_TARGETS.MINERALS.CALCIUM.min || value > 1.8) return 'bg-rose-500';
        return 'bg-emerald-500';
      case 'phosphorus':
        if (value < NUTRITIONAL_TARGETS.MINERALS.PHOSPHORUS.min || value > 1.5) return 'bg-rose-500';
        return 'bg-emerald-500';
      case 'sodium':
        if (value > NUTRITIONAL_TARGETS.MINERALS.SODIUM.max) return 'bg-rose-500';
        return 'bg-emerald-500';
      default:
        return 'bg-indigo-500';
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {setShowHistory(false); setIsComparing(false);}}>
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-xl shadow-lg">CS</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">CatScore</h1>
          </div>
          <div className="flex items-center gap-4">
            {results.length > 0 && (
              <button 
                onClick={() => {
                  setShowHistory(!showHistory);
                  setIsComparing(false);
                }}
                className={`text-sm font-black transition-all px-4 py-2 rounded-xl ${showHistory ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
            <section className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                <span className="w-2.5 h-8 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></span>
                Analizar Etiqueta
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Nombre del Producto</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ej. Cat Chow Carne" 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all text-slate-900 bg-white font-bold text-lg placeholder-slate-300 shadow-sm" 
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Análisis Garantizado</label>
                    <textarea 
                      value={analysis} 
                      onChange={(e) => setAnalysis(e.target.value)} 
                      placeholder="Copia aquí el texto del análisis garantizado..." 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none h-56 resize-none text-sm text-slate-900 bg-white font-medium leading-relaxed shadow-sm scrollbar-hide" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Lista de Ingredientes</label>
                    <textarea 
                      value={ingredients} 
                      onChange={(e) => setIngredients(e.target.value)} 
                      placeholder="Copia aquí la lista completa de ingredientes..." 
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none h-56 resize-none text-sm text-slate-900 bg-white font-medium leading-relaxed shadow-sm scrollbar-hide" 
                    />
                  </div>
                </div>
                {error && <div className="p-5 bg-rose-50 border-2 border-rose-100 text-rose-600 rounded-2xl text-sm font-black animate-in fade-in zoom-in">{error}</div>}
                <button type="submit" disabled={loading} className={`w-full py-5 rounded-[1.5rem] font-black text-white shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-4 text-xl active:scale-[0.98] ${loading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Procesando Etiqueta...
                    </>
                  ) : 'Analizar Calidad Real'}
                </button>
              </form>
            </section>

            {currentResult && (
              <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
                  <div className="p-10 md:p-14 bg-gradient-to-br from-slate-50 to-white border-b flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div>
                      <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3">{currentResult.name}</h2>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Informe Nutricional Técnico</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-6xl font-black text-indigo-600 leading-none">{currentResult.score}</div>
                        <div className="text-[11px] uppercase font-black text-slate-300 tracking-[0.2em] mt-2">Score / 100</div>
                      </div>
                      <div className={`w-28 h-28 rounded-[2rem] border-4 flex items-center justify-center text-6xl font-black shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500 ${TIER_COLORS[currentResult.tier]}`}>{currentResult.tier}</div>
                    </div>
                  </div>

                  <div className="p-10 md:p-14 space-y-16">
                    <div className="relative">
                      <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Lectura de Etiqueta</h3>
                      <div className="relative group">
                        <div className="absolute -left-6 top-0 bottom-0 w-2 bg-indigo-600 rounded-full shadow-lg"></div>
                        <p className="text-2xl text-slate-800 leading-snug font-bold italic pl-4 group-hover:text-indigo-900 transition-colors">"{currentResult.summary}"</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                       {[
                         { key: 'animalProtein', label: 'Proteína', color: 'bg-indigo-600' },
                         { key: 'fillersAndCereals', label: 'Ingredientes', color: 'bg-emerald-500' },
                         { key: 'transparency', label: 'Transparencia', color: 'bg-amber-500' },
                         { key: 'additives', label: 'Balance', color: 'bg-rose-500' }
                       ].map(cat => (
                         <div key={cat.key} className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-200 transition-all group">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{cat.label}</p>
                           <div className="text-3xl font-black text-slate-900 mb-4">{currentResult.granularScores[cat.key as keyof typeof currentResult.granularScores].toFixed(1)} <span className="text-xs font-bold text-slate-300">/ 25</span></div>
                           <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                             <div className={`${cat.color} h-full transition-all duration-[2000ms] ease-out group-hover:brightness-110`} style={{ width: `${(currentResult.granularScores[cat.key as keyof typeof currentResult.granularScores]/25)*100}%` }}></div>
                           </div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-10">
                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Perfil Nutricional (Materia Seca)</h3>
                        <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-widest">
                           <div className="flex items-center gap-2 text-rose-500"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-md shadow-rose-200"></div> Crítico</div>
                           <div className="flex items-center gap-2 text-amber-500"><div className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-200"></div> Alerta</div>
                           <div className="flex items-center gap-2 text-emerald-500"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-200"></div> Ideal</div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                        {[
                          { key: 'protein', label: 'Proteína', unit: '%', val: currentResult.dryMatterNutrients.protein, max: 60 },
                          { key: 'fat', label: 'Grasa', unit: '%', val: currentResult.dryMatterNutrients.fat, max: 25 },
                          { key: 'taurine', label: 'Taurina', unit: '%', val: currentResult.dryMatterNutrients.taurine, max: 0.5 },
                          { key: 'calcium', label: 'Calcio', unit: '%', val: currentResult.dryMatterNutrients.calcium, max: 2.5 },
                          { key: 'phosphorus', label: 'Fósforo', unit: '%', val: currentResult.dryMatterNutrients.phosphorus, max: 2.0 },
                          { key: 'sodium', label: 'Sodio', unit: '%', val: currentResult.dryMatterNutrients.sodium, max: 1.0 }
                        ].map((nut) => (
                          <div key={nut.key} className="group">
                            <div className="flex justify-between items-end mb-3">
                              <span className="text-sm font-black text-slate-700">{nut.label}</span>
                              <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg tabular-nums">
                                {nut.val !== undefined && nut.val !== null ? nut.val.toFixed(2) : '--'}{nut.unit}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner border-2 border-slate-50 group-hover:scale-[1.02] transition-transform">
                              <div 
                                className={`h-full transition-all duration-[1500ms] ease-out ${getNutrientStatusColor(nut.key, nut.val)} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                                style={{ width: `${(nut.val !== undefined && nut.val !== null) ? Math.min(100, (nut.val / nut.max) * 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {currentResult.dryMatterNutrients.calcium && currentResult.dryMatterNutrients.phosphorus && (
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl transform hover:scale-[1.01] transition-all group overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                          <div className="flex items-center gap-6 relative z-10">
                             <div className="bg-indigo-600 p-4 rounded-2xl text-2xl shadow-xl shadow-indigo-900/40">⚖️</div>
                             <div>
                               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1">Ratio Calcio : Fósforo</span>
                               <span className="text-lg font-bold text-slate-300">Equilibrio Mineral Estricto</span>
                             </div>
                          </div>
                          <span className={`text-4xl font-black relative z-10 ${(currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus! > 1.8 || currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus! < 1.0) ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {(currentResult.dryMatterNutrients.calcium! / currentResult.dryMatterNutrients.phosphorus!).toFixed(2)} : 1
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h4 className="font-black text-rose-500 flex items-center gap-4 uppercase text-xs tracking-widest border-b-2 border-rose-50 pb-4">⚠️ Puntos Críticos</h4>
                        <ul className="space-y-4">
                          {currentResult.warnings.length > 0 ? currentResult.warnings.map((w, i) => (
                            <li key={i} className="text-sm bg-rose-50/50 text-rose-900 p-6 rounded-[1.5rem] border-2 border-rose-100 shadow-sm leading-relaxed font-bold animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>{w}</li>
                          )) : <li className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border-2 border-dashed">Sin anomalías críticas detectadas.</li>}
                        </ul>
                      </div>
                      <div className="space-y-6">
                        <h4 className="font-black text-emerald-500 flex items-center gap-4 uppercase text-xs tracking-widest border-b-2 border-emerald-50 pb-4">✅ Puntos Destacados</h4>
                        <ul className="space-y-4">
                          {currentResult.observations.length > 0 ? currentResult.observations.map((o, i) => (
                            <li key={i} className="text-sm bg-emerald-50/50 text-emerald-900 p-6 rounded-[1.5rem] border-2 border-emerald-100 shadow-sm leading-relaxed font-bold animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>{o}</li>
                          )) : <li className="text-sm text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center border-2 border-dashed">No hay virtudes destacables en la etiqueta.</li>}
                        </ul>
                      </div>
                    </div>

                    {currentResult.assumptions.length > 0 && (
                      <div className="bg-amber-50 rounded-[2.5rem] p-10 border-2 border-amber-100 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl rotate-12">📝</div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                          <p className="text-[11px] font-black text-amber-800 uppercase tracking-[0.3em]">Cálculos de Seguridad (Datos Omitidos)</p>
                        </div>
                        <div className="text-xs text-amber-950 space-y-4 leading-relaxed font-bold relative z-10 max-w-2xl">
                          {currentResult.assumptions.map((a, i) => <p key={i} className="flex gap-4"><span>•</span> {a}</p>)}
                          <p className="pt-6 text-[10px] opacity-60 border-t border-amber-200">Nota: Estos valores se estiman conservadoramente para permitir el cálculo del score total cuando la etiqueta no es transparente al 100%. Para saber el valor real, consulte al fabricante.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {showHistory && (
          <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-6">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Historial de Análisis</h2>
              <button onClick={handleStartComparison} disabled={selectedIds.size < 2} className={`px-10 py-4 rounded-2xl text-sm font-black shadow-2xl transition-all active:scale-95 ${selectedIds.size < 2 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}>Comparar Alimentos ({selectedIds.size})</button>
            </div>
            <div className="grid gap-6">
              {results.length === 0 ? <p className="text-slate-400 italic text-center py-40 bg-white rounded-[2rem] border-4 border-dashed border-slate-100">Analiza tu primer alimento para ver el historial.</p> : results.map((res) => (
                <div key={res.id} onClick={() => toggleSelection(res.id)} className={`bg-white p-8 rounded-[2rem] border-4 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-xl ${selectedIds.has(res.id) ? 'border-indigo-600 bg-indigo-50/20' : 'border-white hover:border-indigo-100'}`}>
                  <div className="flex items-center gap-8">
                    <div className={`w-10 h-10 rounded-2xl border-4 flex items-center justify-center transition-all ${selectedIds.has(res.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-100 bg-slate-50'}`}>{selectedIds.has(res.id) && <span className="font-black text-lg">✓</span>}</div>
                    <div>
                      <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-none mb-2">{res.name}</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(res.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right"><div className="text-3xl font-black text-indigo-600">{res.score.toFixed(1)} <span className="text-xs font-bold text-slate-300">PTS</span></div></div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl ${TIER_COLORS[res.tier]}`}>{res.tier}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isComparing && (
          <div className="space-y-12 animate-in slide-in-from-right-12 duration-700 pb-20">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
              <button onClick={() => setIsComparing(false)} className="text-sm font-black text-indigo-600 bg-white border-2 border-indigo-100 px-8 py-4 rounded-[1.5rem] hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-100/20 active:scale-95">← Volver al Historial</button>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Comparación Técnica</h2>
            </div>

            <div className="overflow-x-auto pb-12 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-10" style={{ minWidth: 'max-content' }}>
                {selectedResults.map((res) => {
                  const items = [
                    { label: 'Proteína (MS)', val: res.dryMatterNutrients.protein, unit: '%' },
                    { label: 'Grasa (MS)', val: res.dryMatterNutrients.fat, unit: '%' },
                    { label: 'Taurina (MS)', val: res.dryMatterNutrients.taurine, unit: '%' },
                    { label: 'Ratio Ca:P', val: (res.dryMatterNutrients.calcium && res.dryMatterNutrients.phosphorus) ? (res.dryMatterNutrients.calcium / res.dryMatterNutrients.phosphorus) : null, unit: ':1' }
                  ].filter(n => n.val !== null);

                  return (
                    <div key={res.id} className="w-96 flex-shrink-0 bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl overflow-hidden flex flex-col transform transition hover:scale-[1.02] duration-500">
                      <div className="p-10 bg-slate-50/50 border-b-2 border-slate-100 flex flex-col gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl ${TIER_COLORS[res.tier]}`}>{res.tier}</div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 truncate leading-none mb-3">{res.name}</h3>
                          <div className="text-5xl font-black text-indigo-600 tracking-tighter">{res.score.toFixed(1)} <span className="text-sm font-bold text-slate-300 tracking-widest uppercase">PTS</span></div>
                        </div>
                      </div>
                      <div className="p-10 space-y-10 flex-grow">
                         <div className="space-y-6">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] border-b-2 border-slate-50 pb-4">Análisis Comparativo</p>
                            <div className="space-y-5">
                               {items.map((nut, i) => (
                                 <div key={i} className="flex justify-between items-center text-base">
                                   <span className="text-slate-500 font-bold">{nut.label}</span>
                                   <span className="font-black text-slate-900 bg-slate-50 px-4 py-1.5 rounded-xl tabular-nums border-2 border-slate-100">
                                     {typeof nut.val === 'number' ? nut.val.toFixed(2) : nut.val}{nut.unit}
                                   </span>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="pt-6 space-y-4">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Factores Clave</p>
                            <div className="space-y-3">
                                <div className={`px-6 py-4 rounded-2xl text-xs font-black text-center shadow-inner ${res.ingredients.firstIngredientAnimal ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {res.ingredients.firstIngredientAnimal ? '✓ BASE PROTEICA ANIMAL' : '✗ BASE PROTEICA VEGETAL'}
                                </div>
                                <div className={`px-6 py-4 rounded-2xl text-xs font-black text-center shadow-inner ${!res.ingredients.hasVariableFormulation ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {!res.ingredients.hasVariableFormulation ? '✓ FÓRMULA FIJA TRANSPARENTE' : '✗ FÓRMULA VARIABLE (Y/O)'}
                                </div>
                                <div className={`px-6 py-4 rounded-2xl text-xs font-black text-center shadow-inner ${res.ingredients.meatInTopThree ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                                  {res.ingredients.meatInTopThree ? '✓ CARNE EN TOP 3' : '✗ BAJO CONTENIDO CÁRNICO'}
                                </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-40 py-32 bg-slate-950 text-slate-500">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
          <div className="bg-indigo-600 text-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl mx-auto shadow-2xl shadow-indigo-600/40 rotate-12">CS</div>
          <p className="text-sm italic leading-loose max-w-2xl mx-auto opacity-50 font-medium">
            CatScore es una herramienta de análisis algorítmico basada en estándares nutricionales globales (FEDIAF). Las interpretaciones son automáticas y pueden estar sujetas a la calidad del texto de origen. Consulta siempre a tu veterinario.
          </p>
          <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 pt-10 border-t border-white/5">
            Nutrition Intelligence System v3.1
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
