import { API_BASE_URL } from "../constants/config";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status);
  }

  return response.json() as Promise<T>;
}
