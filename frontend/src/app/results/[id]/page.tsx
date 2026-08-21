"use client";

import { ArrowLeft, FileText, Download, Target, CheckCircle2, Zap, Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

// highlight text component

const HighlightText = ({ text, wordsToHighlight }: { text: string, wordsToHighlight: string[] }) => {
  if (!text) return null;
  if (!wordsToHighlight || wordsToHighlight.length === 0) {
    return (
    <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed font-mono bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 h-[600px] overflow-y-auto overflow-x-hidden break-words">
        {text}
      </div>
    );
  }

  
  const sortedWords = [...wordsToHighlight].sort((a, b) => b.length - a.length);
  const escapedWords = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  

  const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');


  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
  const urlParts = text.split(urlRegex);

  return (
    <div className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed font-mono bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 h-[600px] overflow-y-auto overflow-x-hidden shadow-inner break-words">
      {urlParts.map((chunk, index) => {
       
        if (!chunk) return null;
        
  
        if (chunk.match(/^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i)) {
          return <span key={index} className="text-slate-500">{chunk}</span>;
        }


        const highlightParts = chunk.split(regex);
        return (
          <span key={index}>
            {highlightParts.map((part, i) => {
              if (sortedWords.some(w => w.toLowerCase() === part.toLowerCase())) {
                return (
                  <span key={`${index}-${i}`} className="bg-emerald-200 text-emerald-900 font-bold px-1 py-0.5 rounded-sm shadow-sm border border-emerald-300">
                    {part}
                  </span>
                );
              }
              return <span key={`${index}-${i}`}>{part}</span>;
            })}
          </span>
        );
      })}
    </div>
  );
};


// resultpage component

export default function ResultPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/resume/analysis/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analysis");
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-slate-50 min-h-screen py-10 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-[#363893] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex-1 w-full bg-slate-50 min-h-screen py-10 px-6 flex items-center justify-center">
        <div className="bg-[#fcf8ff] p-8 rounded-3xl border border-red-200 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Analysis Not Found</h2>
          <p className="text-slate-600 mb-6">{error || "The requested analysis could not be found."}</p>
          <Link href="/history" className="inline-block bg-[#363893] text-white px-6 py-2 rounded-full font-medium">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const result = analysis.match_result;

  return (
    <div className="flex-1 w-full bg-[#fcf8ff] min-h-screen py-6 md:py-10 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        
        {/* header navigation */}
        <div className="flex items-center justify-between">
           <Link href="/history" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to History
           </Link>
        </div>

      
        <div className="bg-[#fcf8ff] rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
           <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                  <FileText className="w-8 h-8 text-[#363893]" />
              </div>
              <div className="min-w-0">
                 <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">Analysis Report</h1>
                 <p className="text-base sm:text-lg text-slate-500 mt-1 truncate max-w-[250px] sm:max-w-md">{analysis.filename}</p>
                 <p className="text-xs sm:text-sm text-slate-400 mt-1">{new Date(analysis.created_at).toLocaleString()}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 px-6 sm:px-8 py-6 rounded-3xl border border-slate-100 shrink-0 w-full sm:w-auto justify-center">
              <div className="text-right">
                 <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Overall Match</p>
                 <p className={`font-medium ${result.confidence?.level === "high" ? 'text-emerald-600' : 'text-amber-600'}`}>
                   {result.confidence?.level === "high" ? 'High Confidence' : 'Medium Confidence'}
                 </p>
              </div>
              <div className={`relative flex items-center justify-center w-24 h-24 rounded-full font-bold text-3xl border-4 shadow-inner ${
                analysis.overall_score >= 0.75 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                analysis.overall_score >= 0.5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                 {Math.round(analysis.overall_score * 100)}
                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                   <path
                     className={`${
                       analysis.overall_score >= 0.75 ? 'text-emerald-500' : 
                       analysis.overall_score >= 0.5 ? 'text-amber-500' : 'text-red-500'
                     } stroke-current`}
                     strokeWidth="2.5"
                     strokeDasharray={`${Math.round(analysis.overall_score * 100)}, 100`}
                     fill="none"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   />
                 </svg>
              </div>
           </div>
        </div>

        
        <div className="grid lg:grid-cols-3 gap-8">
          
           <div className="lg:col-span-2 space-y-8 min-w-0">
              
             
              <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden">
                 <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-[#363893]" />
                    <h2 className="text-xl font-bold text-slate-900">Score Breakdown</h2>
                 </div>
                 
                 <div className="space-y-6">
                     {[
                      { name: "Semantic Understanding", match: result.score_breakdown.semantic_match * 100, bg_50: "bg-indigo-50", text_600: "text-indigo-600", bg_500: "bg-indigo-500" },
                      { name: "Hard Skills Match", match: result.score_breakdown.skill_match * 100, bg_50: "bg-blue-50", text_600: "text-blue-600", bg_500: "bg-blue-500" },
                      { name: "Experience Level", match: result.score_breakdown.experience_match * 100, bg_50: "bg-emerald-50", text_600: "text-emerald-600", bg_500: "bg-emerald-500" },
                      { name: "Keyword Alignment", match: result.score_breakdown.keyword_match * 100, bg_50: "bg-violet-50", text_600: "text-violet-600", bg_500: "bg-violet-500" }
                    ].map((skill, idx) => (
                      <div key={idx} className="group">
                         <div className="flex justify-between items-center mb-3">
                             <span className="font-semibold text-slate-700">{skill.name}</span>
                             <span className={`text-xs font-bold px-3 py-1 rounded-full ${skill.bg_50} ${skill.text_600}`}>
                               {Math.round(skill.match)}%
                             </span>
                         </div>
                         <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 ${skill.bg_500}`}
                               style={{ width: `${Math.max(skill.match, 2)}%` }}
                             ></div>
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 {result.weight_explanations && result.weights_used && (
                    <details className="mt-8 group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm" open>
                      <summary className="cursor-pointer font-bold text-slate-800 px-6 py-4 hover:bg-slate-100 transition-colors list-none flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="w-5 h-5 text-indigo-500" />
                          <span>Detailed Calculation & AI Reasoning</span>
                        </div>
                        <span className="transition-transform group-open:rotate-180 bg-[#fcf8ff] p-1 rounded-full shadow-sm border border-slate-200">
                          <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      
                      {/* Mobile Card View */}
                      <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50">
                        {[
                          { id: "semantic", name: "Semantic Understanding", key: "semantic_match" },
                          { id: "skill", name: "Hard Skills Match", key: "skill_match" },
                          { id: "experience", name: "Experience Level", key: "experience_match" },
                          { id: "keyword", name: "Keyword Alignment", key: "keyword_match" },
                        ].map((row) => (
                          <div key={row.id} className="bg-[#fcf8ff] p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">{row.name}</div>
                            
                            <div className="flex flex-col gap-3 mb-4 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Weight (W)</span>
                                <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">{Math.round(result.weights_used[row.key] * 100)}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Raw Score (S)</span>
                                <span className="font-mono text-slate-700 font-medium px-2 py-0.5">{Math.round(result.score_breakdown[row.key] * 100)}%</span>
                              </div>
                              <div className="flex justify-between items-center bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                <span className="text-slate-700 font-semibold">Contribution</span>
                                <span className="font-mono text-emerald-700 font-bold bg-emerald-100/50 border border-emerald-200 px-2 py-1 rounded">+{Math.round(result.weighted_contributions[row.key] * 100)}%</span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                                AI Reasoning
                              </span>
                              {result.weight_explanations[row.key]}
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-[#fcf8ff] p-4 rounded-xl shadow-sm border-2 border-emerald-100 flex justify-between items-center mt-2">
                          <div className="font-bold text-slate-700 uppercase tracking-wider text-xs">Final Overall Score</div>
                          <div className="font-mono font-bold text-emerald-600 text-xl">{Math.round(result.overall_score * 100)}%</div>
                        </div>
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block border-t border-slate-200 bg-[#fcf8ff] overflow-x-auto max-w-full w-full">
                        <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                          <thead className="bg-slate-50/80 text-slate-500 uppercase text-xs tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-6 py-4 font-bold">Scoring Category</th>
                              <th className="px-6 py-4 font-bold text-center">Weight (W)</th>
                              <th className="px-6 py-4 font-bold text-center">Raw Score (S)</th>
                              <th className="px-6 py-4 font-bold text-center">Contribution (W × S)</th>
                              <th className="px-6 py-4 font-bold">AI Dynamic Adjustment Reasoning</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {[
                              { id: "semantic", name: "Semantic Understanding", key: "semantic_match" },
                              { id: "skill", name: "Hard Skills Match", key: "skill_match" },
                              { id: "experience", name: "Experience Level", key: "experience_match" },
                              { id: "keyword", name: "Keyword Alignment", key: "keyword_match" },
                            ].map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-800">{row.name}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-block bg-indigo-50 text-indigo-700 font-mono px-2 py-1 rounded border border-indigo-100">
                                    {Math.round(result.weights_used[row.key] * 100)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-slate-700">
                                  {Math.round(result.score_breakdown[row.key] * 100)}%
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-block bg-emerald-50 text-emerald-700 font-mono font-bold px-2 py-1 rounded border border-emerald-100">
                                    +{Math.round(result.weighted_contributions[row.key] * 100)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs leading-relaxed text-slate-500 max-w-[250px]">
                                  {result.weight_explanations[row.key]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-700 uppercase tracking-wider text-xs">
                                Final Overall Compatibility Score
                              </td>
                              <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600 text-lg border-x border-slate-200 bg-[#fcf8ff] shadow-inner">
                                {Math.round(result.overall_score * 100)}%
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </details>
                  )}
              </div>

             
              <div className="bg-emerald-50/50 rounded-3xl border border-emerald-100 shadow-sm p-6 sm:p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-bold text-slate-900">Key Strengths</h2>
                 </div>
                 <ul className="space-y-4">
                    {result.strengths?.length > 0 ? (
                      result.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex gap-4 text-slate-700 items-start">
                          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                          <span className="leading-relaxed font-medium">{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No notable strengths identified.</li>
                    )}
                 </ul>
              </div>
              
             
              <div className="bg-rose-50/50 rounded-3xl border border-rose-100 shadow-sm p-6 sm:p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-6 h-6 text-rose-600" />
                    <h2 className="text-xl font-bold text-slate-900">Potential Gaps</h2>
                 </div>
                 <ul className="space-y-4">
                    {result.gaps?.length > 0 ? (
                      result.gaps.map((s: string, i: number) => (
                        <li key={i} className="flex gap-4 text-slate-700 items-start">
                          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                          </span>
                          <span className="leading-relaxed font-medium">{s}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No significant gaps identified.</li>
                    )}
                 </ul>
              </div>
              
              
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-sm p-6 sm:p-8">
                   <div className="flex items-center gap-3 mb-6">
                      <Lightbulb className="w-6 h-6 text-indigo-600" />
                      <h2 className="text-xl font-bold text-slate-900">Actionable Recommendations</h2>
                   </div>
                   <ul className="space-y-4">
                      {result.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex gap-4 text-slate-700 items-start">
                          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                             {i + 1}
                          </span>
                          <span className="leading-relaxed font-medium">{r}</span>
                        </li>
                      ))}
                   </ul>
                </div>
              )}
           </div>

           
           <div className="space-y-6 min-w-0">
             <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm p-6">
                 <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-4">Skills Analysis</h3>
                 
                 <div className="space-y-6">
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Must-Have Matched</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.matched_skills?.length > 0 ? (
                          result.matched_skills.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">None found</span>
                        )}
                      </div>
                    </div>
                    
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Must-Have Missing</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_skills?.length > 0 ? (
                          result.missing_skills.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">All met!</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Preferred Matched</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.preferred_matched?.length > 0 ? (
                          result.preferred_matched.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">None found</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Preferred Missing</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.preferred_missing?.length > 0 ? (
                          result.preferred_missing.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-sm font-medium">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">None found</span>
                        )}
                      </div>
                    </div>
                    
                   
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Bonus / Extra</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.additional_skills?.length > 0 ? (
                          result.additional_skills.map((s: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">None found</span>
                        )}
                      </div>
                    </div>
                 </div>
             </div>
           </div>
        </div>

        
        <div className="grid lg:grid-cols-2 gap-8">
            
            <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Original PDF Document
                </h3>
                <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                  {analysis.has_pdf ? (
                    <iframe 
                      src={`${API_BASE_URL}/api/resume/file/${analysis.resume_id}`} 
                      className="w-full h-full"
                      title="Resume PDF"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-slate-500 font-medium mb-2">PDF Document Not Available</p>
                      <p className="text-sm text-slate-400">This analysis was performed before document saving was enabled. Please run a new analysis to view the original PDF here.</p>
                    </div>
                  )}
                </div>
            </div>

            
            <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden min-w-0">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-500" />
                  Extracted Text & Highlights
                </h3>
                {analysis.resume_text ? (
                  <HighlightText 
                    text={analysis.resume_text} 
                    wordsToHighlight={result.matched_skills || []} 
                  />
                ) : (
                  <p className="text-slate-500 italic bg-slate-50 p-6 rounded-2xl border border-slate-200">No resume text available for this analysis.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}