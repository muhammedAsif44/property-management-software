export interface OwnerSignupPayload {
  name: string;
  organizationName: string;
  email: string;
  phone: string;
  password: string;
}

export interface OwnerSignupResponse {
  message: string;
  approvalStatus: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationName: string;
    organizationId: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
}
