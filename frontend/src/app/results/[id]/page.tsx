"use client";

import { ArrowLeft, FileText, Download, Target, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ResultPage() {
  const params = useParams();
  
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between">
           <Link href="/history" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to History
           </Link>
           <button className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
             <Download className="w-4 h-4" />
             Export PDF
           </button>
        </div>

        {/* Dashboard Header */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100 shadow-sm">
                  <FileText className="w-8 h-8 text-[#363893]" />
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Senior Product Manager</h1>
                 <p className="text-lg text-slate-500 mt-1">TechCorp Inc. • Remote</p>
              </div>
           </div>
           
           <div className="flex items-center gap-6 bg-slate-50 px-8 py-6 rounded-3xl border border-slate-100">
              <div className="text-right">
                 <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Overall Match</p>
                 <p className="text-slate-600 font-medium">Highly Compatible</p>
              </div>
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 font-bold text-3xl border-4 border-emerald-100 shadow-inner">
                 87
                 <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                   <path
                     className="text-emerald-500 stroke-current"
                     strokeWidth="2.5"
                     strokeDasharray="87, 100"
                     fill="none"
                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                   />
                 </svg>
              </div>
           </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
           {/* Strengths & Weaknesses (Left Column) */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* Skill Match Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <Target className="w-6 h-6 text-[#363893]" />
                    <h2 className="text-xl font-bold text-slate-900">Skill Breakdown</h2>
                 </div>
                 
                 <div className="space-y-6">
                    {[
                      { name: "Product Strategy", match: 95, status: "Excellent", color: "emerald" },
                      { name: "Data Analysis", match: 80, status: "Strong", color: "blue" },
                      { name: "Agile Frameworks", match: 45, status: "Needs Review", color: "amber" }
                    ].map((skill, idx) => (
                      <div key={idx} className="group">
                         <div className="flex justify-between items-center mb-3">
                             <span className="font-semibold text-slate-700">{skill.name}</span>
                             <span className={`text-xs font-bold px-3 py-1 rounded-full bg-${skill.color}-50 text-${skill.color}-600`}>
                               {skill.status}
                             </span>
                         </div>
                         <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className={`h-full rounded-full transition-all duration-1000 bg-${skill.color}-500`}
                               style={{ width: `${skill.match}%` }}
                             ></div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Strengths */}
              <div className="bg-emerald-50/50 rounded-3xl border border-emerald-100 shadow-sm p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-bold text-slate-900">Key Strengths</h2>
                 </div>
                 <ul className="space-y-4">
                    {[
                      "Extensive 5+ years experience in B2B SaaS directly aligns with the role.",
                      "Demonstrated success in leading cross-functional teams to launch 3 major products.",
                      "Strong background in user research and A/B testing methodologies."
                    ].map((item, idx) => (
                       <li key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-emerald-200 flex-shrink-0 flex items-center justify-center mt-0.5">
                             <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          </div>
                          <span className="text-slate-700 leading-relaxed">{item}</span>
                       </li>
                    ))}
                 </ul>
              </div>
           </div>

           {/* Recommendations (Right Column) */}
           <div className="space-y-8">
              <div className="bg-amber-50/50 rounded-3xl border border-amber-100 shadow-sm p-8 h-full">
                 <div className="flex items-center gap-3 mb-6">
                    <Zap className="w-6 h-6 text-amber-500" />
                    <h2 className="text-xl font-bold text-slate-900">Actionable Advice</h2>
                 </div>
                 <p className="text-slate-600 mb-6 leading-relaxed">
                   Based on your resume and the job description, here are the top areas to focus on improving before you apply.
                 </p>
                 <div className="space-y-6">
                    {[
                      {
                        title: "Highlight Agile Experience",
                        desc: "The JD heavily emphasizes Agile. Make sure your Scrum Master certification is prominent."
                      },
                      {
                        title: "Add Data Metrics",
                        desc: "Quantify your achievements in 'Data Analysis' to show concrete impact."
                      },
                      {
                        title: "Address Gap in Technical Skills",
                        desc: "Consider taking a quick refresher on SQL as it is listed under 'Required Skills'."
                      }
                    ].map((advice, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-sm">
                         <h4 className="font-semibold text-slate-900 mb-2">{advice.title}</h4>
                         <p className="text-sm text-slate-600 leading-relaxed">{advice.desc}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}