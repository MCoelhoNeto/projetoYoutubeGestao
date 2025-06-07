export interface Category {
  _id?: string;
  id?: number;
  name: string;
  color: string;
  channelCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Channel {
  _id?: string;
  id?: number;
  name: string;
  url: string;
  categoryId: string | number;
  description?: string;
  subscribers: string;
  isActive: boolean;
  lastSync: Date;
  youtubeChannelId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Video {
  _id?: string;
  id?: number;
  channelId: string;
  youtubeId: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: string;
  views: number;
  publishedAt: Date;
  isDaily: boolean;
  transcript?: string;
  summary?: string;
  opinion?: string;
}

export interface ApiConfig {
  youtubeApiKey: string;
  geminiApiKey: string;
  mongodbUri: string;
}

export interface ConnectionStatus {
  mongodb: 'connected' | 'disconnected' | 'connecting';
  youtube: 'configured' | 'unconfigured' | 'error';
  gemini: 'configured' | 'unconfigured' | 'error';
}