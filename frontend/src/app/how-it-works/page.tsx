import { FileSearch, Layers, Crosshair, Target, CheckSquare, BrainCircuit, History } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      title: "Easy Uploads",
      description: "Simply upload your resume in PDF format or paste your job description. Our system instantly reads and organizes the text."
    },
    {
      icon: <FileSearch className="w-6 h-6 text-emerald-600" />,
      title: "Smart Parsing",
      description: "We automatically identify key sections of your resume, such as your professional summary, work experience, education, and projects."
    },
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: "Skill Identification",
      description: "Our system finds and organizes the skills listed in both your resume and the job posting to establish a baseline for comparison."
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-amber-600" />,
      title: "Deep Understanding",
      description: "We go beyond exact keyword matches. The platform understands the context of your experience to recognize when your past roles align with the job's needs."
    },
    {
      icon: <Crosshair className="w-6 h-6 text-rose-600" />,
      title: "Direct Matching",
      description: "We compare your years of experience, past roles, and exact skills against the job requirements to find direct matches."
    },
    {
      icon: <CheckSquare className="w-6 h-6 text-[#363893]" />,
      title: "Clear Results",
      description: "You'll receive a simple, easy-to-understand percentage match score, a gap analysis of missing skills, and actionable advice to improve your resume."
    },
    {
      icon: <History className="w-6 h-6 text-slate-600" />,
      title: "Track Your Progress",
      description: "Keep a history of your past analyses to track your improvement over time as you tailor your resume for different roles."
    }
  ];

  return (
    <div className="flex-1 w-full bg-[#fcf8ff] min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">How It Works</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our platform takes the guesswork out of job applications by providing a clear, transparent look at how your resume matches a job description.
          </p>
        </div>

        <div className="bg-[#fcf8ff] rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {steps.map((step, idx) => (
              <div key={idx} className="p-8 md:p-10 flex flex-col md:flex-row gap-6 md:items-start group hover:bg-[#fcf8ff]/50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-[#fcf8ff] flex items-center justify-center border border-slate-100 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <div className="flex-1 space-y-2 pt-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300">0{idx + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed max-w-2xl text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-8 pb-12">
           <Link href="/analyze" className="bg-[#363893] text-white px-10 py-4 rounded-full font-medium hover:bg-[#23245c] transition-colors shadow-lg shadow-indigo-900/20 text-lg">
             Try It Now
           </Link>
        </div>
      </div>
    </div>
  );
}
