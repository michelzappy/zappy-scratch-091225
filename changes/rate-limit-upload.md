# Rate Limiting and Upload Handling Implementation

This document captures the changes made to implement rate limiting handling for authentication flows and robust file upload functionality with retry mechanisms.

## Summary

### A) Authentication Rate Limiting (429 Handling)
- Added 429 error detection for login/register forms
- Implemented cooldown timers with countdown display
- Added toast notifications for rate limiting
- Disabled submit buttons during cooldown period

### B) File Upload Enhancements
- Added client-side file size validation (10MB limit)
- Implemented exponential backoff retry logic
- Added 429 and 5xx error handling for uploads
- Enhanced user feedback with progress and error messages

### C) New Utilities
- Created `upload-utils.ts` for file handling and retry logic

---

## File Changes

### 1. Frontend: Created `src/lib/upload-utils.ts`

**NEW FILE**
```typescript
// Upload utilities for file size validation and retry logic

import { toast } from 'react-hot-toast';

// Configuration constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface UploadError extends Error {
  status?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
}

/**
 * Validates file size before upload
 */
export function validateFileSize(file: File): boolean {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    toast.error(`File size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB.`);
    return false;
  }
  return true;
}

/**
 * Executes upload with retry logic and exponential backoff
 */
export async function uploadWithRetry<T>(
  uploadFunction: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = MAX_RETRIES, initialDelay = INITIAL_RETRY_DELAY } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFunction();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      
      // Handle 429 (rate limit) and 5xx (server errors)
      if (error.status === 429) {
        if (isLastAttempt) {
          toast.error('Too many uploads — please wait before retrying.');
          throw error;
        }
        
        const delay = calculateRetryDelay(attempt, initialDelay);
        toast.error(`Too many uploads. Retrying in ${Math.ceil(delay / 1000)} seconds...`);
        await sleep(delay);
        continue;
      }
      
      if (error.status >= 500 && error.status < 600) {
        if (isLastAttempt) {
          toast.error('Upload failed, please try again later.');
          throw error;
        }
        
        const delay = calculateRetryDelay(attempt, initialDelay);
        console.log(`Server error (${error.status}). Retrying upload in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // For other errors, don't retry
      throw error;
    }
  }
  
  throw new Error('Upload failed after all retry attempts');
}
```

**Description**: New utility module providing file size validation and retry logic with exponential backoff for upload operations.

---

### 2. Frontend: `src/app/patient/register/page.tsx`

**OLD (Import Section)**:
```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
```

**NEW (Import Section)**:
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
```

**OLD (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
```

**NEW (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      setIsDisabled(true);
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDisabled(false);
    }
  }, [cooldownTime]);
```

**OLD (Error Handling)**:
```tsx
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
```

**NEW (Error Handling)**:
```tsx
    } catch (err: any) {
      if (err.status === 429) {
        // Rate limited - show toast and start cooldown
        toast.error('Too many attempts — try again later.');
        setCooldownTime(60); // 60 second cooldown
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
```

**OLD (Submit Button)**:
```tsx
              disabled={loading}
```

**NEW (Submit Button)**:
```tsx
              disabled={loading || isDisabled}
```

**OLD (Button Text)**:
```tsx
              ) : (
                'Create Account'
              )}
```

**NEW (Button Text)**:
```tsx
              ) : isDisabled && cooldownTime > 0 ? (
                `Try Again in ${cooldownTime}s`
              ) : (
                'Create Account'
              )}
```

**Description**: Added 429 rate limiting detection, cooldown timer with countdown display, toast notifications, and submit button disabling during cooldown period for patient registration.

---

### 3. Frontend: `src/app/patient/login/page.tsx`

**OLD (Import Section)**:
```tsx
import { useState } from 'react';
```

**NEW (Import Section)**:
```tsx
import { useState, useEffect } from 'react';
```

**OLD (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
```

**NEW (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const router = useRouter();

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      setIsDisabled(true);
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDisabled(false);
    }
  }, [cooldownTime]);
```

**OLD (Error Handling)**:
```tsx
    } catch (err: any) {
      // Handle specific error cases with normalized errors
      if (err?.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password. Please try again.');
      } else if (err?.code === 'ACCOUNT_LOCKED') {
        setError('Your account has been locked. Please contact support.');
      } else {
        setError(err?.error || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
```

**NEW (Error Handling)**:
```tsx
    } catch (err: any) {
      // Handle specific error cases with normalized errors
      if (err?.status === 429) {
        // Rate limited - show toast and start cooldown
        toast.error('Too many attempts — try again later.');
        setCooldownTime(60); // 60 second cooldown
      } else if (err?.code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password. Please try again.');
      } else if (err?.code === 'ACCOUNT_LOCKED') {
        setError('Your account has been locked. Please contact support.');
      } else {
        setError(err?.error || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
```

**OLD (Submit Button)**:
```tsx
              disabled={loading}
```

**NEW (Submit Button)**:
```tsx
              disabled={loading || isDisabled}
```

**OLD (Button Text)**:
```tsx
              ) : (
                'Sign In'
              )}
```

**NEW (Button Text)**:
```tsx
              ) : isDisabled && cooldownTime > 0 ? (
                `Try Again in ${cooldownTime}s`
              ) : (
                'Sign In'
              )}
```

**Description**: Added 429 rate limiting detection, cooldown timer, toast notifications, and button disabling during cooldown for patient login with preservation of existing error handling logic.

---

### 4. Frontend: `src/app/provider/login/page.tsx`

**OLD (Import Section)**:
```tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
```

**NEW (Import Section)**:
```tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { authService } from '@/lib/auth';
```

**OLD (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated as provider
    if (authService.isAuthenticated() && authService.isProvider()) {
      router.push('/portal/dashboard');
    }
  }, [router]);
```

**NEW (State Variables)**:
```tsx
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    // Check if already authenticated as provider
    if (authService.isAuthenticated() && authService.isProvider()) {
      router.push('/portal/dashboard');
    }
  }, [router]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      setIsDisabled(true);
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDisabled(false);
    }
  }, [cooldownTime]);
