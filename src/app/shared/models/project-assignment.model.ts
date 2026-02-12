export interface ProjectAssignment {
  assignment_id: number;
  project_id: number;
  project_name: string;
  employee_id: number;
  employee_name: string;
  employee_position?: string;
  department_id: number;
  department_name?: string;
  assigned_at: string;
}
