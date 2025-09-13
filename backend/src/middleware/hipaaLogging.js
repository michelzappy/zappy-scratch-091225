import { getDatabase } from '../config/database.js';
import { apiLogs } from '../models/index.js';

export const hipaaAuditLogger = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log HIPAA-relevant actions asynchronously
    if (shouldLogForHIPAA(req.path, req.method)) {
      setImmediate(() => {
        logHIPAAAction({
          userId: req.user?.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          requestBody: sanitizeRequestBody(req.body),
          responseBody: sanitizeResponseBody(data, res.statusCode),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          responseTime
        });
      });
    }

    originalSend.call(this, data);
  };

  next();
};

function shouldLogForHIPAA(path, method) {
  const protectedPaths = [
    '/api/consultations',
    '/api/messages',
    '/api/patients',
    '/api/files',
    '/api/providers',
    '/api/treatment'
  ];
  
  return protectedPaths.some(protectedPath => path.includes(protectedPath));
}

function sanitizeRequestBody(body) {
  if (!body) return null;
  
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'token'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function sanitizeResponseBody(data, statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        success: !!parsed.success,
        recordCount: Array.isArray(parsed.data) ? parsed.data.length : (parsed.data ? 1 : 0),
        timestamp: new Date().toISOString()
      };
    } catch {
      return { responseSize: data?.length || 0 };
    }
  }
  return null;
}

async function logHIPAAAction(logData) {
  try {
    const db = getDatabase();
    await db.insert(apiLogs).values({
      userId: logData.userId,
      method: logData.method,
      path: logData.path,
      statusCode: logData.statusCode,
      requestBody: logData.requestBody,
      responseBody: logData.responseBody,
      ipAddress: logData.ipAddress
    });
  } catch (error) {
    console.error('Failed to log HIPAA audit trail:', error);
  }
}
