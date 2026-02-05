export interface Department {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  employee_count: number;
  project_count: number;
}
