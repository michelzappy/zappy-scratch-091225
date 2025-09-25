# Messages API Cleanup Analysis

This document lists all occurrences of `/api/messages` endpoints found in the specified files.

## api.ts

- Line 150 → `() => this.client.get(`/api/messages/consultation/${consultationId}`, { params }),`
- Line 157 → `() => this.client.post(`/api/messages/consultation/${consultationId}`, data),`
- Line 165 → `() => this.client.post(`/api/messages/consultation/${data.consultation_id}`, data),`
- Line 167 → `: this.client.post('/api/messages', data),`
- Line 177 → `() => this.client.post(`/api/messages/consultation/${consultationId}`, data, {`
- Line 181 → `: this.client.post('/api/messages', data, {`
- Line 190 → `() => this.client.post(`/api/messages/consultation/${consultationId}/read`),`
- Line 198 → `() => this.client.post(`/api/messages/consultation/${data.consultation_id}`, data),`
- Line 200 → `: this.client.post('/api/messages/compose', data),`
- Line 203 → `getUnreadCount: () => this.client.get('/api/messages/unread-count'),`
- Line 204 → `getRecipients: () => this.client.get('/api/messages/recipients'),`
- Line 205 → `getAll: (params?: any) => this.client.get('/api/messages', { params }),`
- Line 206 → `getById: (id: string) => this.client.get(`/api/messages/${id}`),`
- Line 207 → `markRead: (id: string) => this.client.post(`/api/messages/${id}/read`),`
- Line 210 → `getMyConversations: () => this.client.get('/api/messages/conversations'),`
- Line 212 → `this.client.get(`/api/messages/conversations/${conversationId}/messages`),`
- Line 214 → `this.client.post(`/api/messages/conversations/${conversationId}/messages`, data),`

## page.tsx

**No direct `/api/messages` endpoint calls found.** 

The file uses the API client methods instead:
- Line 57 → `apiClient.messages.getAll()`
- Line 222 → `apiClient.messages.markRead(message.id)`
- Line 246 → `apiClient.messages.markRead(message.id)`

## Summary

- **Total `/api/messages` occurrences in api.ts**: 17 direct endpoint references
- **Total `/api/messages` occurrences in page.tsx**: 0 direct references (uses API client methods)

The page.tsx file follows the pattern of using the abstracted `apiClient.messages` methods rather than making direct API calls to `/api/messages` endpoints.