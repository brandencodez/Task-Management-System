export type ProjectStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';
 
//CLIENT DETAILS

export interface ClientDetails {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
}
export interface Project {
  id: number;
  name: string;
  projectType: string;
  clientDetails: ClientDetails;
  projectBrief: string;
  startDate: string; 
  finishDate: string; // Format: YYYY-MM-DD
  department: string;
  status: ProjectStatus;
  renewal?: boolean; 
}