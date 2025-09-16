import { User } from './auth';

export type MessageType = 'text' | 'system' | 'media' | 'prescription';
export type SenderType = 'patient' | 'provider' | 'system';

// Define ConsultationMedia interface here to avoid circular dependency
export interface ConsultationMedia {
  id: string;
  consultationId: string;
  messageId?: string;
  originalFilename: string;
  storedFilename: string;
  storagePath: string;
  storageUrl?: string;
  fileSize: number;
  mimeType: string;
  mediaCategory: string;
  fileHash?: string;
  isProcessed: boolean;
  processingStatus: string;
  processingMetadata?: Record<string, any>;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  consultationId: string;
  senderId?: string;
  senderType: SenderType;
  messageType: MessageType;
  content?: string;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  sender?: User;
  media?: ConsultationMedia[];
}

export interface MessageCreateData {
  consultationId: string;
  content?: string;
  messageType?: MessageType;
  parentMessageId?: string;
}
