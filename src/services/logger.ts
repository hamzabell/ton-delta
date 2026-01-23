/* eslint-disable */

import newrelic from 'newrelic';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export const Logger = {
  log: async (level: LogLevel, component: string, action: string, positionId: string | null = null, details: Record<string, any> = {}) => {
    // Console output for immediate feedback
    const timestamp = new Date().toISOString();
    const posSuffix = positionId ? ` [${positionId}]` : '';
    console.log(`[${timestamp}] [${level}] [${component}]${posSuffix} ${action}`, JSON.stringify(details));

    // Persist to New Relic
    try {
      newrelic.recordCustomEvent('AuditLog', {
        level,
        component,
        action,
        positionId,
        ...details,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Failed to write audit log to New Relic:', err);
    }
  },

  info: (component: string, action: string, positionId?: string, details?: Record<string, any>) => 
    Logger.log('INFO', component, action, positionId || null, details || {}),

  warn: (component: string, action: string, positionId?: string, details?: Record<string, any>) => 
    Logger.log('WARN', component, action, positionId || null, details || {}),

  error: (component: string, action: string, positionId?: string, details?: Record<string, any>) => 
    Logger.log('ERROR', component, action, positionId || null, details || {})
};
