import React, { useState, useEffect } from 'react';
import { ProductionJob, JobStatus, Priority, OnHoldLog } from '../types';
import { X, History } from 'lucide-react';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: ProductionJob) => void;
  initialData?: ProductionJob | null;
}

export const JobModal: React.FC<JobModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<ProductionJob>>({
    name: '',
    partName: '',
    client: '',
    quoteId: '',
    poDate: new Date().toISOString().split('T')[0],
    poQuantity: 0,
    material: 'PA12',
    status: JobStatus.Primer,
    priority: Priority.Medium,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dispatchedDate: '',
    notes: '',
    onHoldHistory: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset for new entry
      setFormData({
        name: `Batch-${Math.floor(Math.random() * 1000)}`,
        partName: '',
        client: '',
        quoteId: '',
        poDate: new Date().toISOString().split('T')[0],
        poQuantity: 0,
        material: 'PA12',
        status: JobStatus.Primer,
        priority: Priority.Medium,
        progress: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dispatchedDate: '',
        notes: '',
        onHoldHistory: []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays; // +1 if inclusive, but usually diff is fine
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic for On Hold History
    let updatedHistory: OnHoldLog[] = [...(formData.onHoldHistory || [])];
    const today = new Date().toISOString().split('T')[0];
    
    const wasOnHold = initialData?.status === JobStatus.OnHold;
    const isNowOnHold = formData.status === JobStatus.OnHold;

    if (!wasOnHold && isNowOnHold) {
      // Moving TO On Hold -> Start a new log
      updatedHistory.push({ startDate: today });
    } else if (wasOnHold && !isNowOnHold) {
      // Moving FROM On Hold -> Close the last log
      // Find the open log (one without end date)
      const openLogIndex = updatedHistory.findIndex(log => !log.endDate);
      if (openLogIndex !== -1) {
        updatedHistory[openLogIndex] = {
          ...updatedHistory[openLogIndex],
          endDate: today,
          durationDays: calculateDuration(updatedHistory[openLogIndex].startDate, today)
        };
      }
    } else if (!initialData && isNowOnHold) {
       // Creating new job as On Hold immediately
       updatedHistory.push({ startDate: today });
    }

    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      ...formData as ProductionJob,
      onHoldHistory: updatedHistory
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{initialData ? 'Edit Production Record' : 'New Production Record'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Company & Part Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input 
                required
                type="text" 
                value={formData.client}
                onChange={e => setFormData({...formData, client: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Client Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Part Name</label>
              <input 
                required
                type="text" 
                value={formData.partName}
                onChange={e => setFormData({...formData, partName: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Part Description"
              />
            </div>
          </div>

          {/* Row 2: Quote & PO */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quote ID</label>
              <input 
                type="text" 
                value={formData.quoteId}
                onChange={e => setFormData({...formData, quoteId: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Q-202X-XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PO Date</label>
              <input 
                type="date" 
                value={formData.poDate}
                onChange={e => setFormData({...formData, poDate: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PO Qty</label>
              <input 
                type="number" 
                value={formData.poQuantity}
                onChange={e => setFormData({...formData, poQuantity: parseInt(e.target.value) || 0})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Qty"
              />
            </div>
          </div>

          {/* Row 3: Material & Priority */}
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
              <input 
                type="text" 
                value={formData.material}
                onChange={e => setFormData({...formData, material: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. PA12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {Object.values(Priority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Status */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as JobStatus})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
              >
                <option value={JobStatus.Primer}>Primer</option>
                <option value={JobStatus.FirstPaint}>1st Paint</option>
                <option value={JobStatus.FinalPaint}>Final Paint</option>
                <option value={JobStatus.Rework}>Rework</option>
                <option value={JobStatus.QC}>QC</option>
                <option value={JobStatus.OnHold}>On Hold</option>
                <option value={JobStatus.Completed}>Completed</option>
              </select>
              {formData.status === JobStatus.OnHold && (
                <p className="text-xs text-amber-600 mt-1">
                  * Marking as On Hold will track the duration until changed.
                </p>
              )}
            </div>
          </div>

          {/* Row 5: Dates */}
          <div className="grid grid-cols-3 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work Started</label>
              <input 
                type="date" 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dispatch Scheduled</label>
              <input 
                type="date" 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Actual Dispatched</label>
              <input 
                type="date" 
                value={formData.dispatchedDate || ''}
                onChange={e => setFormData({...formData, dispatchedDate: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
            <textarea 
              value={formData.notes || ''}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none h-20"
              placeholder="Internal notes..."
            />
          </div>

          {/* On Hold History Display */}
          {formData.onHoldHistory && formData.onHoldHistory.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1 mb-2">
                <History size={12} /> On Hold History
              </h4>
              <ul className="space-y-1">
                {formData.onHoldHistory.map((log, idx) => {
                  const isCurrent = !log.endDate;
                  const duration = log.durationDays || calculateDuration(log.startDate, isCurrent ? new Date().toISOString().split('T')[0] : log.endDate!);
                  
                  return (
                    <li key={idx} className="text-xs text-amber-900 flex justify-between items-center bg-white/50 p-1.5 rounded">
                      <span>
                        <span className="font-medium">From:</span> {log.startDate} 
                        <span className="mx-1 text-amber-400">→</span> 
                        <span className="font-medium">To:</span> {isCurrent ? 'Current' : log.endDate}
                      </span>
                      <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-medium ml-2">
                        {duration} days {isCurrent ? '(ongoing)' : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm">
              {initialData ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};