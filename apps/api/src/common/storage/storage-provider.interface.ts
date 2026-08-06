export interface StorageUploadResult {
  url: string;
  publicId?: string;
  bytes?: number;
}

export interface IStorageProvider {
  upload(key: string, body: Buffer, mimeType: string): Promise<string>;
  uploadDetailed?(key: string, body: Buffer, mimeType: string): Promise<StorageUploadResult>;
  download(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): Promise<string>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
