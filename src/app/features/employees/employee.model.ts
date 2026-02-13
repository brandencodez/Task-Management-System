export interface Employee {
  id: number;
  name: string;
  gender?: 'male' | 'female';
  profile_image?: string;
  email: string;
  phone: string;
  department_id: number;   // 👈 FK
  department_name?: string; // 👈 for display only
  position: string;
  join_date: string;
  home_address: string;
  status: string;
  issued_items: string;
  bio?: string;
  date_of_birth?: string;
}
