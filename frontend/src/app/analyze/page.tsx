"use client";

import { FileText, Upload, Briefcase, File, X } from "lucide-react";
import { useState, useRef } from "react";

export default function AnalyzePage() {
  const [jdInputMode, setJdInputMode] = useState<"file" | "text">("file");
  
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingJd, setIsDraggingJd] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    if (type === 'resume') setIsDraggingResume(true);
    if (type === 'jd') setIsDraggingJd(true);
  };

  const handleDragLeave = (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    if (type === 'resume') setIsDraggingResume(false);
    if (type === 'jd') setIsDraggingJd(false);
  };

  const handleDrop = (e: React.DragEvent, type: 'resume' | 'jd') => {
    e.preventDefault();
    if (type === 'resume') setIsDraggingResume(false);
    if (type === 'jd') setIsDraggingJd(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (type === 'resume') setResumeFile(e.dataTransfer.files[0]);
      if (type === 'jd') setJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    if (e.target.files && e.target.files.length > 0) {
      if (type === 'resume') setResumeFile(e.target.files[0]);
      if (type === 'jd') setJdFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) return;
    
    setIsLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      
      // In the future, we can also send jdText or jdFile to the backend
      // formData.append("jd_text", jdInputMode === 'text' ? jdText : "");
      
      const response = await fetch("http://127.0.0.1:8000/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze resume");
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("An error occurred while connecting to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Analysis</h1>
          <p className="text-slate-600 mt-2">Upload your resume and the job description to get a detailed compatibility report.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resume Upload */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#363893] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Your Resume</h2>
            </div>
            
            <div 
              onClick={() => resumeInputRef.current?.click()}
              onDragOver={(e) => handleDragOver(e, 'resume')}
              onDragLeave={(e) => handleDragLeave(e, 'resume')}
              onDrop={(e) => handleDrop(e, 'resume')}
              className={`flex-1 border-2 border-dashed transition-colors rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer group min-h-[300px] relative ${
                isDraggingResume ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
              }`}
            >
              <input 
                type="file" 
                ref={resumeInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx" 
                onChange={(e) => handleFileSelect(e, 'resume')} 
              />
              
              {resumeFile ? (
                <div className="flex flex-col items-center text-center w-full">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                    className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors shadow-sm border border-slate-100"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                    <File className="w-8 h-8" />
                  </div>
                  <p className="text-slate-900 font-semibold">{resumeFile.name}</p>
                  <p className="text-slate-500 text-sm mt-1">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p className="text-indigo-600 text-sm mt-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to change file</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors shadow-sm border border-slate-100">
                    <Upload className={`w-6 h-6 transition-colors ${isDraggingResume ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                  </div>
                  <p className="text-slate-700 font-medium text-center">Click to upload or drag and drop</p>
                  <p className="text-slate-500 text-sm mt-2 text-center">PDF, DOCX up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* JD Upload */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Job Description</h2>
              </div>
              
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setJdInputMode('file')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${jdInputMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  File
                </button>
                <button 
                  onClick={() => setJdInputMode('text')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${jdInputMode === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Text
                </button>
              </div>
            </div>
            
            {jdInputMode === 'file' ? (
              <div 
                onClick={() => jdInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'jd')}
                onDragLeave={(e) => handleDragLeave(e, 'jd')}
                onDrop={(e) => handleDrop(e, 'jd')}
                className={`flex-1 border-2 border-dashed transition-colors rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer group min-h-[300px] relative ${
                  isDraggingJd ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={jdInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt" 
                  onChange={(e) => handleFileSelect(e, 'jd')} 
                />
                
                {jdFile ? (
                  <div className="flex flex-col items-center text-center w-full">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                      className="absolute top-4 right-4 p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors shadow-sm border border-slate-100"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                      <File className="w-8 h-8" />
                    </div>
                    <p className="text-slate-900 font-semibold">{jdFile.name}</p>
                    <p className="text-slate-500 text-sm mt-1">{(jdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-emerald-600 text-sm mt-4 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to change file</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-4 transition-colors shadow-sm border border-slate-100">
                      <Upload className={`w-6 h-6 transition-colors ${isDraggingJd ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                    </div>
                    <p className="text-slate-700 font-medium text-center">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm mt-2 text-center">PDF, DOCX, TXT up to 10MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-[300px]">
                <textarea 
                  className="w-full h-full min-h-[300px] flex-1 p-5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none resize-none transition-all placeholder:text-slate-400"
                  placeholder="Paste the job description text here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            className={`px-8 py-3.5 rounded-full font-medium transition-colors shadow-md text-lg flex items-center gap-2 ${
              (resumeFile && (jdInputMode === 'text' ? jdText.trim().length > 0 : jdFile) && !isLoading) 
                ? 'bg-[#363893] text-white hover:bg-[#23245c]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!resumeFile || (jdInputMode === 'text' ? jdText.trim().length === 0 : !jdFile) || isLoading}
            onClick={handleAnalyze}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              "Analyze Compatibility"
            )}
          </button>
        </div>
        
        {/* Render Backend Response Debug */}
        {result && (
          <div className="bg-slate-900 rounded-3xl p-8 mt-8 shadow-lg overflow-hidden relative">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <FileText className="w-5 h-5 text-emerald-400" />
                 Extracted Sections (Backend Result)
               </h3>
               <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-emerald-500/30">
                 Success
               </span>
            </div>
            <div className="overflow-auto max-h-[500px] custom-scrollbar">
              <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(result.sections, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
