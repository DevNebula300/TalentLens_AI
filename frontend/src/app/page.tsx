import Link from "next/link";
import { ArrowRight, BarChart2, CheckCircle2, FileText, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Hero Section */}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 md:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32">
         <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
             <div className="flex flex-col gap-8 max-w-2xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                   Everything You Need to <br/><span className="text-[#363893]">Understand Your Match</span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg">
                   Upload your resume and a job description to discover your compatibility, identify your strongest matches, and see where you can improve.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                   <Link href="/analyze" className="group flex items-center gap-2 bg-[#363893] text-white px-7 py-3.5 rounded-full font-medium hover:bg-[#23245c] transition-all shadow-lg shadow-indigo-900/20">
                     Analyze My Resume
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Link>
                   <Link href="/how-it-works" className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                     See How It Works
                   </Link>
                </div>
             </div>

             {/* Polished Product Preview */}
             <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
                {/* Background glowing effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-indigo-100 to-blue-50 rounded-full blur-3xl opacity-70 -z-10"></div>
                
                {/* Main UI Card */}
                <div className="relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-6 sm:p-8 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f0f1ff] to-[#e6e7fb] flex items-center justify-center border border-[#d6d8f5] shadow-sm">
                               <FileText className="w-6 h-6 text-[#363893]" />
                           </div>
                           <div>
                              <h3 className="font-semibold text-slate-900 text-lg">Senior Product Manager</h3>
                              <p className="text-sm text-slate-500">TechCorp Inc. • Remote</p>
                           </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xl border border-emerald-100 shadow-inner">
                              87
                              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-emerald-500 stroke-current"
                                  strokeWidth="3"
                                  strokeDasharray="87, 100"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                           </div>
                           <p className="text-[10px] font-semibold text-slate-400 mt-1.5 uppercase tracking-widest">Match Score</p>
                        </div>
                    </div>

                    {/* Content Bars */}
                    <div className="space-y-4">
                        <div className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                           <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                  <span className="text-sm font-semibold text-slate-700">Product Strategy</span>
                               </div>
                               <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Excellent</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500 w-[95%] rounded-full group-hover:bg-emerald-400 transition-colors"></div>
                           </div>
                        </div>

                        <div className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                           <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  <span className="text-sm font-semibold text-slate-700">Data Analysis</span>
                               </div>
                               <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Strong</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500 w-[80%] rounded-full group-hover:bg-blue-400 transition-colors"></div>
                           </div>
                        </div>

                        <div className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                           <div className="flex justify-between items-center mb-3">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                  <span className="text-sm font-semibold text-slate-700">Agile Frameworks</span>
                               </div>
                               <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Needs Review</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-amber-500 w-[45%] rounded-full group-hover:bg-amber-400 transition-colors"></div>
                           </div>
                        </div>
                    </div>
                </div>
             </div>
         </div>
      </main>

      {/* Feature Grid Section */}
      <section className="bg-white py-24 border-t border-slate-100 relative overflow-hidden" id="how-it-works">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-20">
               <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5">Uncover Insights at a Glance</h2>
               <p className="text-slate-600 text-lg leading-relaxed">Our AI engine breaks down your resume and the job description to give you a clear path forward.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
               <FeatureCard 
                 icon={<Target className="w-6 h-6 text-[#363893]" />}
                 title="Overall Match Score"
                 description="Get a simple compatibility score for the position."
               />
               <FeatureCard 
                 icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                 title="Skill Matching"
                 description="See which of your skills match the job requirements."
               />
               <FeatureCard 
                 icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
                 title="Experience Analysis"
                 description="Understand how well your experience aligns with the role."
               />
               <FeatureCard 
                 icon={<Zap className="w-6 h-6 text-amber-500" />}
                 title="Strengths"
                 description="Discover the areas where your resume stands out."
               />
               <FeatureCard 
                 icon={<TrendingUp className="w-6 h-6 text-rose-500" />}
                 title="Skills to Strengthen"
                 description="Identify skills that could improve your match."
               />
               <FeatureCard 
                 icon={<Lightbulb className="w-6 h-6 text-purple-600" />}
                 title="Personalized Recommendations"
                 description="Get practical suggestions for improving your application."
               />
            </div>
         </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group flex flex-col items-start">
       <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
          {icon}
       </div>
       <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
       <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
