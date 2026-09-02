// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/app//lib/firebase'; // Adjust if your path is different
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Search, X, Calendar, Phone, Briefcase, 
  Paperclip, User, LayoutList, ShieldAlert, FileText
} from 'lucide-react';
import Link from 'next/link';

// TypeScript interface for our Firebase data
interface Submission {
  id: string;
  roleTitle: string;
  submitterName: string;
  submitterPhone: string;
  submitterJobTitle: string;
  answers: Record<string, string>;
  missingRequirements: string;
  hasAttachments: boolean;
  submittedAt: string;
  answeredCount: number;
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Fetch all submissions from Firebase on page load
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(collection(db, 'hospital_requirements'), orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Submission[];
        
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // Filter the list based on the search input
  const filteredSubmissions = submissions.filter(sub => 
    sub.submitterName.toLowerCase().includes(search.toLowerCase()) ||
    sub.roleTitle.toLowerCase().includes(search.toLowerCase()) ||
    sub.submitterJobTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen p-6 md:p-12 relative overflow-hidden text-white">
      {/* Premium Background Effects */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight mb-2">
              Requirements Dashboard
            </h1>
            <p className="text-gray-400 text-sm md:text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Secure Admin View — Review all department workflow submissions
            </p>
          </div>
          
          <Link href="/">
            <button className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 rounded-xl text-sm font-medium transition-all flex items-center shadow-lg">
              <LayoutList className="w-4 h-4 mr-2" />
              View Public Form
            </button>
          </Link>
        </div>

        {/* Search & Stats Bar */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-black/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 focus:bg-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="px-5 py-2 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 shadow-inner">
              Total Submissions: {submissions.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-5 font-semibold">Submitter Details</th>
                  <th className="p-5 font-semibold">Department Form</th>
                  <th className="p-5 font-semibold text-center">Questions Answered</th>
                  <th className="p-5 font-semibold">Date Submitted</th>
                  <th className="p-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">Loading secure data from Firebase...</p>
                    </td>
                  </tr>
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p>No submissions found matching your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={sub.id} 
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <td className="p-5">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" /> {sub.submitterName}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 pl-6">{sub.submitterJobTitle}</div>
                      </td>
                      <td className="p-5 font-medium text-indigo-300">
                        {sub.roleTitle}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          sub.answeredCount > 5 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                          'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {sub.answeredCount} answered
                        </span>
                      </td>
                      <td className="p-5 text-sm text-gray-400">
                        {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all opacity-50 group-hover:opacity-100 shadow-lg shadow-indigo-900/20"
                        >
                          Review Full Details
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* DETAILED VIEW MODAL */}
      {/* ========================================= */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-5xl max-h-[90vh] bg-[#0B1120] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/80"
            >
              
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-start bg-white/5">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">
                    {selectedSubmission.roleTitle} Submission
                  </h2>
                  <p className="text-sm text-gray-400 flex items-center gap-3">
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5"/> {new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-full transition-all text-gray-400 group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow bg-gradient-to-b from-transparent to-black/20">
                
                {/* 3 Grid Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:border-indigo-500/30 transition-colors">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Briefcase className="w-6 h-6"/></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Submitter</p>
                      <p className="text-base font-bold text-white">{selectedSubmission.submitterName}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{selectedSubmission.submitterJobTitle}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:border-green-500/30 transition-colors">
                    <div className="p-3 bg-green-500/20 rounded-xl text-green-400"><Phone className="w-6 h-6"/></div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Contact Details</p>
                      <p className="text-base font-bold text-white">{selectedSubmission.submitterPhone}</p>
                    </div>
                  </div>

                  {selectedSubmission.hasAttachments ? (
                    <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/30 p-5 rounded-2xl flex items-start gap-4 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                      <div className="p-3 bg-indigo-500/30 rounded-xl text-indigo-300"><Paperclip className="w-6 h-6"/></div>
                      <div>
                        <p className="text-xs text-indigo-300/70 uppercase font-semibold tracking-wider mb-1">Attachments</p>
                        <p className="text-sm font-medium text-indigo-200">User has physical/Excel forms available for review.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 opacity-50">
                      <div className="p-3 bg-white/5 rounded-xl text-gray-500"><Paperclip className="w-6 h-6"/></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Attachments</p>
                        <p className="text-sm font-medium text-gray-400">No external forms noted.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* The Q&A Section */}
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <LayoutList className="w-5 h-5 mr-3 text-indigo-400" />
                  Answered Questions ({selectedSubmission.answeredCount})
                </h3>
                
                <div className="space-y-5">
                  {Object.entries(selectedSubmission.answers).map(([question, answer], idx) => {
                    // Only render questions they actually typed an answer for
                    if (!answer.trim()) return null; 
                    
                    return (
                      <div key={idx} className="bg-black/30 border border-white/5 p-6 rounded-2xl hover:bg-black/50 transition-colors">
                        <p className="text-sm font-semibold text-indigo-300 mb-3 leading-relaxed">{question}</p>
                        <p className="text-gray-200 whitespace-pre-wrap text-base leading-relaxed">{answer}</p>
                      </div>
                    )
                  })}
                  
                  {/* Empty state if they somehow submitted 0 answers but hit the missing requirements block */}
                  {selectedSubmission.answeredCount === 0 && (
                    <div className="p-6 bg-white/5 rounded-2xl text-center text-gray-400 italic">
                      This user skipped all standard questions.
                    </div>
                  )}
                </div>

                {/* Missing Requirements Section (Only shows if they typed something here) */}
                {selectedSubmission.missingRequirements && (
                  <div className="mt-10">
                    <h3 className="text-xl font-bold text-orange-400 mb-6 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-3" />
                      Additional / Missing Notes
                    </h3>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl shadow-inner">
                      <p className="text-orange-100 whitespace-pre-wrap text-base leading-relaxed">
                        {selectedSubmission.missingRequirements}
                      </p>
                    </div>
                  </div>
                )}

              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 bg-black/40 text-right">
                 <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}