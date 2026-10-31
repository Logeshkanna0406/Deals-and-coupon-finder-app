export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferences?: string;
  status: string;
  createdAt: string;
}

export interface UpdateCustomerRequest {
  name: string;
  phone: string;
  preferences?: string;
}

export interface UpdatePreferencesRequest {
  preferences: string;
}
