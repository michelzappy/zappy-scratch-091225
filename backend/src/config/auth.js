import { v4 as uuidv4 } from 'uuid';

// Generate UUID for local auth fallback
export function generateUserId() {
  return uuidv4();
}
