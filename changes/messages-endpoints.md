# Messages API Endpoints Refactoring

This document records all changes made to the messages API endpoints in `frontend/src/lib/api.ts`.

## Summary of Changes

Refactored messages API to prioritize consultation-scoped routes (`/api/consultations/:id/messages`) with legacy fallbacks to improve API structure and consistency.

## Method Changes

### getByConsultation
- **Old**: `/api/consultations/:id/messages` → `/api/messages/consultation/:id` → `/api/messages?consultationId=:id` (catch-all)
- **New**: `/api/consultations/:id/messages` → `/api/messages/consultation/:id`
- **Reason**: Removed raw `/api/messages` catch-all to avoid unintended behavior; keeping only one legacy fallback

### sendToConsultation
- **Old**: `/api/consultations/:id/messages` → `/api/messages/consultation/:id` → `/api/messages/send` → `/api/messages`
- **New**: `/api/consultations/:id/messages` → `/api/messages/consultation/:id`
- **Reason**: Simplified fallback chain; removed multiple redundant legacy endpoints

### create
- **Old**: Direct `/api/messages` call
- **New**: Consultation-first with fallback:
  - If `consultation_id` present: `/api/consultations/:id/messages` → `/api/messages/consultation/:id`
  - Otherwise: `/api/messages` (for admin/general use)
- **Reason**: Moved to consultation-scoped route when consultation context is available

### send (multipart)
- **Old**: Direct `/api/messages` call with multipart headers
- **New**: Consultation-first with fallback:
  - If `consultation_id`/`consultationId` in FormData: `/api/consultations/:id/messages` → `/api/messages/consultation/:id`
  - Otherwise: `/api/messages` (for admin/general use)
- **Reason**: Moved to consultation-scoped route when consultation context is available; maintains multipart header handling

### compose
- **Old**: Direct `/api/messages/compose` call
- **New**: Consultation-first with fallback:
  - If `consultation_id` present: `/api/consultations/:id/messages` → `/api/messages/consultation/:id`
  - Otherwise: `/api/messages/compose` (for general messaging)
- **Reason**: Moved to consultation-scoped route when consultation context is available

### markAsRead
- **Old**: `/api/consultations/:id/messages/read` → `/api/messages/consultation/:id/read`
- **New**: No change (already properly structured)
- **Reason**: Already using consultation-first approach with single legacy fallback

## Unchanged Methods

The following methods remain unchanged as they serve specific admin/portal/conversation purposes outside of consultation messaging:

- `getUnreadCount`: `/api/messages/unread-count`
- `getRecipients`: `/api/messages/recipients`
- `getAll`: `/api/messages` (admin tool)
- `getById`: `/api/messages/:id` (admin tool)
- `markRead`: `/api/messages/:id/read` (general message marking)
- `getMyConversations`: `/api/messages/conversations`
- `getConversationMessages`: `/api/messages/conversations/:id/messages`
- `sendMessage`: `/api/messages/conversations/:id/messages`

## Fallback Strategy

- **Primary**: `/api/consultations/:id/messages` (modern consultation-scoped route)
- **Secondary**: `/api/messages/consultation/:id` (single legacy fallback)
- **Removed**: Multiple redundant fallbacks and raw `/api/messages` catch-all calls

## Benefits

1. **Consistency**: All consultation-related messaging now uses consultation-scoped routes first
2. **Reduced complexity**: Simplified fallback chains from 3-4 attempts to 1-2 attempts
3. **Better separation**: Clear distinction between consultation messaging and general portal messaging
4. **Backward compatibility**: Maintained through single, well-defined legacy fallback routes
5. **Context awareness**: Methods now detect consultation context and route appropriately