
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { AccessCode, TestResult, SeatMode, SeatAuditEntry, Course, Question, Checkpoint, VideoChapter } from '../types';

type Tab = 'COMPANIES' | 'DASHBOARD' | 'RESULTS' | 'TRAININGS';
type ViewMode = 'LIST' | 'DETAIL';
type DashboardRange = 7 | 30 | 90;

const AdminDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pageSize, setPageSize] = useState<number>(() => {
    const saved = localStorage.getItem('sh_admin_pagesize');
    return saved ? parseInt(saved) : 30;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>(30);
  
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newCodeData, setNewCodeData] = useState({ 
    companyName: '', 
    courseId: '',
    seatMode: 'UNLIMITED' as SeatMode, 
    seatAllowance: 5, 
    code: '' 
  });

  // Settings Form State
  const [editName, setEditName] = useState('');
  const [editMode, setEditMode] = useState<SeatMode>('UNLIMITED');
  const [editCourseId, setEditCourseId] = useState('');
  const [editAllowance, setEditAllowance] = useState(0);
  const [topUpValue, setTopUpValue] = useState(5);
  const [editExpiry, setEditExpiry] = useState('');

  // Course Edit State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editSection, setEditSection] = useState<'BASICS' | 'INTRO' | 'VIDEO' | 'QUIZ'>('BASICS');
  const [showVideoGuide, setShowVideoGuide] = useState(false);

  // Delete Safeguard State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Action successful.');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const freshCodes = apiService.getCodes();
    const freshResults = apiService.getResults();
    const freshCourses = apiService.getCourses();
    setCodes(freshCodes);
    setResults(freshResults);
    setCourses(freshCourses);

    if (selectedCompanyCode) {
      const company = freshCodes.find(c => c.code === selectedCompanyCode);
      if (company) {
        setEditName(company.companyName);
        setEditMode(company.seatMode);
        setEditCourseId(company.courseId);
        setEditAllowance(company.seatAllowance);
        setEditExpiry(company.expiresAt.split('T')[0]);
      }
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/?code=${code.toUpperCase()}`;
    navigator.clipboard.writeText(link);
    triggerToast("Invite link copied!");
  };

  const handleCopyMessage = (code: string) => {
    const link = `${window.location.origin}/?code=${code.toUpperCase()}`;
    const msg = `Health & Safety Online Training (ECK)\n\nLink: ${link}\n\nInstructions:\n1) Open the link\n2) Enter your name\n3) Watch the video and complete the short test\n\nTime required: ~25 minutes`;
    navigator.clipboard.writeText(msg);
    triggerToast("Invite message copied!");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyCode) return;
    const company = codes.find(c => c.code === selectedCompanyCode);
    if (!company) return;

    apiService.updateSettings(company.id, {
      companyName: editName,
      courseId: editCourseId,
      seatMode: editMode,
      seatAllowance: editAllowance,
      expiresAt: new Date(editExpiry).toISOString()
    });
    triggerToast("Settings updated.");
    refreshData();
  };

  const handleTopUp = () => {
    if (!selectedCompanyCode) return;
    const company = codes.find(c => c.code === selectedCompanyCode);
    if (!company) return;
    apiService.updateSettings(company.id, { seatAllowance: company.seatAllowance + topUpValue });
    setTopUpValue(5);
    triggerToast("Seats added.");
    refreshData();
  };

  const handleDeleteCompany = () => {
    if (!selectedCompanyCode) return;
    const company = codes.find(c => c.code === selectedCompanyCode);
    if (!company) return;
    apiService.deleteCompany(company.id);
    setShowDeleteModal(false);
    setViewMode('LIST');
    setSelectedCompanyCode(null);
    triggerToast("Company deleted.");
    refreshData();
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      apiService.saveCourse(editingCourse);
      setEditingCourse(null);
      triggerToast("Training published.");
      refreshData();
    }
  };

  const createNewCourse = () => {
    const newCourse: Course = {
      id: 'course-' + Math.random().toString(36).substr(2, 5),
      title: 'New Training Name',
      introText: 'Training introduction goes here...',
      videoUrl: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      videoChapters: [{ title: 'Intro', startTime: 0 }],
      checkpoints: [],
      questions: []
    };
    setEditingCourse(newCourse);
    setEditSection('BASICS');
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    localStorage.setItem('sh_admin_pagesize', size.toString());
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    apiService.createCode(newCodeData);
    setShowCodeModal(false);
    setNewCodeData({ companyName: '', courseId: '', seatMode: 'UNLIMITED', seatAllowance: 5, code: '' });
    triggerToast("Account created.");
    refreshData();
  };

  const exportCSV = (data: TestResult[], filename: string) => {
    const headers = ["Completion ID", "Training", "Learner", "Company", "Status", "Date"];
    const rows = data.map(r => [
      r.completionId,
      r.courseName,
      `${r.learner.firstName} ${r.learner.lastName}`,
      r.learner.companyName,
      r.passed ? "Pass" : "Fail",
      new Date(r.completedAt).toLocaleDateString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const dashboardStats = useMemo(() => {
    const dailyTrend = Array.from({ length: dashboardRange }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (dashboardRange - 1 - i));
      const dateStr = d.toLocaleDateString();
      const count = results.filter(r => r.passed && new Date(r.completedAt).toLocaleDateString() === dateStr).length;
      return { 
        label: dashboardRange === 7 
          ? d.toLocaleDateString(undefined, { weekday: 'short' }) 
          : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), 
        value: count 
      };
    });

    return {
      totalCompanies: codes.length,
      totalCompletions: results.filter(r => r.passed).length,
      recentCompletions: results.filter(r => r.passed && new Date(r.completedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      dailyTrend,
      recentActivity: results.slice(0, 10)
    };
  }, [codes, results, dashboardRange]);

  const filteredCompanies = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const base = codes.filter(c => c.companyName.toLowerCase().includes(s) || c.code.toLowerCase().includes(s));
    const start = (currentPage - 1) * pageSize;
    return { total: base.length, data: base.slice(start, start + pageSize) };
  }, [codes, searchTerm, currentPage, pageSize]);

  const filteredResults = useMemo(() => {
    const s = searchTerm.toLowerCase();
    const base = results.filter(r => 
      r.learner.firstName.toLowerCase().includes(s) || 
      r.learner.lastName.toLowerCase().includes(s) || 
      r.learner.companyName.toLowerCase().includes(s) || 
      r.courseName.toLowerCase().includes(s)
    ).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    const start = (currentPage - 1) * pageSize;
    return { total: base.length, allFiltered: base, data: base.slice(start, start + pageSize) };
  }, [results, searchTerm, currentPage, pageSize]);

  const PaginationControls = ({ total }: { total: number }) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-slate-100 px-6 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows per page</label>
          <div className="flex bg-slate-200/50 rounded-lg p-1">
            {[10, 30, 50].map(size => (
              <button key={size} type="button" onClick={() => handlePageSizeChange(size)} className={`px-3 py-1 rounded text-[10px] font-black transition-all ${pageSize === size ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>{size}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={currentPage === 1} type="button" onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-2 border rounded-xl bg-white disabled:opacity-30 font-black text-xs">Previous</button>
            <button disabled={currentPage >= totalPages} type="button" onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-2 border rounded-xl bg-white disabled:opacity-30 font-black text-xs">Next</button>
          </div>
        </div>
      </div>
    );
  };

  const selectedCompany = codes.find(c => c.code === selectedCompanyCode);

  if (viewMode === 'DETAIL' && selectedCompany) {
    const compResults = results.filter(r => r.learner.accessCode.toUpperCase() === selectedCompany.code.toUpperCase())
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    const start = (currentPage - 1) * pageSize;
    const paginatedCompResults = compResults.slice(start, start + pageSize);

    return (
      <div className="bg-[#F8FAFC] min-h-screen">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => { setViewMode('LIST'); setSelectedCompanyCode(null); }} className="text-slate-400 hover:text-blue-900 font-bold text-sm flex items-center gap-2">← Back</button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <h1 className="text-lg font-black text-blue-900 uppercase tracking-tight">{selectedCompany.companyName}</h1>
          </div>
          <button onClick={() => exportCSV(compResults, `Results_${selectedCompany.companyName}`)} className="px-6 py-2 bg-blue-900 text-white text-xs font-black rounded-lg uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all">Export Company Results</button>
        </header>

        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {/* Onboarding & Invite Link Card */}
              <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm shadow-blue-900/5 space-y-6">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Onboarding & Invite</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Invite Link</label>
                    <div className="flex gap-2">
                      <input readOnly value={`${window.location.origin}/?code=${selectedCompany.code}`} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono font-bold truncate" />
                      <button onClick={() => handleCopyLink(selectedCompany.code)} className="px-3 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl font-black text-[10px] hover:bg-blue-100 transition-colors">Copy</button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => handleCopyMessage(selectedCompany.code)} className="w-full py-3 bg-blue-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all flex items-center justify-center gap-2">
                      <span>📋 Copy Invite Message</span>
                    </button>
                    <p className="mt-2 text-[9px] text-slate-400 font-medium leading-relaxed">Copies link + simple step-by-step instructions for employees to your clipboard.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Settings</h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificate / Legal Name</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Training</label>
                    <select value={editCourseId} onChange={e => setEditCourseId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seat Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setEditMode('UNLIMITED')} className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'UNLIMITED' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-400'}`}>Unlimited</button>
                      <button type="button" onClick={() => setEditMode('LIMITED')} className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${editMode === 'LIMITED' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-400'}`}>Limited</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiration Date</label>
                    <input type="date" value={editExpiry} onChange={e => setEditExpiry(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-blue-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all">Save Changes</button>
                </form>
                <div className="pt-6 border-t border-slate-100">
                  <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 border border-red-200 text-red-600 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-50">Delete Company</button>
                </div>
              </div>

              {editMode === 'LIMITED' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seat Management</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black text-slate-400 uppercase">Limit</p><p className="text-lg font-black text-blue-900">{selectedCompany.seatAllowance}</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black text-slate-400 uppercase">Used</p><p className="text-lg font-black text-blue-900">{selectedCompany.seatsUsed}</p></div>
                    <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] font-black text-slate-400 uppercase">Left</p><p className="text-lg font-black text-green-600">{Math.max(0, selectedCompany.seatAllowance - selectedCompany.seatsUsed)}</p></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Top-up Seats</label>
                    <div className="flex gap-2">
                      <input type="number" value={topUpValue} onChange={e => setTopUpValue(parseInt(e.target.value))} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" min="1" />
                      <button onClick={handleTopUp} className="px-4 py-3 bg-green-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-green-700 transition-all">Top-Up</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Company Results</h3><span className="text-[10px] font-black text-slate-400">{compResults.length} records</span></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr><th className="p-5">Learner</th><th className="p-5">Status</th><th className="p-5">Score</th><th className="p-5 text-right">Date</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedCompResults.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="p-5 font-bold text-slate-700">{r.learner.firstName} {r.learner.lastName}</td>
                          <td className="p-5"><span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${r.passed ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{r.passed ? 'Pass' : 'Fail'}</span></td>
                          <td className="p-5 font-bold text-blue-900">{r.score}%</td>
                          <td className="p-5 text-right text-slate-500 font-medium">{new Date(r.completedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls total={compResults.length} />
              </div>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl p-10 space-y-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black text-blue-900 tracking-tight">Delete Company?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">This action is permanent. All learner records for "{selectedCompany.companyName}" will be erased.</p>
                <input type="text" value={deleteConfirmationName} onChange={(e) => setDeleteConfirmationName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-red-100 rounded-2xl outline-none font-bold text-center" placeholder="Type company name to confirm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-black text-slate-500 uppercase tracking-widest text-[11px]">Cancel</button>
                <button disabled={deleteConfirmationName !== selectedCompany.companyName} onClick={handleDeleteCompany} className="flex-1 py-4 bg-red-600 text-white font-black rounded-xl shadow-lg disabled:bg-slate-200 uppercase tracking-widest text-[11px]">Delete Permanently</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {showSuccessToast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-blue-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-4">{toastMessage}</div>}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-10">
          <h1 className="text-lg font-black text-blue-900 tracking-tighter uppercase">SafetyHub Admin</h1>
          <nav className="hidden lg:flex gap-2">
            <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-blue-900 text-white' : 'text-slate-400'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('COMPANIES')} className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${activeTab === 'COMPANIES' ? 'bg-blue-900 text-white' : 'text-slate-400'}`}>Companies</button>
            <button onClick={() => setActiveTab('TRAININGS')} className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${activeTab === 'TRAININGS' ? 'bg-blue-900 text-white' : 'text-slate-400'}`}>Trainings</button>
            <button onClick={() => setActiveTab('RESULTS')} className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${activeTab === 'RESULTS' ? 'bg-blue-900 text-white' : 'text-slate-400'}`}>Results</button>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="hidden sm:block pl-4 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white w-48 font-medium" />
          <button onClick={onExit} className="text-[10px] font-black text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest">Logout</button>
        </div>
      </header>
      
      {/* Mobile Nav */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex justify-around">
        <button onClick={() => setActiveTab('DASHBOARD')} className={`p-2 rounded-lg ${activeTab === 'DASHBOARD' ? 'text-blue-900' : 'text-slate-400'}`}>
          <div className="text-[10px] font-black uppercase tracking-tighter">Dash</div>
        </button>
        <button onClick={() => setActiveTab('COMPANIES')} className={`p-2 rounded-lg ${activeTab === 'COMPANIES' ? 'text-blue-900' : 'text-slate-400'}`}>
          <div className="text-[10px] font-black uppercase tracking-tighter">Clients</div>
        </button>
        <button onClick={() => setActiveTab('TRAININGS')} className={`p-2 rounded-lg ${activeTab === 'TRAININGS' ? 'text-blue-900' : 'text-slate-400'}`}>
          <div className="text-[10px] font-black uppercase tracking-tighter">Courses</div>
        </button>
        <button onClick={() => setActiveTab('RESULTS')} className={`p-2 rounded-lg ${activeTab === 'RESULTS' ? 'text-blue-900' : 'text-slate-400'}`}>
          <div className="text-[10px] font-black uppercase tracking-tighter">Data</div>
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
        {activeTab === 'DASHBOARD' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Total Companies', val: dashboardStats.totalCompanies },
                { label: 'Total Completions', val: dashboardStats.totalCompletions },
                { label: 'Completions (30d)', val: dashboardStats.recentCompletions },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-blue-900">{stat.val}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Recent Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[400px]">
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {dashboardStats.recentActivity.map(r => (
                      <tr key={r.id}>
                        <td className="py-4 font-black text-blue-900">{r.learner.firstName} {r.learner.lastName}</td>
                        <td className="py-4 text-slate-500">{r.learner.companyName}</td>
                        <td className="py-4 text-slate-400">{r.courseName}</td>
                        <td className="py-4 text-right">{new Date(r.completedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'COMPANIES' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Client Companies</h2>
              <button onClick={() => { setNewCodeData({...newCodeData, courseId: courses[0]?.id || ''}); setShowCodeModal(true); }} className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all">Register New Client</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="p-5">Company Name</th><th className="p-5">Assigned Training</th><th className="p-5">Code</th><th className="p-5">Invite Link</th><th className="p-5 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {filteredCompanies.data.map(c => (
                      <tr key={c.id}>
                        <td className="p-5 font-black text-blue-900">{c.companyName}</td>
                        <td className="p-5 text-slate-500">{courses.find(crs => crs.id === c.courseId)?.title || 'N/A'}</td>
                        <td className="p-5"><code className="bg-slate-100 px-2 py-1 rounded text-xs font-black">{c.code}</code></td>
                        <td className="p-5">
                          <button onClick={() => handleCopyLink(c.code)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-900 uppercase">
                            <span>🔗 Copy Link</span>
                          </button>
                        </td>
                        <td className="p-5 text-right"><button onClick={() => { setSelectedCompanyCode(c.code); setViewMode('DETAIL'); refreshData(); }} className="px-4 py-2 bg-slate-100 text-[10px] font-black uppercase rounded-xl hover:bg-blue-900 hover:text-white transition-all">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls total={filteredCompanies.total} />
            </div>
          </div>
        ) : activeTab === 'TRAININGS' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Available Trainings</h2>
              <button onClick={createNewCourse} className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all">Add New Training</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-black text-blue-900 leading-tight">{course.title}</h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{course.isActive ? 'Active' : 'Disabled'}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">{course.introText}</p>
                  <div className="pt-4 border-t flex gap-2">
                    <button onClick={() => setEditingCourse({...course})} className="flex-1 py-3 bg-slate-100 text-[10px] font-black uppercase rounded-xl hover:bg-blue-900 hover:text-white transition-all">Edit Training</button>
                    <button 
                      onClick={() => {
                        const updated = {...course, isActive: !course.isActive};
                        apiService.saveCourse(updated);
                        triggerToast(updated.isActive ? "Training enabled." : "Training disabled.");
                        refreshData();
                      }}
                      className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl border ${course.isActive ? 'border-red-100 text-red-600' : 'border-green-100 text-green-600'}`}
                    >
                      {course.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {editingCourse && (
              <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <form onSubmit={handleSaveCourse} className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
                  <header className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight">Course Content Editor</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training ID: {editingCourse.id}</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                      {(['BASICS', 'INTRO', 'VIDEO', 'QUIZ'] as const).map(sec => (
                        <button 
                          key={sec}
                          type="button" 
                          onClick={() => setEditSection(sec)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${editSection === sec ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
                    {editSection === 'BASICS' && (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Name</label>
                          <input required value={editingCourse.title} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-900 outline-none" placeholder="e.g. Safety at Work v2" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</label>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setEditingCourse({...editingCourse, isActive: !editingCourse.isActive})} className={`w-14 h-8 rounded-full transition-all relative ${editingCourse.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${editingCourse.isActive ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className="text-xs font-bold text-slate-600">{editingCourse.isActive ? 'Live - Available to Learners' : 'Disabled - Hidden from Portal'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {editSection === 'INTRO' && (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Introduction Body Text</label>
                          <p className="text-[9px] text-slate-400 mb-2">Markdown is supported. Keep language simple and practical for workers.</p>
                          <textarea required rows={12} value={editingCourse.introText} onChange={e => setEditingCourse({...editingCourse, introText: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm leading-relaxed focus:border-blue-900 outline-none" placeholder="Enter training introduction..." />
                        </div>
                      </div>
                    )}

                    {editSection === 'VIDEO' && (
                      <div className="space-y-8 animate-in fade-in">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video URL (Vimeo/S3/CDN/Direct MP4)</label>
                            <button type="button" onClick={() => setShowVideoGuide(!showVideoGuide)} className="text-[10px] font-black text-blue-900 uppercase hover:underline">
                              {showVideoGuide ? 'Close Production Guide' : 'Open Production Guide'}
                            </button>
                          </div>
                          <input required value={editingCourse.videoUrl} onChange={e => setEditingCourse({...editingCourse, videoUrl: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-blue-900 outline-none" placeholder="https://..." />
                          
                          {/* Passive Validation Hints */}
                          {editingCourse.videoUrl && (
                            <div className="flex gap-2 mt-2">
                              {editingCourse.videoUrl.includes('.mp4') && (
                                <span className="text-[9px] font-black bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">Direct MP4 Detected (Best Performance)</span>
                              )}
                              {editingCourse.videoUrl.includes('vimeo.com') && (
                                <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">Vimeo Source Detected</span>
                              )}
                              {editingCourse.videoUrl.includes('drive.google.com') && (
                                <span className="text-[9px] font-black bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">Google Drive Source (Potential Buffering)</span>
                              )}
                            </div>
                          )}

                          {showVideoGuide && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4 space-y-6 animate-in slide-in-from-top-2">
                              <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest border-b border-slate-200 pb-2">Training Video Production Guide</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Technical Standard</p>
                                    <ul className="space-y-1 text-xs text-slate-600 font-medium">
                                      <li>• <span className="font-bold">Resolution:</span> 1280x720 (720p) @ 25/30 fps</li>
                                      <li>• <span className="font-bold">Codec:</span> H.264 (AVC) + AAC Audio</li>
                                      <li>• <span className="font-bold">Container:</span> MP4 (.mp4)</li>
                                      <li>• <span className="font-bold">Bitrate:</span> 2.5 Mbps (Target)</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Export Preset Example</p>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-[10px] font-mono leading-relaxed">
                                      <p className="text-blue-900 font-bold">Premiere / FCPX / DaVinci:</p>
                                      <p>Format: H.264</p>
                                      <p>Preset: High Quality 720p</p>
                                      <p>Target Bitrate: 2.5 Mbps</p>
                                      <p>Keyframes: Every 2 Seconds</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Visual Best Practices</p>
                                    <ul className="space-y-1 text-xs text-slate-600 font-medium">
                                      <li>• <span className="font-bold">Large Text:</span> Overlays must be readable on mobile phones.</li>
                                      <li>• <span className="font-bold">Contrast:</span> Use high-contrast colors for safety warnings.</li>
                                      <li>• <span className="font-bold">Safe Areas:</span> Keep key info away from video edges.</li>
                                      <li>• <span className="font-bold">Audio:</span> -14 LUFS to -16 LUFS (Normalized).</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">File Size Guidance</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                                      Aim for <span className="text-blue-900 font-bold">300–600 MB</span> for a 20-30 minute training. Avoid files over 1GB to prevent student dropout on metered mobile data.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interactive Video Checkpoints</label>
                            <button type="button" onClick={() => setEditingCourse({...editingCourse, checkpoints: [...editingCourse.checkpoints, { time: 30, question: 'New Question?', options: ['Yes', 'No'], correctIndex: 0 }]})} className="text-[10px] font-black text-blue-900 uppercase">+ Add Checkpoint</button>
                          </div>
                          <div className="space-y-3">
                            {editingCourse.checkpoints.map((cp, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                  <div className="w-full sm:w-24 shrink-0 space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Time (s)</label>
                                    <input type="number" value={cp.time} onChange={e => {
                                      const newCp = [...editingCourse.checkpoints];
                                      newCp[idx].time = parseInt(e.target.value);
                                      setEditingCourse({...editingCourse, checkpoints: newCp});
                                    }} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Question</label>
                                    <input value={cp.question} onChange={e => {
                                      const newCp = [...editingCourse.checkpoints];
                                      newCp[idx].question = e.target.value;
                                      setEditingCourse({...editingCourse, checkpoints: newCp});
                                    }} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" />
                                  </div>
                                  <button type="button" onClick={() => {
                                    const newCp = editingCourse.checkpoints.filter((_, i) => i !== idx);
                                    setEditingCourse({...editingCourse, checkpoints: newCp});
                                  }} className="sm:pt-6 text-red-500 hover:text-red-700 font-bold text-xs uppercase self-end">Remove</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {editSection === 'QUIZ' && (
                      <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-end">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Assessment Questions</label>
                          <button type="button" onClick={() => setEditingCourse({...editingCourse, questions: [...editingCourse.questions, { id: Date.now(), text: 'New Question?', options: ['Option 1', 'Option 2'], correctIndex: 0, type: 'multiple-choice' }]})} className="text-[10px] font-black text-blue-900 uppercase">+ Add Question</button>
                        </div>
                        <div className="space-y-4">
                          {editingCourse.questions.map((q, idx) => (
                            <div key={q.id} className="p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                              <div className="flex justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Question {idx + 1}</span>
                                <button type="button" onClick={() => {
                                  const newQ = editingCourse.questions.filter((_, i) => i !== idx);
                                  setEditingCourse({...editingCourse, questions: newQ});
                                }} className="text-red-500 text-xs font-bold uppercase tracking-widest">Remove</button>
                              </div>
                              <textarea value={q.text} onChange={e => {
                                const newQ = [...editingCourse.questions];
                                newQ[idx].text = e.target.value;
                                setEditingCourse({...editingCourse, questions: newQ});
                              }} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-900" rows={2} placeholder="Question text..." />
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2">
                                    <input value={opt} onChange={e => {
                                      const newQ = [...editingCourse.questions];
                                      newQ[idx].options[optIdx] = e.target.value;
                                      setEditingCourse({...editingCourse, questions: newQ});
                                    }} className={`flex-1 p-2 bg-white border rounded-lg text-xs font-medium ${q.correctIndex === optIdx ? 'border-green-500 ring-1 ring-green-500' : 'border-slate-200'}`} />
                                    <button type="button" onClick={() => {
                                      const newQ = [...editingCourse.questions];
                                      newQ[idx].correctIndex = optIdx;
                                      setEditingCourse({...editingCourse, questions: newQ});
                                    }} className={`p-2 rounded-lg text-[10px] font-black transition-all ${q.correctIndex === optIdx ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>✓</button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => {
                                  const newQ = [...editingCourse.questions];
                                  newQ[idx].options.push('New Option');
                                  setEditingCourse({...editingCourse, questions: newQ});
                                }} className="p-2 border border-dashed border-slate-300 rounded-lg text-[10px] font-black text-slate-400 uppercase">+ Add Option</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <footer className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 text-yellow-600">
                      <span className="text-xl">⚠️</span>
                      <p className="text-[9px] md:text-[10px] font-bold leading-tight uppercase tracking-widest max-w-xs">Publishing will apply changes to all NEW sessions. Ongoing sessions are unaffected.</p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3">
                      <button type="button" onClick={() => setEditingCourse(null)} className="flex-1 sm:flex-none px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px] hover:bg-slate-100 rounded-xl">Discard</button>
                      <button type="submit" className="flex-1 sm:flex-none px-8 py-4 bg-blue-900 text-white font-black rounded-xl shadow-lg hover:bg-yellow-400 hover:text-blue-900 uppercase tracking-widest text-[10px] transition-all">Publish Content</button>
                    </div>
                  </footer>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Global Results</h2>
              <button onClick={() => exportCSV(results, 'Global_Results')} className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white text-xs font-black rounded-xl uppercase tracking-widest hover:bg-yellow-400 hover:text-blue-900 transition-all">Export All CSV</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr><th className="p-5">Training</th><th className="p-5">Employer</th><th className="p-5">Learner</th><th className="p-5">Status</th><th className="p-5 text-right">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {filteredResults.data.map(r => (
                      <tr key={r.id}>
                        <td className="p-5 font-black text-blue-950">{r.courseName}</td>
                        <td className="p-5 text-slate-500">{r.learner.companyName}</td>
                        <td className="p-5 text-slate-800">{r.learner.firstName} {r.learner.lastName}</td>
                        <td className="p-5"><span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${r.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{r.passed ? 'Pass' : 'Fail'}</span></td>
                        <td className="p-5 text-right text-slate-400">{new Date(r.completedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls total={filteredResults.total} />
            </div>
          </div>
        )}
      </div>

      {showCodeModal && (
        <div className="fixed inset-0 bg-blue-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <form onSubmit={handleCreateCode} className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl p-8 md:p-10 space-y-6">
            <h3 className="text-2xl font-black text-blue-900 text-center">Register Client</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Training</label>
                <select required value={newCodeData.courseId} onChange={e => setNewCodeData({...newCodeData, courseId: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold">
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                <input required value={newCodeData.companyName} onChange={e => setNewCodeData({...newCodeData, companyName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Code</label>
                <input value={newCodeData.code} onChange={e => setNewCodeData({...newCodeData, code: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono font-black" placeholder="AUTO-GEN" />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowCodeModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-blue-900 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/10 transition-all hover:bg-blue-800">Create Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
