export interface WorkEntry {
  id: number;
  project: string;
  description: string;
  hours: number;
  date: string;
  attachment_filename?: string;
  attachment_mime_type?: string;
}