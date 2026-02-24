import { apiFetch } from './client';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image_url: string;
    stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaginatedProducts {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ProductQuery {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
}

export async function getProducts(query: ProductQuery = {}): Promise<PaginatedProducts> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            params.set(key, String(value));
        }
    });
    const qs = params.toString();
    return apiFetch<PaginatedProducts>(`/products${qs ? `?${qs}` : ''}`);
}

export async function getProduct(id: string): Promise<Product> {
    return apiFetch<Product>(`/products/${id}`);
}
