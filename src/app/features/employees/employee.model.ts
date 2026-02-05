export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department_id: number;   // 👈 FK
  department_name?: string; // 👈 for display only
  position: string;
  join_date: string;
  home_address: string;
  status: string;
  issued_items: string;
}
