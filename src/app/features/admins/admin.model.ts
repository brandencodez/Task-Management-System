export interface Admin {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  created_at?: Date;
}
