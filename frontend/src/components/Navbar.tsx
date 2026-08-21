"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#fcf8ff] shadow-sm">
      <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto w-full">
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
        <div className="flex items-center gap-4">
          {pathname === '/' && (
            <Link href="/analyze" className="hidden sm:inline-flex text-sm font-medium bg-[#363893] text-white px-5 py-2.5 rounded-full hover:bg-[#23245c] transition-colors shadow-sm">
              Get Started
            </Link>
          )}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-[#fcf8ff] border-b border-slate-200 px-4 py-6 flex flex-col gap-5 shadow-lg md:hidden">
          <Link 
            href="/analyze" 
            onClick={() => setIsOpen(false)} 
            className={`text-base font-medium ${pathname === '/analyze' ? 'text-indigo-600' : 'text-slate-600'}`}
          >
            New Analysis
          </Link>
          <Link 
            href="/history" 
            onClick={() => setIsOpen(false)} 
            className={`text-base font-medium ${pathname === '/history' ? 'text-indigo-600' : 'text-slate-600'}`}
          >
            History
          </Link>
          {pathname === '/' && (
            <Link 
              href="/analyze" 
              onClick={() => setIsOpen(false)} 
              className="mt-2 text-sm font-medium bg-[#363893] text-white px-5 py-3 rounded-full text-center sm:hidden"
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center shrink-0">
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
      <span className="text-xl md:text-[22px] font-bold text-[#1f205c] tracking-tight whitespace-nowrap">TalentLens AI</span>
    </Link>
  );
}