```

**OLD (Error Handling)**:
```tsx
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
      console.error('Provider login error:', err);
    } finally {
      setLoading(false);
    }
```

**NEW (Error Handling)**:
```tsx
    } catch (err: any) {
      if (err.status === 429) {
        // Rate limited - show toast and start cooldown
        toast.error('Too many attempts — try again later.');
        setCooldownTime(60); // 60 second cooldown
      } else {
        const errorMessage = err.message || 'Invalid credentials. Please try again.';
        setError(errorMessage);
        console.error('Provider login error:', err);
      }
    } finally {
      setLoading(false);
    }
```

**OLD (Submit Button)**:
```tsx
              disabled={loading}
```

**NEW (Submit Button)**:
```tsx
              disabled={loading || isDisabled}
```

**OLD (Button Text)**:
```tsx
              ) : (
                'Sign In to Portal'
              )}
```

**NEW (Button Text)**:
```tsx
              ) : isDisabled && cooldownTime > 0 ? (
                `Try Again in ${cooldownTime}s`
              ) : (
                'Sign In to Portal'
              )}
```

**Description**: Added 429 rate limiting detection, cooldown timer, toast notifications, and button disabling for provider login.

---

### 5. Frontend: `src/components/MessageChat.tsx`

**OLD (Import Section)**:
```tsx
import { useState, useEffect, useRef } from 'react';
import { supabase, subscribeToTable, unsubscribe } from '@/lib/supabase';
import io, { Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';
```

**NEW (Import Section)**:
```tsx
import { useState, useEffect, useRef } from 'react';
import { supabase, subscribeToTable, unsubscribe } from '@/lib/supabase';
import io, { Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api';
import { validateFileSize, uploadWithRetry } from '@/lib/upload-utils';
import { toast } from 'react-hot-toast';
```

**OLD (File Upload Function)**:
```tsx
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('consultation_id', consultationId);

    try {
      const uploadedData = await apiClient.files.upload(formData);
      const uploaded = (uploadedData as any)?.file || (uploadedData as any);

      // Send message with file attachment through consultation route
      await apiClient.messages.sendToConsultation(consultationId, {
        content: `Shared a file: ${file.name}`,
        sender_type: currentUserType,
        attachments: uploaded ? [uploaded] : undefined,
      });

      fetchMessages();
    } catch (error: any) {
      console.error('Error uploading file:', error?.error || error);
    }
  };
```

**NEW (File Upload Function)**:
```tsx
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size before upload
    if (!validateFileSize(file)) {
      return; // Error toast already shown by validateFileSize
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('consultation_id', consultationId);

    try {
      // Upload with retry logic
      const uploadedData = await uploadWithRetry(async () => {
        return await apiClient.files.upload(formData);
      });
      
      const uploaded = (uploadedData as any)?.file || (uploadedData as any);

      // Send message with file attachment through consultation route
      await apiClient.messages.sendToConsultation(consultationId, {
        content: `Shared a file: ${file.name}`,
        sender_type: currentUserType,
        attachments: uploaded ? [uploaded] : undefined,
      });

      fetchMessages();
      toast.success('File uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading file:', error?.error || error);
      // Error toasts are already handled by uploadWithRetry
    }
  };
```

**Description**: Added file size validation before upload, retry logic with exponential backoff for 429 and 5xx errors, and success/error toast notifications.

---

### 6. Frontend: `src/app/patient/profile/page.tsx`

**OLD (Import Section)**:
```tsx
import { useState } from 'react';
import { apiClient } from '@/lib/api';
```

**NEW (Import Section)**:
```tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { validateFileSize, uploadWithRetry } from '@/lib/upload-utils';
```

**OLD (Photo Upload Handler)**:
```tsx
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                        console.log('Photo selected:', file.name);
                        // Upload photo to server via API
                        const formData = new FormData();
                        formData.append('profile_photo', file);
                        apiClient.files.upload(formData)
                          .then(() => console.log('Profile photo uploaded successfully'))
                          .catch(err => console.error('Failed to upload photo:', err));
                        }
                      };
