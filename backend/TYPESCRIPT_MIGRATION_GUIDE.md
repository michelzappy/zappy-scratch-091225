# TypeScript Migration Guide

## 🎯 Your TypeScript Strategy: Gradual Migration

We've set up TypeScript to work **alongside** your existing JavaScript code. You can migrate file-by-file at your own pace without breaking anything.

## ✅ What's Already Set Up

1. **TypeScript Configuration** (`tsconfig.json`)
   - Configured for gradual migration with `allowJs: true`
   - Loose type checking initially (can tighten over time)
   - Path aliases for cleaner imports

2. **Type Definitions** (`src/types/`)
   - Core types already defined
   - Model interfaces for all entities
   - API response types

3. **Migration Helpers** (`src/utils/typescript-helpers.ts`)
   - Type guards and utilities
   - Wrappers for Express middleware

## 📋 Migration Approach: Start Small, Grow Gradually

### Step 1: Start with New Files (Easiest)
Any NEW file you create, make it TypeScript:

```typescript
// src/services/NewService.ts (note the .ts extension)
import { BaseService } from './base.service';
import { User } from '../types/models';

export class UserService extends BaseService {
  async findByEmail(email: string): Promise<User | null> {
    return await this.model.findOne({ where: { email } });
  }
}
```

### Step 2: Convert Utilities First (Low Risk)
Start with utility files that have no dependencies:

**Before (JavaScript):**
```javascript
// src/utils/validators.js
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

module.exports = { validateEmail };
```

**After (TypeScript):**
```typescript
// src/utils/validators.ts
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### Step 3: Convert Services (Medium Risk)
Services are good candidates because they're isolated:

**Before (JavaScript):**
```javascript
// src/services/AppointmentService.js
const BaseService = require('./base.service');

class AppointmentService extends BaseService {
  constructor() {
    super(Appointment, 'Appointment');
  }
  
  async getUpcoming(patientId) {
    return this.model.findAll({
      where: { 
        patientId,
        scheduledStart: { [Op.gte]: new Date() }
      }
    });
  }
}

module.exports = AppointmentService;
```

**After (TypeScript):**
```typescript
// src/services/AppointmentService.ts
import { BaseService } from './base.service';
import { Appointment } from '../types/models';
import { Op } from 'sequelize';

export class AppointmentService extends BaseService {
  constructor() {
    super(Appointment as any, 'Appointment'); // Use 'as any' temporarily for Sequelize models
  }
  
  async getUpcoming(patientId: string): Promise<Appointment[]> {
    return this.model.findAll({
      where: { 
        patientId,
        scheduledStart: { [Op.gte]: new Date() }
      }
    });
  }
}
```

### Step 4: Convert Routes (Higher Risk)
Routes interact with Express, so use the helpers:

**Before (JavaScript):**
```javascript
// src/routes/users.js
const router = require('express').Router();

router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

**After (TypeScript):**
```typescript
// src/routes/users.ts
import { Router } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/typescript-helpers';

const router = Router();

router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await userService.findById(req.params.id);
  res.success(user);
}));

export default router;
```

## 🛠️ Practical Migration Commands

### 1. Check TypeScript Errors Without Compiling
```bash
npm run typecheck
```

### 2. Rename a File from .js to .ts
```bash
# Rename the file
mv src/services/SomeService.js src/services/SomeService.ts

# Update imports (if using require)
# Change: const SomeService = require('./SomeService');
# To: import { SomeService } from './SomeService';
```

### 3. Generate Types from Database
```bash
# If using Sequelize-typescript in future:
npx sequelize-auto -h localhost -d yourdb -u user -x password --dialect postgres -o ./src/models
```

## 📦 Mixed Import/Export Strategy

During migration, you'll have both CommonJS and ES modules:

### In TypeScript files:
```typescript
// Use ES6 imports/exports
import { something } from './module';
export const myFunction = () => {};
```

### In JavaScript files:
```javascript
// Can still use require/module.exports
const { something } = require('./module');
module.exports = { myFunction };
```

### Importing JS from TS:
```typescript
// TypeScript can import CommonJS modules
import SomeJsModule = require('./someJsFile');
// or
const SomeJsModule = require('./someJsFile');
```

### Importing TS from JS:
```javascript
// JavaScript can require TypeScript modules (after compilation)
const { SomeClass } = require('./someTypescriptFile');
```

## 🎯 Priority Files to Migrate

### High Value, Low Risk (Start Here):
1. ✅ New files (always use .ts)
2. ✅ Utility functions
3. ✅ Configuration files
4. ✅ Services without complex dependencies

### Medium Priority:
5. ⏸️ Database models
6. ⏸️ Middleware
7. ⏸️ Routes with simple logic

### Low Priority (Can Stay JS):
8. ⏰ Complex routes
9. ⏰ Legacy code that works
10. ⏰ Third-party integrations

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module"
```typescript
// Add type definitions
npm install --save-dev @types/express @types/node

// Or declare module if no types exist
declare module 'some-old-package';
```

### Issue 2: Sequelize Model Types
```typescript
// Temporary solution: use 'any'
const Patient = require('../models/Patient') as any;

// Better solution: Define interfaces
interface PatientModel {
  findAll(options?: any): Promise<Patient[]>;
  findOne(options?: any): Promise<Patient | null>;
}
```

### Issue 3: Express Request/Response Types
```typescript
// Use our pre-defined types
import { AuthenticatedRequest } from '../types';

router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id; // TypeScript knows about user
});
```

## 📊 Migration Tracking

Create a migration checklist:

```markdown
## TypeScript Migration Status

### ✅ Completed
- [x] Configuration setup
- [x] Type definitions
- [x] typescript-helpers.ts

### 🔄 In Progress
- [ ] PatientService.ts (50%)
- [ ] validators.ts (planning)

### 📋 Planned
- [ ] AppointmentService.js → .ts
- [ ] auth.routes.js → .ts
- [ ] email.utils.js → .ts

### ⏰ Backlog (Keep as JS for now)
- [ ] Complex legacy routes
- [ ] Third-party integrations
```

## 💡 Pro Tips

1. **Don't migrate everything at once** - Your app works now, keep it working
2. **Use `// @ts-ignore` when stuck** - Better to have some TS than none
3. **Start with `any` types** - You can tighten them later
4. **Test after each file migration** - Catch issues early
5. **Commit working JS before converting** - Easy rollback if needed

## 🚀 Quick Start: Your First Migration

1. Pick a simple utility file
2. Copy it with .ts extension
3. Add basic types
4. Test it works
5. Delete the .js version
6. Commit!

Example - Convert a simple validator:
```bash
# 1. Copy file
cp src/utils/validators.js src/utils/validators.ts

# 2. Edit validators.ts and add types

# 3. Test
npm run typecheck

# 4. Update imports where used
# Change require('./validators') to import

# 5. Remove old file
rm src/utils/validators.js

# 6. Commit
git add -A && git commit -m "Migrate validators to TypeScript"
```

## Remember: TypeScript is a Tool, Not a Goal

The goal is better, safer code. If a file works fine in JavaScript and rarely changes, it's OK to leave it. Focus TypeScript migration on:
- Files you edit frequently
- New features
- Bug-prone areas
- Complex business logic

Your codebase can be partially TypeScript forever, and that's perfectly fine! 🎉
