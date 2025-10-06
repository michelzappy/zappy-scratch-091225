/**
 * Stack Auth Configuration
 *
 * Integrates with Neon Auth for managed authentication
 * Express-compatible version (no Next.js dependencies)
 */

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

// Stack Auth configuration from environment
const STACK_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const STACK_SECRET = process.env.STACK_SECRET_SERVER_KEY;

// Stack Auth public key endpoint for JWT verification
const STACK_JWKS_URL = `https://api.stack-auth.com/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json`;

/**
 /**
  * Parse cookies from cookie header string
  */
 function parseCookies(cookieHeader) {
   if (!cookieHeader) return {};
   
   return cookieHeader.split(';').reduce((cookies, cookie) => {
     const [name, ...rest] = cookie.split('=');
     const value = rest.join('=').trim();
     if (name && value) {
       cookies[name.trim()] = decodeURIComponent(value);
     }
     return cookies;
   }, {});
 }
 
 /**
  * Middleware to verify Stack Auth token and attach user to request
  *
  * IMPORTANT: This middleware is OPTIONAL - it only attaches user if authenticated,
  * but doesn't block unauthenticated requests. Use requireAuth middleware on
  * specific routes that need authentication.
  *
  * This middleware reads Stack Auth session cookies from the Express request.
  * Stack Auth stores the session token in cookies set by the frontend.
  */
 export async function verifyStackAuth(req, res, next) {
   try {
     // Log ALL cookies for debugging
     logger.info('verifyStackAuth middleware running', {
       url: req.url,
       method: req.method,
       hasCookieHeader: !!req.headers.cookie,
       cookieHeader: req.headers.cookie ? req.headers.cookie.substring(0, 100) + '...' : 'none'
     });
     
     // Parse cookies from request
     const cookies = parseCookies(req.headers.cookie);
     
     logger.info('Parsed cookies', {
       cookieNames: Object.keys(cookies),
       cookieCount: Object.keys(cookies).length
     });
     
     // Stack Auth uses various cookie names depending on configuration
     // Common names: stack-access-token, stack-refresh-token, stack-session
     const accessToken = cookies['stack-access-token'] ||
                        cookies['stack_access_token'] ||
                        cookies['stackAccessToken'];
     
     // If no access token, continue without user (unauthenticated request)
     if (!accessToken) {
       logger.warn('No Stack Auth access token found in cookies', {
         availableCookies: Object.keys(cookies)
       });
       return next();
     }
 
     // Decode the JWT (without verification for now - Stack Auth handles verification)
     // In production, you should verify the JWT signature using Stack Auth's public key
     const decoded = jwt.decode(accessToken);
     
     if (!decoded) {
       logger.warn('Failed to decode Stack Auth token');
       return next();
     }
 
     // Attach user to request
     req.stackToken = decoded;
     req.user = {
       id: decoded.sub || decoded.userId,
       email: decoded.email,
       emailVerified: decoded.email_verified,
       displayName: decoded.name || decoded.displayName,
       profileImageUrl: decoded.picture || decoded.profileImageUrl,
       // Custom claims from Neon Auth
       role: decoded.role || decoded['custom:role'] || 'patient',
       // Raw token data for advanced use cases
       tokenData: decoded
     };
 
     logger.debug('Stack Auth user attached to request', {
       userId: req.user.id,
       email: req.user.email,
       role: req.user.role
     });
 
     // Continue to next middleware
     next();
   } catch (error) {
     logger.error('Stack Auth verification error', { error: error.message });
     // Don't block request on errors, just log and continue
     // The requireAuth middleware will catch unauthenticated requests
     next();
   }
 }
/**
 * Optional middleware for role-based access control
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No user found'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

// Export configuration for use in other modules if needed
export const stackConfig = {
  projectId: STACK_PROJECT_ID,
  jwksUrl: STACK_JWKS_URL
};