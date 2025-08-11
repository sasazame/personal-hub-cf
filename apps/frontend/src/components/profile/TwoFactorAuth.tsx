/* global Blob */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { FormField } from '../ui/FormField';
import { toast } from '../ui/toast';
import {
  get2FAStatus,
  setup2FA,
  verify2FA,
  disable2FA,
  regenerateRecoveryCodes,
  type TwoFAStatus,
} from '../../lib/2fa-api';

export const TwoFactorAuth: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [step, setStep] = useState<'password' | 'verify' | 'codes'>('password');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await get2FAStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
      toast.error(t('settings.twofa.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await setup2FA(password);
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(response.qrcode);
      setQrCodeDataUrl(qrCodeUrl);
      setSecret(response.secret);
      setRecoveryCodes(response.recoveryCodes);
      setStep('verify');
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      toast.error(t('settings.twofa.setupError'));
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await verify2FA(verificationCode);
      setStep('codes');
      setShowRecoveryCodes(true);
      toast.success(t('settings.twofa.enableSuccess'));
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      toast.error(t('settings.twofa.verifyError'));
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await disable2FA(password);
      setStatus({ enabled: false });
      setDisableModalOpen(false);
      setPassword('');
      toast.success(t('settings.twofa.disableSuccess'));
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      toast.error(t('settings.twofa.disableError'));
    }
  };

  const handleRegenerateRecoveryCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await regenerateRecoveryCodes(password);
      setRecoveryCodes(response.recoveryCodes);
      setShowRecoveryCodes(true);
      setRegenerateModalOpen(false);
      setPassword('');
      toast.success(t('settings.twofa.regenerateSuccess'));
    } catch (error) {
      console.error('Failed to regenerate recovery codes:', error);
      toast.error(t('settings.twofa.regenerateError'));
    }
  };

  const handleCloseSetupModal = () => {
    if (step === 'codes' && status) {
      loadStatus(); // Reload status after successful setup
    }
    setSetupModalOpen(false);
    setPassword('');
    setVerificationCode('');
    setQrCodeDataUrl('');
    setSecret('');
    setRecoveryCodes([]);
    setShowRecoveryCodes(false);
    setStep('password');
  };

  const downloadRecoveryCodes = () => {
    const content = recoveryCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-4">{t('common.loading')}</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{t('settings.twofa.title')}</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t('settings.twofa.status')}</p>
            <p className="text-sm text-gray-600">
              {status?.enabled
                ? t('settings.twofa.statusEnabled')
                : t('settings.twofa.statusDisabled')}
            </p>
            {status?.enabled && status.enabledAt && (
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.twofa.enabledSince')}: {new Date(status.enabledAt).toLocaleDateString()}
              </p>
            )}
          </div>
          
          {status?.enabled ? (
            <div className="space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRegenerateModalOpen(true)}
              >
                {t('settings.twofa.regenerateCodes')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDisableModalOpen(true)}
              >
                {t('settings.twofa.disable')}
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSetupModalOpen(true)}
            >
              {t('settings.twofa.enable')}
            </Button>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          {t('settings.twofa.description')}
        </p>
      </div>

      {/* Setup Modal */}
      <Modal
        open={setupModalOpen}
        onClose={handleCloseSetupModal}
      >
        <h2 className="text-lg font-semibold mb-4">{t('settings.twofa.setupTitle')}</h2>
        {step === 'password' && (
          <form onSubmit={handleSetup} className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('settings.twofa.setupDescription')}
            </p>
            
            <FormField label={t('settings.twofa.password')} required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </FormField>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseSetupModal}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('common.continue')}
              </Button>
            </div>
          </form>
        )}
        
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('settings.twofa.scanQR')}
            </p>
            
            {qrCodeDataUrl && (
              <div className="flex justify-center my-4">
                <img src={qrCodeDataUrl} alt="2FA QR Code" className="border p-2" />
              </div>
            )}
            
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                {t('settings.twofa.manualEntry')}
              </p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{secret}</code>
            </div>
            
            <FormField label={t('settings.twofa.verificationCode')} required>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
              />
            </FormField>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseSetupModal}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('settings.twofa.verify')}
              </Button>
            </div>
          </form>
        )}
        
        {step === 'codes' && showRecoveryCodes && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                {t('settings.twofa.recoveryCodesWarning')}
              </p>
              <p className="text-xs text-yellow-700">
                {t('settings.twofa.recoveryCodesDescription')}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">{t('settings.twofa.recoveryCodes')}</p>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <code key={index} className="text-xs bg-white px-2 py-1 rounded border">
                    {code}
                  </code>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={downloadRecoveryCodes}
              >
                {t('settings.twofa.downloadCodes')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCloseSetupModal}
              >
                {t('common.done')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable Modal */}
      <Modal
        open={disableModalOpen}
        onClose={() => {
          setDisableModalOpen(false);
          setPassword('');
        }}
      >
        <h2 className="text-lg font-semibold mb-4">{t('settings.twofa.disableTitle')}</h2>
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('settings.twofa.disableWarning')}
          </p>
          
          <FormField label={t('settings.twofa.password')} required>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </FormField>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDisableModalOpen(false);
                setPassword('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="danger">
              {t('settings.twofa.disable')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Regenerate Recovery Codes Modal */}
      <Modal
        open={regenerateModalOpen}
        onClose={() => {
          setRegenerateModalOpen(false);
          setPassword('');
        }}
      >
        <h2 className="text-lg font-semibold mb-4">{t('settings.twofa.regenerateTitle')}</h2>
        {!showRecoveryCodes ? (
          <form onSubmit={handleRegenerateRecoveryCodes} className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('settings.twofa.regenerateWarning')}
            </p>
            
            <FormField label={t('settings.twofa.password')} required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </FormField>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setRegenerateModalOpen(false);
                  setPassword('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('settings.twofa.regenerate')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                {t('settings.twofa.newCodesGenerated')}
              </p>
              <p className="text-xs text-yellow-700">
                {t('settings.twofa.oldCodesInvalid')}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">{t('settings.twofa.recoveryCodes')}</p>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <code key={index} className="text-xs bg-white px-2 py-1 rounded border">
                    {code}
                  </code>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={downloadRecoveryCodes}
              >
                {t('settings.twofa.downloadCodes')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setRegenerateModalOpen(false);
                  setShowRecoveryCodes(false);
                  setRecoveryCodes([]);
                }}
              >
                {t('common.done')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};