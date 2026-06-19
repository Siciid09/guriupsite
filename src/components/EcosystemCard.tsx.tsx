import React from 'react';

interface EcosystemCardProps {
  title: string;
  role: string;
  description: string;
  techStack: string[];
}

export default function EcosystemCard({ title, role, description, techStack }: EcosystemCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-8 backdrop-blur-xl transition-all duration-500 hover:bg-black/60 hover:border-cyan-500/50 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(6,182,212,0.15)]">
      
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-500 rounded-3xl -z-10" />

      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
        <svg className="w-6 h-6 text-neutral-500 group-hover:text-cyan-400 transition-colors duration-300 transform group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
      
      <p className="text-cyan-400 text-xs font-bold mb-4 uppercase tracking-widest">{role}</p>
      <p className="text-neutral-400 text-sm leading-relaxed mb-6">{description}</p>
      
      <div className="flex flex-wrap gap-2 mt-auto">
        {techStack.map((tech) => (
          <span key={tech} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-neutral-300">
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
}