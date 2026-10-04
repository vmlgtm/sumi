export interface Note {
  id: string;
  title: string;
  contentHtml: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

export interface SumiExportData {
  version: 1;
  exportedAt: string;
  notes: Note[];
}
