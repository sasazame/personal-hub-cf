import { apiClient } from './api-client';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
}

export interface TwoFAStatus {
  enabled: boolean;
  enabledAt?: string;
  lastUsedAt?: string;
}

export interface TwoFASetupResponse {
  qrcode: string;
  secret: string;
  recoveryCodes: string[];
}

export interface TwoFAVerifyResponse {
  success: boolean;
  message: string;
}

export interface TwoFADisableResponse {
  success: boolean;
  message: string;
}

export interface TwoFARegenerateCodesResponse {
  recoveryCodes: string[];
}

// Get 2FA status for the current user
export async function get2FAStatus(): Promise<TwoFAStatus> {
  try {
    const response = await apiClient.get('/2fa/status');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const message = axiosError.response?.data?.message || 'Failed to get 2FA status';
    throw new Error(message);
  }
}

// Start 2FA setup process
export async function setup2FA(password: string): Promise<TwoFASetupResponse> {
  try {
    const response = await apiClient.post('/2fa/setup', { password });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const message = axiosError.response?.data?.message || 'Failed to setup 2FA';
    throw new Error(message);
  }
}

// Verify TOTP code and enable 2FA
export async function verify2FA(code: string): Promise<TwoFAVerifyResponse> {
  try {
    const response = await apiClient.post('/2fa/verify', { code });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const message = axiosError.response?.data?.message || 'Invalid verification code';
    throw new Error(message);
  }
}

// Disable 2FA
export async function disable2FA(password: string): Promise<TwoFADisableResponse> {
  try {
    const response = await apiClient.post('/2fa/disable', { password });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const message = axiosError.response?.data?.message || 'Failed to disable 2FA';
    throw new Error(message);
  }
}

// Regenerate recovery codes
export async function regenerateRecoveryCodes(password: string): Promise<TwoFARegenerateCodesResponse> {
  try {
    const response = await apiClient.post('/2fa/regenerate-recovery-codes', { password });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const message = axiosError.response?.data?.message || 'Failed to regenerate recovery codes';
    throw new Error(message);
  }
}