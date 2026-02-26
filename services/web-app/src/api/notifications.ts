import { apiFetch } from './client';

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    metadata: Record<string, any>;
    is_read: boolean;
    created_at: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    return apiFetch<Notification[]>(`/notifications/user/${userId}`);
}

export async function markAsRead(id: string): Promise<Notification> {
    return apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/notifications/read-all', { method: 'PATCH' });
}
