export interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: Date;
  HomeAddress: string;
  status: 'active' | 'on-leave' | 'inactive';

}