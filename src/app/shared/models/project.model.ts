export type ProjectStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface Project {
  id: number;
  name: string;
  projectType: string;
  clientDetails: string;
  projectBrief: string;
  startDate: string; 
  finishDate: string; // Format: YYYY-MM-DD
  department: string;
  status: ProjectStatus;
  renewal?: boolean; 
}