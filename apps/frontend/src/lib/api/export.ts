import type { ExportFormat } from '@personal-hub/shared';
import { api } from '../api';

interface ExportOptions {
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any; // For feature-specific filters
}

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

export async function exportTodos(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/todos?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `todos-export.${options.format}`;
  
  await downloadFile(blob, filename);
}

export async function exportGoals(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/goals?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `goals-export.${options.format}`;
  
  await downloadFile(blob, filename);
}

export async function exportEvents(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/events?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `events-export.${options.format}`;
  
  await downloadFile(blob, filename);
}

export async function exportNotes(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/notes?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `notes-export.${options.format}`;
  
  await downloadFile(blob, filename);
}

export async function exportMoments(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/moments?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `moments-export.${options.format}`;
  
  await downloadFile(blob, filename);
}

export async function exportPomodoro(options: ExportOptions) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/export/pomodoro?${params.toString()}`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const filename = response.headers.get('content-disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `pomodoro-export.${options.format}`;
  
  await downloadFile(blob, filename);
}