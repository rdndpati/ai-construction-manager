export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
  created_at?: string;
  progress: number;
}