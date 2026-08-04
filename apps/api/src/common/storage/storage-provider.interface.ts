export interface IStorageProvider {
  upload(key: string, body: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): Promise<string>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
