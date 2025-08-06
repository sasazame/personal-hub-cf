import axios, { AxiosResponse, AxiosError } from 'axios';
import { config } from '../config';

export interface APIResponse {
  status: number;
  headers: Record<string, string>;
  data: unknown;
  responseTime: number;
}

export interface APIError {
  status?: number;
  data?: unknown;
  message: string;
}

export async function makeAPIRequest(
  baseUrl: string,
  method: string,
  endpoint: string,
  headers?: Record<string, string>,
  body?: unknown
): Promise<APIResponse | APIError> {
  const startTime = Date.now();
  
  try {
    const response: AxiosResponse = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      data: body,
      timeout: config.testTimeout,
      validateStatus: () => true, // Don't throw on any status
    });

    return {
      status: response.status,
      headers: response.headers as Record<string, string>,
      data: response.data,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      };
    }
    return {
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function isAPIResponse(response: APIResponse | APIError): response is APIResponse {
  return 'status' in response && 'headers' in response && 'data' in response;
}