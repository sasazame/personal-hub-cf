/**
 * Centralized timing configuration for E2E tests
 * Provides consistent timeouts and retry strategies across all tests
 */

export interface TimingConfig {
  navigation: {
    timeout: number;
    waitUntil: 'load' | 'domcontentloaded' | 'networkidle';
  };
  element: {
    visible: number;
    clickable: number;
    fillable: number;
  };
  network: {
    response: number;
    idle: number;
  };
  retry: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  react: {
    hydration: number;
    stateUpdate: number;
    renderCycle: number;
  };
}

/**
 * Validate that all timing values are positive
 */
function validateTimingConfig(config: TimingConfig): void {
  const validatePositive = (value: number, name: string) => {
    if (value <= 0) {
      throw new Error(`Invalid timing configuration: ${name} must be positive, got ${value}`);
    }
  };

  // Validate all numeric values
  Object.entries(config).forEach(([section, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'number') {
          validatePositive(value, `${section}.${key}`);
        }
      });
    }
  });
}

/**
 * Get timing configuration based on environment and browser
 */
export function getTimingConfig(browserName?: string, isCI?: boolean): TimingConfig {
  // Base configuration
  const baseConfig: TimingConfig = {
    navigation: {
      timeout: 30000,
      waitUntil: 'networkidle',
    },
    element: {
      visible: 10000,
      clickable: 8000,
      fillable: 8000,
    },
    network: {
      response: 15000,
      idle: 5000,
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
    },
    react: {
      hydration: 10000,
      stateUpdate: 3000,
      renderCycle: 1000,
    },
  };

  // CI environment adjustments
  if (isCI || process.env.CI) {
    baseConfig.navigation.timeout = 45000;
    baseConfig.element.visible = 15000;
    baseConfig.element.clickable = 12000;
    baseConfig.element.fillable = 12000;
    baseConfig.network.response = 20000;
    baseConfig.retry.maxAttempts = 5;
    baseConfig.react.hydration = 15000;
  }

  // Browser-specific adjustments
  if (browserName === 'webkit') {
    // Safari needs longer timeouts
    baseConfig.navigation.timeout *= 1.5;
    baseConfig.element.visible *= 1.5;
    baseConfig.element.clickable *= 1.5;
    baseConfig.react.hydration *= 1.5;
  } else if (browserName === 'firefox') {
    // Firefox needs moderate adjustments
    baseConfig.navigation.timeout *= 1.2;
    baseConfig.element.visible *= 1.2;
    baseConfig.network.response *= 1.2;
  }

  // Validate configuration before returning
  validateTimingConfig(baseConfig);
  
  return baseConfig;
}

/**
 * Calculate exponential backoff delay with jitter
 * 
 * NOTE: This implementation uses Math.random() for jitter calculation,
 * which is acceptable for test timing but should NOT be used for 
 * security-sensitive operations like cryptographic delays or rate limiting
 * in production environments.
 */
export function calculateBackoffDelay(
  attempt: number,
  config: TimingConfig['retry']
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd in test environments
  const jitter = Math.random() * 0.2 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Get adaptive timeout based on previous attempts
 */
export function getAdaptiveTimeout(
  baseTimeout: number,
  attemptNumber: number,
  maxMultiplier: number = 3
): number {
  // Increase timeout with each retry, up to maxMultiplier
  const multiplier = Math.min(1 + (attemptNumber - 1) * 0.5, maxMultiplier);
  return Math.floor(baseTimeout * multiplier);
}

/**
 * Interface for timing preset values
 */
interface TimingPreset {
  timeout: number;
  retry: number;
}

/**
 * Timing presets for common operations
 */
export const TimingPresets: Record<'quick' | 'standard' | 'slow' | 'verySlow', TimingPreset> = {
  quick: { timeout: 3000, retry: 1 },
  standard: { timeout: 10000, retry: 3 },
  slow: { timeout: 30000, retry: 5 },
  verySlow: { timeout: 60000, retry: 7 },
} as const;

/**
 * Helper to log timing information for debugging
 */
export function logTiming(
  operation: string,
  startTime: number,
  success: boolean,
  attempt?: number
): void {
  const duration = Date.now() - startTime;
  const attemptInfo = attempt ? ` (attempt ${attempt})` : '';
  const status = success ? '✓' : '✗';
  
  if (process.env.DEBUG_TIMING || process.env.DEBUG) {
    console.log(`[Timing] ${status} ${operation}${attemptInfo}: ${duration}ms`);
  }
  
  // Always log slow operations
  if (duration > 10000) {
    console.warn(`[Slow Operation] ${operation} took ${duration}ms${attemptInfo}`);
  }
}