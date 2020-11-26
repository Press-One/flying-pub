import request from '../request';
import qs from 'query-string';
import { isMobile } from 'utils';

export interface EditableFile {
  title: string;
  content: string;
  cover?: string;
  status?: string;
  id?: number;
  invisibility?: boolean;
}

export interface IFile {
  content: string;
  cover: string;
  description: string;
  encryptedContent: string;
  id: number;
  invisibility: boolean;
  mimeType: string;
  msghash: string;
  rId: string;
  status: string;
  title: string;
  topicAddress: string;
  createdAt: string;
  updatedAt: string;
  userAddress: string;
  userId: number;
}

export default {
  getFiles(p: { offset: number; limit: number, type?: string }) {
    return request(`/api/files?${qs.stringify(p)}`, {
      minPendingDuration: isMobile ? 500 : 300
    });
  },
  createDraft(file: any) {
    const path = '/api/files?type=DRAFT';
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file };
    return request(path, {
      method: 'POST',
      body: payload,
      minPendingDuration: 500
    });
  },
  createFile(file: any) {
    const path = '/api/files';
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file, origin: window.location.origin };
    return request(path, {
      method: 'POST',
      body: payload,
      minPendingDuration: 500
    });
  },
  getFile(id: any) {
    return request(`/api/files/${id}`, {
      minPendingDuration: 500
    });
  },
  getFileByRId(rId: any) {
    return request(`/api/files/rid/${rId}`);
  },
  updateFile(id: number | undefined, file: any, publish?: boolean) {
    const path = publish ? `/api/files/${id}?action=PUBLISH` : `/api/files/${id}`;
    file.mimeType = file.mimeType || 'text/markdown';
    const payload = { payload: file, origin: window.location.origin };
    return request(path, {
      method: 'PUT',
      body: payload,
      minPendingDuration: 500
    });
  },
  deleteFile(id: any) {
    return request(`/api/files/${id}`, {
      method: 'DELETE',
      minPendingDuration: 500
    });
  },
  hideFile(id: number | undefined) {
    return request(`/api/files/hide/${id}`, {
      method: 'PUT',
      minPendingDuration: 500
    });
  },
  showFile(id: number | undefined) {
    return request(`/api/files/show/${id}`, {
      method: 'PUT',
      minPendingDuration: 500
    });
  },
}