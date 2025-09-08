export type SavedAsset = {
  key: string;
  url: string; // public URL (relative path for local driver)
  path?: string; // absolute path for local driver
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
};

export interface StorageDriver {
  put: (key: string, content: Buffer, mimeType: string) => Promise<SavedAsset>;
  getPublicUrl: (key: string) => string;
}