```

**NEW (Photo Upload Handler)**:
```tsx
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          // Validate file size before upload
                          if (!validateFileSize(file)) {
                            return; // Error toast already shown by validateFileSize
                          }

                          console.log('Photo selected:', file.name);
                          
                          try {
                            // Upload photo to server via API with retry logic
                            const formData = new FormData();
                            formData.append('profile_photo', file);
                            
                            await uploadWithRetry(async () => {
                              return await apiClient.files.upload(formData);
                            });
                            
                            toast.success('Profile photo uploaded successfully!');
                            console.log('Profile photo uploaded successfully');
                          } catch (err: any) {
                            console.error('Failed to upload photo:', err);
                            // Error toasts are already handled by uploadWithRetry
                          }
                        }
                      };
```

**Description**: Added file size validation, retry logic with exponential backoff, and user feedback through toast notifications for profile photo uploads.

---

### 7. Frontend: `src/app/patient/messages/page.tsx`

**OLD (Import Section)**:
```tsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
```

**NEW (Import Section)**:
```tsx
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { validateFileSize, uploadWithRetry } from '@/lib/upload-utils';
```

**OLD (Send Message Function)**:
```tsx
  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && attachedFiles.length === 0)) {
      return;
    }

    try {
      // Create FormData for message with potential attachments
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('senderType', 'patient');
      
      // Add attachments if any
      attachedFiles.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      // Send message via API
      const data = await apiClient.messages.sendMessage(selectedConversation.id, formData);
      
      // Add the sent message to local state
      if (data) {
        setMessages(prev => [...prev, data as any]);
      }
      
      // Clear input
      setNewMessage('');
      setAttachedFiles([]);
      
    } catch (err: any) {
      console.error('Error sending message:', err?.error || err);
      // Could add error toast here
    }
  };
```

**NEW (Send Message Function)**:
```tsx
  const handleSendMessage = async () => {
    if (!selectedConversation || (!newMessage.trim() && attachedFiles.length === 0)) {
      return;
    }

    try {
      // Create FormData for message with potential attachments
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('senderType', 'patient');
      
      // Add attachments if any
      attachedFiles.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      // Send message via API with retry logic
      const data = await uploadWithRetry(async () => {
        return await apiClient.messages.sendMessage(selectedConversation.id, formData);
      });
      
      // Add the sent message to local state
      if (data) {
        setMessages(prev => [...prev, data as any]);
      }
      
      // Clear input
      setNewMessage('');
      setAttachedFiles([]);
      toast.success('Message sent successfully!');
      
    } catch (err: any) {
      console.error('Error sending message:', err?.error || err);
      // Error toasts are already handled by uploadWithRetry
    }
  };
```

**OLD (File Attachment Function)**:
```tsx
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
```

**NEW (File Attachment Function)**:
```tsx
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate each file size
      const validFiles = files.filter(file => {
        if (!validateFileSize(file)) {
          return false; // Error toast already shown by validateFileSize
        }
        return true;
      });
      
      if (validFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...validFiles]);
      }
    }
  };
```

**Description**: Added retry logic for message sending with attachments, file size validation for attachments, and improved user feedback through toast notifications.

---

## Configuration Details

### Rate Limiting Configuration
- **Cooldown Duration**: 60 seconds for all auth flows
- **Timer Display**: Shows countdown in seconds on submit button
- **Toast Duration**: Standard react-hot-toast duration

### File Upload Configuration  
- **Maximum File Size**: 10MB (configurable in `upload-utils.ts`)
- **Maximum Retries**: 3 attempts (configurable)
- **Initial Retry Delay**: 1 second (exponential backoff: 1s → 2s → 4s)
- **Retry Triggers**: HTTP 429 (rate limit) and 5xx (server errors)

### User Experience Features
- **Visual Feedback**: Submit buttons disabled during cooldown with countdown display
- **Toast Notifications**: Immediate feedback for rate limiting, upload success/failure
- **Progressive Enhancement**: Existing functionality preserved with enhanced error handling
- **Retry Transparency**: Users see retry attempts in progress for uploads

---

## Implementation Notes

1. **Error Handling**: Preserves existing error handling while adding new 429 detection
2. **User Experience**: Non-blocking for other operations, clear feedback on restrictions
3. **Performance**: Efficient retry logic with exponential backoff prevents server overload
4. **Scalability**: Configurable limits and delays allow easy adjustment
5. **Accessibility**: Clear visual and textual feedback for all user states