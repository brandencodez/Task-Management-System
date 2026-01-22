export interface ClientContact {
  name: string;
  email: string;
  phone: string;
}

export interface ClientDetails {
  companyName: string;
  contacts: ClientContact[];
  address?: string;
}

export type ProjectStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface Project {
  id: number;
  name: string;
  projectType: string;
  clientDetails: ClientDetails;
  projectBrief: string;
  startDate: string;
  finishDate: string;
  department: string;
  status: ProjectStatus;
}