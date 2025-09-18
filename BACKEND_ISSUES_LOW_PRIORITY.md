# LOW Priority Backend Issues

## Overview
These are low priority backend issues that can be addressed after critical and medium priority items are resolved.

## Status: 🟢 LOW - Nice-to-have improvements and cleanup

---

## Group 1: Development & Testing Cleanup
**Priority**: LOW - Code quality and development experience

### Issues:
- **Seed patient records in init.sql** (`database/init.sql:139`)
  - Current: Hard-coded sample patients in production schema
  - Impact: Test data might leak to production
  - Solution: Move to separate development seed files
  - Note: This is also listed in medium priority for data integrity, but cleanup aspect is low priority

### Implementation Plan:
1. **Separate Development Seeds**:
   ```sql
   -- Create database/seeds/development/
   -- Move test patients to dev-only seeds
   -- Keep production init.sql clean
   ```

2. **Environment-Specific Seeding**:
   ```javascript
   // Update seed scripts to check NODE_ENV
   if (process.env.NODE_ENV === 'development') {
     // Load development test data
   }
   ```

### Estimated Effort: 2-3 hours

---

## Group 2: Frontend TODO Cleanup
**Priority**: LOW - UI polish and completion

### Issues:
- **TODO left in UI flow** (`frontend/src/app/patient/health-quiz/page.tsx:296`)
  - Current: TODO comment in health quiz flow
  - Impact: Incomplete user experience feature
  - Solution: Complete the TODO implementation or remove if not needed

### Implementation Plan:
1. **Review TODO Context**:
   - Examine the specific TODO at line 296
   - Determine if feature is needed for MVP
   - Either implement or remove with documentation

2. **TODO Audit**:
   - Search codebase for other TODO comments
   - Prioritize and categorize remaining TODOs
   - Create tracking for future cleanup

### Estimated Effort: 1-2 hours

---

## Group 3: Code Quality Improvements
**Priority**: LOW - Technical debt and maintainability

### Potential Improvements:
These aren't explicitly listed in the review but are good practices:

1. **Error Handling Standardization**:
   - Consistent error response formats across all routes
   - Proper HTTP status codes
   - Structured error logging

2. **API Documentation**:
   - OpenAPI/Swagger documentation for all endpoints
   - Request/response examples
   - Authentication requirements documentation

3. **Performance Optimizations**:
   - Database query optimization
   - Response caching where appropriate
   - Connection pooling tuning

4. **Monitoring & Observability**:
   - Health check endpoints
   - Metrics collection
   - Performance monitoring

### Implementation Plan:
1. **Phase 1 - Documentation**:
   - Add OpenAPI specs for existing routes
   - Document authentication flows
   - Create API usage examples

2. **Phase 2 - Performance**:
   - Profile database queries
   - Add caching layer where beneficial
   - Optimize response times

3. **Phase 3 - Monitoring**:
   - Add health check endpoints
   - Implement metrics collection
   - Set up alerting for critical issues

### Estimated Effort: 20-30 hours (spread over time)

---

## Group 4: Security Enhancements
**Priority**: LOW - Additional security hardening

### Potential Improvements:
1. **Rate Limiting**:
   - Implement rate limiting on all public endpoints
   - Different limits for authenticated vs anonymous users
   - Proper error responses for rate limit exceeded

2. **Input Validation**:
   - Comprehensive input validation on all endpoints
   - Sanitization of user inputs
   - SQL injection prevention (if not already implemented)

3. **Security Headers**:
   - CORS configuration review
   - Security headers (HSTS, CSP, etc.)
   - Content type validation

### Implementation Plan:
1. **Rate Limiting Implementation**:
   ```javascript
   // Add express-rate-limit middleware
   const rateLimit = require('express-rate-limit');
   
   const apiLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: 'Too many requests from this IP'
   });
   ```

2. **Security Audit**:
   - Review all endpoints for security best practices
   - Add security testing to CI/CD pipeline
   - Regular security dependency updates

### Estimated Effort: 8-12 hours

---

## Summary

### Total Estimated Effort: 31-47 hours

### Priority Order:
1. **Development Cleanup** (2-3h) - Quick wins
2. **Frontend TODO** (1-2h) - User experience
3. **Security Enhancements** (8-12h) - Hardening
4. **Code Quality** (20-30h) - Long-term maintainability

### When to Address:
- **After Critical Issues**: Don't start these until missing routes are implemented
- **After Medium Issues**: Complete file management and database integrity first
- **During Maintenance Windows**: These are perfect for slower development periods
- **As Technical Debt**: Address incrementally during feature development

### Success Criteria:
- Clean development environment setup
- All TODOs resolved or documented
- Security best practices implemented
- Comprehensive API documentation
- Performance benchmarks established
- Monitoring and alerting in place

---

## Notes

### Not Urgent But Important:
These issues won't break the application but will improve:
- Developer experience
- Code maintainability
- Security posture
- Performance characteristics
- Operational visibility

### Future Considerations:
- Regular security audits
- Performance monitoring
- Code quality metrics
- Technical debt tracking
- Documentation maintenance