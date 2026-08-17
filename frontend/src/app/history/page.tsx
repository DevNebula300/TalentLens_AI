import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const historyItems: any[] = [];

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analysis History</h1>
          <p className="text-slate-600 mt-2">View and manage your past resume and job description analyses.</p>
        </div>

        {historyItems.length > 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {/* List will be rendered here */}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
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
        )}
      </div>
    </div>
  );
}