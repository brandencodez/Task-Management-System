export interface Admin {
  id: number;
  full_name: string;
  gender?: 'male' | 'female';
  profile_image?: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: 'active' | 'inactive';
  bio?: string;
  date_of_birth?: string;
  created_at?: Date;
}
