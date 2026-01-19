import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Bot, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2,
  Clock,
  Menu,
  Activity,
  Box,
  Layers,
  Truck,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { ProductionJob, Resource, JobStatus, Priority, ChatMessage, WeeklyStats, MaterialItem, DispatchedPart } from './types';
import { analyzeProductionData } from './services/geminiService';
import { StatCard } from './components/StatCard';
import { JobModal } from './components/JobModal';
import { MaterialModal } from './components/MaterialModal';
import { DispatchModal } from './components/DispatchModal';

// Mock Data (Used for initial fallback only)
const MOCK_RESOURCES: Resource[] = [
  { id: 'r1', name: 'HP Jet Fusion 5200 #1', type: 'Printer', efficiency: 94, status: 'Printing', temperature: 175, materialLevel: 45 },
  { id: 'r2', name: 'HP Jet Fusion 5200 #2', type: 'Printer', efficiency: 98, status: 'Printing', temperature: 172, materialLevel: 80 },
  { id: 'r3', name: 'Cooling Unit A', type: 'Cooling Station', efficiency: 100, status: 'Cooling', temperature: 80 },
  { id: 'r4', name: 'Cooling Unit B', type: 'Cooling Station', efficiency: 100, status: 'Idle', temperature: 25 },
  { id: 'r5', name: 'Unpacking Station', type: 'Post-Processing', efficiency: 85, status: 'Processing' },
  { id: 'r6', name: 'Dyeing Mansion', type: 'Post-Processing', efficiency: 92, status: 'Active' },
];

const MOCK_JOBS: ProductionJob[] = [
  { 
    id: 'j1', 
    name: 'Batch 204', 
    partName: 'Mounting Brackets',
    client: 'Tesla', 
    quoteId: 'Q-2023-889',
    poDate: '2023-10-20',
    poQuantity: 1500,
    startDate: '2023-10-25', 
    endDate: '2023-10-26', 
    material: 'PA12',
    progress: 65, 
    status: JobStatus.FirstPaint, 
    priority: Priority.High, 
    nestingDensity: 12.5,
    notes: 'Requires smoothing'
  },
  { 
    id: 'j2', 
    name: 'Batch 205', 
    partName: 'Hydraulic Connectors',
    client: 'Boston Dynamics', 
    quoteId: 'Q-2023-892',
    poDate: '2023-10-21',
    poQuantity: 200,
    startDate: '2023-10-26', 
    endDate: '2023-10-27', 
    material: 'PA12 GB',
    progress: 15, 
    status: JobStatus.Primer, 
    priority: Priority.Critical, 
    nestingDensity: 14.2 
  },
  { 
    id: 'j3', 
    name: 'Proto Batch', 
    partName: 'Drone Arms v2',
    client: 'Skydio', 
    quoteId: 'Q-2023-905',
    poDate: '2023-10-24',
    poQuantity: 50,
    startDate: '2023-10-27', 
    endDate: '2023-10-28', 
    material: 'PA11',
    progress: 0, 
    status: JobStatus.OnHold, 
    priority: Priority.Medium, 
    nestingDensity: 8.0,
    onHoldHistory: [{ startDate: '2023-10-28' }]
  },
  { 
    id: 'j4', 
    name: 'Batch 203', 
    partName: 'Internal Jigs',
    client: 'Internal', 
    quoteId: 'N/A',
    poDate: '2023-10-20',
    poQuantity: 12,
    startDate: '2023-10-25', 
    endDate: '2023-10-26', 
    material: 'PA12',
    progress: 80, 
    status: JobStatus.FinalPaint, 
    priority: Priority.Medium, 
    nestingDensity: 11.0 
  },
  { 
    id: 'j5', 
    name: 'Order #4425', 
    partName: 'Sensor Housings',
    client: 'Rivian', 
    quoteId: 'Q-2023-850',
    poDate: '2023-10-18',
    poQuantity: 3000,
    startDate: '2023-10-28', 
    endDate: '2023-11-01', 
    material: 'PA12',
    progress: 0, 
    status: JobStatus.QC, 
    priority: Priority.High, 
    notes: 'Awaiting revised CAD'
  },
];

const INITIAL_MATERIALS: MaterialItem[] = [
  { id: 'm1', name: 'PA12 Fresh Powder', value: '240 kg / 400 kg', type: 'level', percentage: 60 },
  { id: 'm2', name: 'PA12 Recycled', value: '850 kg (Ready)', type: 'level', percentage: 85 },
  { id: 'm3', name: 'Fusing Agent', value: 'Good', type: 'status', statusColor: 'emerald' },
  { id: 'm4', name: 'Detailing Agent', value: 'Good', type: 'status', statusColor: 'emerald' },
  { id: 'm5', name: 'Cleaning Rolls', value: 'Low', type: 'status', statusColor: 'amber' },
];

