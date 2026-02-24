import { apiFetch } from './client';

interface AuthResponse {
    user: { id: string; email: string; name: string; role: string };
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

interface RefreshResponse {
    accessToken: string;
    expiresIn: string;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function registerApi(email: string, password: string, name: string): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
    });
}

export async function refreshTokenApi(refreshToken: string): Promise<RefreshResponse> {
    return apiFetch<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
    });
}
