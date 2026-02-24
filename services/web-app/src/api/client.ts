const API_BASE = '/api';

interface ApiError {
    error: string;
    statusCode: number;
}

function getTokens() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
}

export function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

async function tryRefresh(): Promise<string | null> {
    const { refreshToken } = getTokens();
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
    } catch {
        return null;
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const { accessToken } = getTokens();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Auto-refresh on 401
    if (res.status === 401 && accessToken) {
        const newToken = await tryRefresh();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        }
    }

    if (!res.ok) {
        let errorMessage = `Request failed (${res.status})`;
        try {
            const err: ApiError = await res.json();
            errorMessage = err.error || errorMessage;
        } catch { /* ignore parse error */ }
        throw new Error(errorMessage);
    }

    return res.json();
}
