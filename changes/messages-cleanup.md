# Messages API Cleanup - Changes Documentation

This document details all the changes made during the messages API cleanup process to replace direct `/api/messages` calls with consultation-scoped endpoints and implement proper fallback patterns.

## Files Modified

### 1. `frontend/src/lib/api.ts`

**Lines Updated:** 205-209 (updated method signatures)

**Old Code:**
```typescript
    getAll: (params?: any) => this.client.get('/api/messages', { params }),
    getById: (id: string) => this.client.get(`/api/messages/${id}`),
    markRead: (id: string) => this.client.post(`/api/messages/${id}/read`),
```

**New Code:**
```typescript
    getAll: (consultationId?: string, params?: any) => 
      consultationId 
        ? this.requestWithFallback([
            () => this.client.get(`/api/consultations/${consultationId}/messages`, { params }),
            () => this.client.get(`/api/messages/consultation/${consultationId}`, { params }),
          ])
        : this.client.get('/api/messages', { params }),
    getById: (id: string, consultationId?: string) => 
      consultationId
        ? this.requestWithFallback([
            () => this.client.get(`/api/consultations/${consultationId}/messages/${id}`),
            () => this.client.get(`/api/messages/${id}`),
          ])
        : this.client.get(`/api/messages/${id}`),
    markRead: (id: string, consultationId?: string) => 
      consultationId
        ? this.requestWithFallback([
            () => this.client.post(`/api/consultations/${consultationId}/messages/${id}/read`),
            () => this.client.post(`/api/messages/${id}/read`),
          ])
        : this.client.post(`/api/messages/${id}/read`),
```

**Changes Made:**
- Updated `getAll()` to accept optional `consultationId` parameter and use consultation-scoped endpoints with fallback when provided
- Updated `getById()` to accept optional `consultationId` parameter and use consultation-scoped endpoints with fallback when provided  
- Updated `markRead()` to accept optional `consultationId` parameter and use consultation-scoped endpoints with fallback when provided
- All methods maintain backward compatibility by falling back to original `/api/messages` endpoints when no `consultationId` is provided

### 2. `frontend/src/app/portal/messages/page.tsx`

**Line Updated:** 57

**Old Code:**
```typescript
      const data = await apiClient.messages.getAll({
        type: filter !== 'all' && filter !== 'unread' ? filter : undefined,
        unread: filter === 'unread' ? true : undefined
      });
```

**New Code:**
```typescript
      const data = await apiClient.messages.getAll(undefined, {
        type: filter !== 'all' && filter !== 'unread' ? filter : undefined,
        unread: filter === 'unread' ? true : undefined
      });
```

**Changes Made:**
- Updated `apiClient.messages.getAll()` call to match new signature with optional `consultationId` parameter
- Passed `undefined` for `consultationId` since this is a portal-wide messages view without specific consultation context
- This ensures the call uses the fallback behavior and retrieves all messages via `/api/messages`

## Summary

- **Total direct `/api/messages` endpoint references updated:** 3 in `api.ts`
- **Total API client method calls updated:** 1 in `page.tsx`
- **Pattern implemented:** Consultation-first approach with fallback to legacy endpoints
- **Backward compatibility:** Maintained for existing code that doesn't provide `consultationId`
- **Fallback behavior:** Uses `requestWithFallback` helper to try consultation-scoped endpoints first, then fall back to legacy `/api/messages` routes

## Implementation Notes

The cleanup follows the pattern specified in the manual:
- Primary endpoints now use consultation-scoped routes (`/api/consultations/{id}/messages/*`)
- Secondary fallback uses intermediate consultation routes (`/api/messages/consultation/{id}/*`)
- Legacy `/api/messages/*` endpoints are preserved as final fallback or for non-consultation contexts
- All changes maintain backward compatibility with existing code