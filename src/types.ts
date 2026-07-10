import { User } from "./api";

export type UserData = User;

export interface LinkData {
  id: string;
  userId: string;
  originalUrl: string;
  shortSlug: string;
  customDomain?: string;
  clickCount: number;
  qrScanCount?: number;
  collectionId?: string;
  createdAt: string;
  expiresAt?: string;
  activatedAt?: string;
  title: string;
  password?: string;
  landingEnabled?: boolean;
  landingDescription?: string;
  landingAvatar?: string;
  isEnabled?: boolean;
  category?: string;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  userId: string;
  timestamp: string;
  shortSlug: string;
  title: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  device?: string;
  os?: string;
  browser?: string;
  referrer?: string;
  isQrScan?: boolean;
}

export interface LinkCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  linkIds: string[];
}

export type CollectionData = LinkCollection;

export interface GlobalSettings {
  registrationEnabled: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
