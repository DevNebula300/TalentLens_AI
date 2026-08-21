"use client";

import { FileText, PlusCircle, Calendar, ChevronRight, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/resume/history`);
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await response.json();
        setHistoryItems(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/resume/analysis/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete analysis");
      }
      setHistoryItems(items => items.filter(item => item.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-slate-50 min-h-screen py-12 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-[#363893] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#fcf8ff] min-h-screen py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analysis History</h1>
            <p className="text-slate-600 mt-2">View and manage your past resume and job description analyses.</p>
          </div>
          {historyItems.length > 0 && (
            <Link href="/analyze" className="flex items-center gap-2 bg-[#363893] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#23245c] transition-colors shadow-sm">
              <PlusCircle className="w-5 h-5" />
              New Analysis
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {historyItems.length > 0 ? (
          <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {historyItems.map((item) => (
                <Link 
                  href={`/results/${item.id}`} 
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 hover:bg-slate-50 transition-colors group cursor-pointer gap-4 md:gap-0"
                >
                  <div className="flex items-start md:items-center gap-4 md:gap-5 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                      <FileText className="w-6 h-6 text-[#363893]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#363893] transition-colors">{item.filename}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-1 max-w-md italic">{item.jd_snippet}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                    {item.overall_score !== null && (
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</span>
                        </div>
                        <span className={`text-xl font-bold ${
                          item.overall_score >= 0.75 ? 'text-emerald-600' : 
                          item.overall_score >= 0.5 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {Math.round(item.overall_score * 100)}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2"
                        title="Delete analysis"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          !isLoading && !error && (
            <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-[#f0f1ff] flex items-center justify-center mb-6 shadow-sm border border-[#d6d8f5]">
                <FileText className="w-10 h-10 text-[#363893]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No analyses yet</h2>
              <p className="text-slate-500 mb-8 max-w-sm text-lg">Upload your resume and a job description to get started and see your match scores here.</p>
              <Link href="/analyze" className="flex items-center gap-2 bg-[#363893] text-white px-7 py-3.5 rounded-full font-medium hover:bg-[#23245c] transition-colors shadow-sm">
                <PlusCircle className="w-5 h-5" />
                Start New Analysis
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}