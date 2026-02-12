export interface WorkEntry {
  id: number;
  project: string;
  description: string;
  hours: number;
  date: string;
  attachments?: WorkEntryAttachment[];
}

export interface WorkEntryAttachment {
  id: number;
  work_entry_id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  upload_date?: string;
}