"use client";

import { FileText, Upload, Briefcase, File, X, History, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default function AnalyzePage() {
  const router = useRouter();
  const [resumeInputMode, setResumeInputMode] = useState<"file" | "existing">("file");
  const [jdInputMode, setJdInputMode] = useState<"file" | "text">("file");
  
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingJd, setIsDraggingJd] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumes, setExistingResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchResumes() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/resume/list`);
        if (response.ok) {
          const data = await response.json();
          setExistingResumes(data);
        }
      } catch (err) {
        console.error("Failed to fetch resumes", err);
      }
    }
    fetchResumes();
  }, []);

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
    if (resumeInputMode === 'file' && !resumeFile) return;
    if (resumeInputMode === 'existing' && !selectedResumeId) return;
    
    setIsLoading(true);
    setResult(null);
    try {
      let endpoint = `${API_BASE_URL}/api/resume/upload`;
      const formData = new FormData();

      if (resumeInputMode === 'existing' && selectedResumeId) {
        endpoint = `${API_BASE_URL}/api/resume/analyze-existing`;
      }
      
      if (resumeInputMode === 'file' && resumeFile) {
        formData.append("file", resumeFile);
      } else if (resumeInputMode === 'existing' && selectedResumeId) {
        formData.append("resume_id", selectedResumeId.toString());
        endpoint = "http://127.0.0.1:8000/api/resume/analyze-existing";
      }
      
      if (jdInputMode === 'text' && jdText.trim()) {
        formData.append("jd_text", jdText);
      } else if (jdInputMode === 'file' && jdFile) {
        formData.append("jd_file", jdFile);
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze resume");
      }
      
      const data = await response.json();
      
      if (data.analysis_id) {
        router.push(`/results/${data.analysis_id}`);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while connecting to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    const isResumeValid = resumeInputMode === 'file' ? !!resumeFile : !!selectedResumeId;
    const isJdValid = jdInputMode === 'file' ? !!jdFile : jdText.trim().length > 0;
    return isResumeValid && isJdValid && !isLoading;
  };

  return (
    <div className="flex-1 w-full bg-[#fcf8ff] min-h-screen py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Analysis</h1>
          <p className="text-slate-600 mt-2">Upload your resume and the job description to get a detailed compatibility report.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resume Selection */}
          <div className="bg-[#fcf8ff] rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#363893] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Your Resume</h2>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setResumeInputMode('file')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${resumeInputMode === 'file' ? 'bg-[#fcf8ff] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Upload
                </button>
                <button 
                  onClick={() => setResumeInputMode('existing')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${resumeInputMode === 'existing' ? 'bg-[#fcf8ff] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Existing
                </button>
              </div>
            </div>
            
            {resumeInputMode === 'file' ? (
              <div 
                onClick={() => resumeInputRef.current?.click()}
                onDragOver={(e) => handleDragOver(e, 'resume')}
                onDragLeave={(e) => handleDragLeave(e, 'resume')}
                onDrop={(e) => handleDrop(e, 'resume')}
                className={`flex-1 border-2 border-dashed transition-colors rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer group min-h-[250px] sm:min-h-[300px] relative ${
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
                      className="absolute top-4 right-4 p-2 bg-[#fcf8ff] hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors shadow-sm border border-slate-100"
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
                    <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-[#fcf8ff] flex items-center justify-center mb-4 transition-colors shadow-sm border border-slate-100">
                      <Upload className={`w-6 h-6 transition-colors ${isDraggingResume ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                    </div>
                    <p className="text-slate-700 font-medium text-center">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm mt-2 text-center">PDF, DOCX up to 10MB</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-[300px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                {existingResumes.length > 0 ? (
                  <div className="flex-1 overflow-y-auto p-2">
                    {existingResumes.map(resume => (
                      <div 
                        key={resume.id}
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={`flex items-center justify-between p-4 mb-2 rounded-xl cursor-pointer transition-all border ${
                          selectedResumeId === resume.id 
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                            : 'bg-[#fcf8ff] border-transparent hover:border-slate-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedResumeId === resume.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{resume.filename}</p>
                            <p className="text-xs text-slate-500">{new Date(resume.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {selectedResumeId === resume.id && (
                          <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <History className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium">No previous resumes found.</p>
                    <button 
                      onClick={() => setResumeInputMode('file')}
                      className="mt-4 text-[#363893] text-sm font-semibold hover:underline"
                    >
                      Upload a new resume instead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* JD Upload */}
          <div className="bg-[#fcf8ff] rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200 flex flex-col min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Job Description</h2>
              </div>
              
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setJdInputMode('file')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${jdInputMode === 'file' ? 'bg-[#fcf8ff] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  File
                </button>
                <button 
                  onClick={() => setJdInputMode('text')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${jdInputMode === 'text' ? 'bg-[#fcf8ff] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                className={`flex-1 border-2 border-dashed transition-colors rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer group min-h-[250px] sm:min-h-[300px] relative ${
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
                      className="absolute top-4 right-4 p-2 bg-[#fcf8ff] hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors shadow-sm border border-slate-100"
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
                    <div className="w-16 h-16 rounded-full bg-slate-50 group-hover:bg-[#fcf8ff] flex items-center justify-center mb-4 transition-colors shadow-sm border border-slate-100">
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
            className={`w-full sm:w-auto justify-center px-8 py-3.5 rounded-full font-medium transition-colors shadow-md text-lg flex items-center gap-2 ${
              isFormValid()
                ? 'bg-[#363893] text-white hover:bg-[#23245c]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            disabled={!isFormValid()}
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
      </div>
    </div>
  );
}