const INITIAL_DISPATCHED: DispatchedPart[] = [
  { id: 'd1', batchName: 'Batch 201', client: 'Tesla', quantity: 420, date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] }, 
  { id: 'd2', batchName: 'Batch 202', client: 'Ford', quantity: 510, date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0] }, 
  { id: 'd3', batchName: 'Batch 203', client: 'Rivian', quantity: 380, date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0] }, 
  { id: 'd4', batchName: 'Batch 200', client: 'SpaceX', quantity: 200, date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0] }, 
];

type View = 'dashboard' | 'planner' | 'dispatched' | 'ai-assistant';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Initialize state from LocalStorage or Fallback to Mock Data
  const [jobs, setJobs] = useState<ProductionJob[]>(() => {
    const saved = localStorage.getItem('proplan_jobs');
    return saved ? JSON.parse(saved) : MOCK_JOBS;
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem('proplan_materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [dispatchedParts, setDispatchedParts] = useState<DispatchedPart[]>(() => {
    const saved = localStorage.getItem('proplan_dispatched');
    return saved ? JSON.parse(saved) : INITIAL_DISPATCHED;
  });

  const [resources] = useState<Resource[]>(MOCK_RESOURCES);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('proplan_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('proplan_materials', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('proplan_dispatched', JSON.stringify(dispatchedParts));
  }, [dispatchedParts]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  
  const [editingJob, setEditingJob] = useState<ProductionJob | null>(null);
  const [editingDispatch, setEditingDispatch] = useState<DispatchedPart | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am ProPlan AI, your MJF specialist. I can help with build scheduling, nesting optimization, and cooling cycle management.', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getWeeklyStats = (): WeeklyStats[] => {
    const stats: WeeklyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dailyTotal = dispatchedParts
        .filter(part => part.date === dateStr)
        .reduce((sum, part) => sum + part.quantity, 0);

      stats.push({
        day: dayName,
        output: dailyTotal,
        efficiency: 0 
      });
    }
    return stats;
  };

  const weeklyStats = getWeeklyStats();
  const totalWeeklyUnits = weeklyStats.reduce((acc, curr) => acc + curr.output, 0);

  const handleAddJob = (job: ProductionJob) => {
    if (job.status === JobStatus.Completed) {
      // Logic for automatic move to Dispatched History
      const dispatchedItem: DispatchedPart = {
        id: Math.random().toString(36).substr(2, 9),
        batchName: job.name,
        client: job.client,
        quantity: job.poQuantity || 0,
        date: job.dispatchedDate || new Date().toISOString().split('T')[0]
      };

      // Add to dispatched history
      setDispatchedParts(prev => [...prev, dispatchedItem]);
      
      // Remove from active jobs list
      setJobs(prev => prev.filter(j => j.id !== job.id));

      alert(`Job "${job.name}" marked as Completed and moved to Dispatched History.`);
    } else {
      // Normal update or create logic
      if (editingJob) {
        setJobs(jobs.map(j => j.id === job.id ? job : j));
      } else {
        setJobs([...jobs, job]);
      }
    }
    setEditingJob(null);
  };

  const handleEditJob = (job: ProductionJob) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const deleteJob = (id: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  const handleAddDispatched = (part: DispatchedPart) => {
    if (editingDispatch) {
       setDispatchedParts(prev => prev.map(p => p.id === part.id ? part : p));
       setEditingDispatch(null);
    } else {
       setDispatchedParts(prev => [...prev, part]);
    }
  };

  const handleEditDispatched = (part: DispatchedPart) => {
    setEditingDispatch(part);
    setIsDispatchModalOpen(true);
  };

  const handleDeleteDispatched = (id: string) => {
    if(confirm('Delete this record?')) {
      setDispatchedParts(prev => prev.filter(p => p.id !== id));
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    const responseText = await analyzeProductionData(userMsg.text, jobs, resources);
    
    setIsTyping(false);
    setChatMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: new Date() }]);
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Completed: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case JobStatus.Primer: return 'bg-slate-100 text-slate-800 border-slate-200';
      case JobStatus.FirstPaint: return 'bg-blue-100 text-blue-800 border-blue-200';
      case JobStatus.FinalPaint: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case JobStatus.Rework: return 'bg-red-100 text-red-800 border-red-200';
      case JobStatus.QC: return 'bg-purple-100 text-purple-800 border-purple-200';
      case JobStatus.OnHold: return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch(priority) {
      case Priority.Critical: return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">CRITICAL</span>;
      case Priority.High: return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">High</span>;
      case Priority.Medium: return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">Med</span>;
      case Priority.Low: return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">Low</span>;
    }
  };

  // Render Functions for Views
  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Jobs" value={jobs.filter(j => j.status !== JobStatus.Completed && j.status !== JobStatus.OnHold).length} trend="3 New" trendUp={true} icon={Layers} colorClass="bg-blue-500" />
        <StatCard title="Avg Nesting Density" value="12.4%" trend="0.8%" trendUp={true} icon={Box} colorClass="bg-purple-500" />
        <StatCard title="Powder Efficiency" value="84%" trend="2%" trendUp={false} icon={Activity} colorClass="bg-amber-500" />
        <StatCard title="On-Time Delivery" value="98.5%" trend="1.2%" trendUp={true} icon={CheckCircle2} colorClass="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Weekly Dispatch Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Weekly Dispatched Parts</h3>
              <p className="text-sm text-slate-500 mt-1">Summary of units shipped to clients (Last 7 Days)</p>
            </div>
            <div className="text-right">
              <h4 className="text-2xl font-bold text-brand-600">{totalWeeklyUnits}</h4>
              <p className="text-xs text-slate-400">Total Units</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="output" name="Dispatched Units" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Material Status - Editable */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col relative group">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Material Status</h3>
            <button 
              onClick={() => setIsMaterialModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              title="Edit Materials"
            >
              <Edit2 size={16} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-start space-y-6 overflow-y-auto max-h-[400px]">
            {/* Level Bars */}
            {materials.filter(m => m.type === 'level').map(item => (
              <div key={item.id}>
                 <div className="flex justify-between text-sm mb-2">
                   <span className="font-medium text-slate-700">{item.name}</span>
                   <span className="text-slate-500">{item.value}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-3">
                   <div 
                    className={`h-3 rounded-full ${item.percentage && item.percentage < 30 ? 'bg-red-500' : 'bg-brand-500'}`} 
                    style={{ width: `${item.percentage || 0}%` }}
                   ></div>
                 </div>
              </div>
            ))}

            {/* Status List */}
            <div className="pt-2 space-y-3">
               {materials.filter(m => m.type === 'status').map(item => (
                 <div key={item.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ 
                        backgroundColor: 
                          item.statusColor === 'emerald' ? '#10b981' : 
                          item.statusColor === 'amber' ? '#f59e0b' : 
                          item.statusColor === 'red' ? '#ef4444' : '#94a3b8' 
                      }}
                     ></div>
                     <span className="text-sm text-slate-600">{item.name}</span>
                   </div>
                   <span 
                    className={`text-sm font-medium ${
                      item.statusColor === 'emerald' ? 'text-emerald-600' : 
                      item.statusColor === 'amber' ? 'text-amber-600' : 
                      item.statusColor === 'red' ? 'text-red-600' : 'text-slate-600'
                    }`}
                   >
                     {item.value}
                   </span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanner = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input type="text" placeholder="Search orders..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
           </div>
           <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
             <Filter className="w-4 h-4" /> Filter
           </button>
        </div>
        <button 
          onClick={() => { setEditingJob(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Record
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="p-4">Company Name</th>
                <th className="p-4">Quote ID</th>
                <th className="p-4">PO Date</th>
                <th className="p-4">PO Qty</th>
                <th className="p-4">Work Started</th>
                <th className="p-4">Part Name</th>
                <th className="p-4">Material</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Dispatch Scheduled</th>
                <th className="p-4">Dispatched Date</th>
                <th className="p-4">Remarks</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map(job => (
                <tr 
                  key={job.id} 
                  className={`
                    transition-colors group text-sm
                    ${job.status === JobStatus.OnHold 
                      ? 'bg-amber-50 text-amber-900 border-l-4 border-l-amber-500' 
                      : job.priority === Priority.Critical
                        ? 'bg-purple-50 text-purple-900 border-l-4 border-l-purple-500'
                        : 'hover:bg-slate-50 text-slate-700 border-l-4 border-l-transparent'}
                  `}
                >
                  <td className="p-4 font-medium">{job.client}</td>
                  <td className="p-4">{job.quoteId || '-'}</td>
                  <td className="p-4">{job.poDate}</td>
                  <td className="p-4 font-mono font-medium">{job.poQuantity || '-'}</td>
                  <td className="p-4">{job.startDate}</td>
                  <td className="p-4">{job.partName || job.name}</td>
                  <td className="p-4">{job.material || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(job.priority)}
                      {job.priority === Priority.Critical && <AlertTriangle size={16} className="text-purple-600 animate-pulse" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)} whitespace-nowrap`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="p-4">{job.endDate}</td>
                  <td className="p-4">{job.dispatchedDate || '-'}</td>
                  <td className="p-4 max-w-[200px] truncate" title={job.notes}>{job.notes || '-'}</td>
                  <td className="p-4 text-right">
                    <div className={`flex justify-end gap-2 ${job.status === JobStatus.OnHold ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button onClick={() => handleEditJob(job)} className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDispatched = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
             <input type="text" placeholder="Search records..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
           </div>
           <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
             <Filter className="w-4 h-4" /> Filter
           </button>
        </div>
        <button 
          onClick={() => { setEditingDispatch(null); setIsDispatchModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Log Dispatch
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="p-4">Date</th>
                <th className="p-4">Batch Name</th>
                <th className="p-4">Client</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatchedParts.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(part => (
                <tr key={part.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-sm text-slate-600">{part.date}</td>
                  <td className="p-4 font-medium text-slate-800">{part.batchName}</td>
                  <td className="p-4 text-sm text-slate-600">{part.client}</td>
                  <td className="p-4 text-right font-mono text-brand-600 font-bold">{part.quantity}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditDispatched(part)} className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteDispatched(part.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dispatchedParts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No dispatched parts logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAIAssistant = () => (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-600" /> MJF Genius
          </h3>
          <p className="text-xs text-slate-500">Powered by Gemini 3 Flash</p>
        </div>
        <button 
          onClick={() => {
            setChatInput("Generate a daily optimization report based on current schedule.");
          }}
          className="text-xs bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 px-3 py-1.5 rounded-full transition-colors"
        >
          Generate Daily Report
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white text-slate-500 border border-slate-100 p-3 rounded-2xl rounded-bl-none text-xs flex items-center gap-1 shadow-sm">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
             </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleChatSubmit} className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about nesting strategies, cooling times, or batch optimization..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-slate-800"
          />
          <button 
            type="submit" 
            disabled={!chatInput.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Bot className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
              P
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ProPlan AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('planner')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'planner' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={20} />
            <span className="font-medium">Batch Schedule</span>
          </button>

          <button 
            onClick={() => setCurrentView('dispatched')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dispatched' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Truck size={20} />
            <span className="font-medium">Dispatched History</span>
          </button>

          <button 
            onClick={() => setCurrentView('ai-assistant')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'ai-assistant' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Bot size={20} />
            <span className="font-medium">AI Genius</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-slate-800">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </div>
          <div className="mt-4 px-4">
             <div className="bg-slate-800 rounded-lg p-3">
               <p className="text-xs text-slate-400 mb-1">System Status</p>
               <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-xs font-medium text-white">Online</span>
               </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">P</div>
             <span className="font-bold text-slate-800">ProPlan</span>
          </div>
          <button className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {currentView === 'dashboard' && 'MJF Dashboard'}
                  {currentView === 'planner' && 'Batch Planner'}
                  {currentView === 'dispatched' && 'Dispatched History'}
                  {currentView === 'ai-assistant' && 'MJF Intelligence'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {currentView === 'dashboard' && `Overview of your HP MJF Fleet. ${jobs.filter(j=>j.priority === Priority.Critical).length} critical batches active.`}
                  {currentView === 'planner' && 'Manage print batches, cooling cycles, and post-processing.'}
                  {currentView === 'dispatched' && 'Track historical shipments and dispatched quantities.'}
                  {currentView === 'ai-assistant' && 'Ask Gemini about nesting optimization or powder recovery.'}
                </p>
              </div>
              <div className="hidden md:block">
                 <p className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                    <Clock size={14} /> {new Date().toLocaleDateString()}
                 </p>
              </div>
            </div>

            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'planner' && renderPlanner()}
            {currentView === 'dispatched' && renderDispatched()}
            {currentView === 'ai-assistant' && renderAIAssistant()}
          </div>
        </div>
      </main>

      <JobModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddJob}
        initialData={editingJob}
      />

      <MaterialModal 
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        items={materials}
        onUpdate={setMaterials}
      />

      <DispatchModal 
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onSave={handleAddDispatched}
        initialData={editingDispatch}
      />
    </div>
  );
};

export default App;
