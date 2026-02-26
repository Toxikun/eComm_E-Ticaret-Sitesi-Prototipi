// ─── User Types ───
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    SELLER = 'SELLER',
    ADMIN = 'ADMIN',
}

export interface Address {
    id: string;
    userId: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
