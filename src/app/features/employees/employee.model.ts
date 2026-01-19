export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joinDate: Date;
  status: 'active' | 'on-leave' | 'inactive';
}