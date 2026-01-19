import React, { useState } from 'react';
import { MaterialItem } from '../types';
import { X, Trash2, Plus } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MaterialItem[];
  onUpdate: (items: MaterialItem[]) => void;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({ isOpen, onClose, items, onUpdate }) => {
  const [newItem, setNewItem] = useState<Partial<MaterialItem>>({
    name: '',
    value: '',
    type: 'level',
    percentage: 50,
    statusColor: 'emerald'
  });

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    onUpdate(items.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    if (!newItem.name || !newItem.value) return;

    const item: MaterialItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      value: newItem.value,
      type: newItem.type as 'level' | 'status',
      percentage: newItem.type === 'level' ? newItem.percentage : undefined,
      statusColor: newItem.type === 'status' ? newItem.statusColor : undefined,
    };

    onUpdate([...items, item]);
    setNewItem({
      name: '',
      value: '',
      type: 'level',
      percentage: 50,
      statusColor: 'emerald'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Manage Material Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No items yet.</p>}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Add New Item</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Name (e.g. PA12)" 
                  className="text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-brand-500"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Value (e.g. 50kg or Good)" 
                  className="text-sm border rounded-lg p-2 outline-none focus:ring-2 focus:ring-brand-500"
                  value={newItem.value}
                  onChange={e => setNewItem({...newItem, value: e.target.value})}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-600">Type:</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewItem({...newItem, type: 'level'})}
                    className={`px-3 py-1 rounded text-xs font-medium border ${newItem.type === 'level' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Level Bar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewItem({...newItem, type: 'status'})}
                    className={`px-3 py-1 rounded text-xs font-medium border ${newItem.type === 'status' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    Status Dot
                  </button>
                </div>
              </div>

              {newItem.type === 'level' ? (
                <div>
                   <label className="block text-xs font-medium text-slate-600 mb-1">Percentage: {newItem.percentage}%</label>
                   <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={newItem.percentage} 
                    onChange={e => setNewItem({...newItem, percentage: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                   />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status Color</label>
                  <div className="flex gap-2">
                    {['emerald', 'amber', 'red'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewItem({...newItem, statusColor: color as any})}
                        className={`w-6 h-6 rounded-full border-2 ${newItem.statusColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#ef4444' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
