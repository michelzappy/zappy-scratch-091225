# Rate Limiting Search Results

## Auth Flows

### Direct API Client Auth Calls
- `src/app/patient/register/page.tsx` — line 39 → `apiClient.auth.register({...})`

### Auth Service Calls (which internally call API endpoints)
- `src/app/portal/login/page.tsx` — line 45 → `authService.login(email, password, 'provider')`
- `src/app/patient/login/page.tsx` — line 24 → `authService.loginPatient(email, password)`  
- `src/app/provider/login/page.tsx` — line 30 → `authService.loginProvider(formData.email, formData.password)`
- `src/app/admin/login/page.tsx` — line 32 → `authService.loginAdmin(formData.email, formData.password, formData.twoFactorCode)`

## Upload Flows

### File Upload API Calls
- `src/components/MessageChat.tsx` — line 199 → `apiClient.files.upload(formData)`
- `src/app/patient/profile/page.tsx` — line 220 → `apiClient.files.upload(formData)`

### Message Send with FormData
- `src/app/patient/messages/page.tsx` — line 107 → `apiClient.messages.sendMessage(selectedConversation.id, formData)`

### Message Send (Text Only - No FormData)
- `src/components/MessageChat.tsx` — line 134 → `apiClient.messages.sendToConsultation(consultationId, payload)` 
- `src/components/MessageChat.tsx` — line 203 → `apiClient.messages.sendToConsultation(consultationId, {...})`

## API Implementation Details

The following endpoints in `src/lib/api.ts` use `multipart/form-data`:
- Line 112: File upload endpoint
- Line 181: Message send endpoint  
- Line 184: Message send endpoint
- Line 189: Message send endpoint
- Line 325: File upload endpoint

## Notes

1. **Auth flows**: Most login/register calls go through `authService` which internally calls `/api/auth/login` via `api.post()`, except for patient registration which directly uses `apiClient.auth.register()`.

2. **Upload flows**: File uploads use `apiClient.files.upload()` with FormData, and message sends with attachments use `apiClient.messages.sendMessage()` with FormData.

3. **Rate limiting considerations**: All these endpoints should be protected with rate limiting, especially:
   - Auth endpoints to prevent brute force attacks
   - File upload endpoints to prevent abuse
   - Message sending to prevent spam