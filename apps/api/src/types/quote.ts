export interface QuoteRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  materialNeeded?: string;
  quantityYards?: string;
  preferredDeliveryDate?: string;
  notes?: string;
}
