import React, { useState, useEffect } from 'react';
import { DispatchedPart } from '../types';
import { X } from 'lucide-react';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (part: DispatchedPart) => void;
  initialData?: DispatchedPart | null;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<DispatchedPart>>({
    batchName: '',
    client: '',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        batchName: '',
        client: '',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchName || !formData.client || !formData.quantity || !formData.date) return;

    onSave({
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      batchName: formData.batchName,
      client: formData.client,
      quantity: Number(formData.quantity),
      date: formData.date
    });
    
    // Reset only if not editing (or close will handle it)
    if (!initialData) {
      setFormData({
        batchName: '',
        client: '',
        quantity: 0,
        date: new Date().toISOString().split('T')[0],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Edit Dispatch Record' : 'Log Dispatched Parts'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Batch Name</label>
            <input 
              required
              type="text" 
              value={formData.batchName}
              onChange={e => setFormData({...formData, batchName: e.target.value})}
              className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="e.g. Batch #204"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <input 
              required
              type="text" 
              value={formData.client}
              onChange={e => setFormData({...formData, client: e.target.value})}
              className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Client Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input 
                required
                type="number" 
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Dispatched</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm">
              {initialData ? 'Update Record' : 'Log Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
