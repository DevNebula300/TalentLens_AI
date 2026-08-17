"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto md:px-8 w-full">
      <div className="flex items-center gap-8">
        <Logo />
        <div className="hidden md:flex items-center gap-6">
          <Link 
            href="/analyze" 
            className={`text-sm font-medium transition-colors ${pathname === '/analyze' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            New Analysis
          </Link>
          <Link 
            href="/history" 
            className={`text-sm font-medium transition-colors ${pathname === '/history' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            History
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/analyze" className="text-sm font-medium bg-[#363893] text-white px-5 py-2.5 rounded-full hover:bg-[#23245c] transition-colors shadow-sm">
          Get Started
        </Link>
      </div>
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Shutter logo approximation */}
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#4244B6] group-hover:scale-105 transition-transform duration-300">
          <circle cx="50" cy="50" r="48" fill="currentColor" />
          <path d="M50 2L75 25" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M98 50L75 75" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 98L25 75" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M2 50L25 25" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 22L70 42" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M78 50L58 70" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M50 78L30 58" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M22 50L42 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="50" cy="50" r="28" fill="white" />
          {/* Inner T logo */}
          <rect x="35" y="38" width="30" height="4" fill="currentColor" rx="1" />
          <rect x="40" y="46" width="20" height="4" fill="currentColor" rx="1" />
          <rect x="44" y="54" width="12" height="4" fill="currentColor" rx="1" />
          <rect x="47" y="62" width="6" height="4" fill="currentColor" rx="1" />
        </svg>
      </div>
      <span className="text-[22px] font-bold text-[#1f205c] tracking-tight">TalentLens AI</span>
    </Link>
  );
}
