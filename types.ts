export enum JobStatus {
  Pending = 'Pending', // Keeping Pending as default for new creations if needed, or we can map it to Primer
  Primer = 'Primer',
  FirstPaint = '1st Paint',
  FinalPaint = 'Final Paint',
  Rework = 'Rework',
  QC = 'QC',
  OnHold = 'On Hold',
  Completed = 'Completed' // Useful to keep for finished state
}

export enum Priority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export interface Resource {
  id: string;
  name: string;
  type: 'Printer' | 'Cooling Station' | 'Post-Processing' | 'Technician';
  efficiency: number; // 0-100
  status: 'Printing' | 'Cooling' | 'Processing' | 'Idle' | 'Maintenance' | 'Active';
  temperature?: number; // Current chamber temp in C
  materialLevel?: number; // Percentage of powder/consumable left
}

export interface OnHoldLog {
  startDate: string;
  endDate?: string;
  durationDays?: number;
}

export interface ProductionJob {
  id: string;
  name: string; // Internal/Display ID
  partName: string; 
  client: string; // Company Name
  quoteId: string; 
  poDate: string; 
  poQuantity?: number; // New: PO Quantity
  startDate: string; // Work Started
  endDate: string;   // Dispatch Scheduled
  dispatchedDate?: string; 
  material: string; 
  progress: number;  // 0-100
  status: JobStatus;
  priority: Priority;
  notes?: string; // Remarks
  nestingDensity?: number; 
  onHoldHistory?: OnHoldLog[]; // New: Track on hold periods
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface WeeklyStats {
  day: string;
  output: number;
  efficiency: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  value: string; // Display text like "240 kg / 400 kg" or "Good"
  type: 'level' | 'status';
  percentage?: number; // 0-100, required if type is 'level'
  statusColor?: 'emerald' | 'amber' | 'red' | 'slate'; // required if type is 'status'
}

export interface DispatchedPart {
  id: string;
  batchName: string;
  client: string;
  quantity: number;
  date: string; // YYYY-MM-DD
}
