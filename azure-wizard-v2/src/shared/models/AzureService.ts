export interface AzureService {
  id: string;
  serviceName: string;
  category?: string;
  description?: string;
  metadata?: any; // JSON
  createdAt?: string;
}

export interface AzureServiceAttribute {
  id: string;
  serviceId: string;
  attributeName: string;
  attributeValue?: string;
  attributeType?: 'string' | 'number' | 'boolean' | 'json';
  displayOrder?: number;
  createdAt?: string;
}








