/// <reference lib="dom" />
import type { ExportFormat } from '@personal-hub/shared';
import { api } from '../api';

interface ExportOptions {
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  // Feature-specific filters
  status?: string;
  priority?: string;
  type?: string;
  tags?: string;
  sessionType?: string;
  completed?: string;
  allDay?: string;
  [key: string]: string | undefined;
}

// eslint-disable-next-line no-undef
async function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function extractFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  
  const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (matches && matches[1]) {
    return matches[1].replace(/['"]/g, '');
  }
  
  return fallback;
}

async function exportData(endpoint: string, options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/${endpoint}?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = extractFilename(
    response.headers['content-disposition'],
    `${endpoint}-export.${options.format}`
  );
  
  await downloadFile(blob, filename);
}

export async function exportTodos(options: ExportOptions) {
  return exportData('todos', options);
}

export async function exportGoals(options: ExportOptions) {
  return exportData('goals', options);
}

export async function exportEvents(options: ExportOptions) {
  return exportData('events', options);
}

export async function exportNotes(options: ExportOptions) {
  return exportData('notes', options);
}

export async function exportMoments(options: ExportOptions) {
  return exportData('moments', options);
}

export async function exportPomodoro(options: ExportOptions) {
  return exportData('pomodoro', options);
}