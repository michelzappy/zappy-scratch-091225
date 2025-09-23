# Scaling Guide: Supporting 100,000 Users

## 📊 Current Architecture vs. Scaled Architecture

### Current Setup (< 1,000 users)
```
[Frontend] → [Single Backend] → [Single Database]
```

### Scaled Setup (100,000+ users)
```
[CDN] → [Load Balancer] → [Multiple Backend Instances]
                ↓
        [Cache Layer (Redis)]
                ↓
        [Database Cluster]
                ↓
        [Message Queue]
                ↓
        [Background Workers]
```

---

## 🎯 Key Metrics for 100,000 Users

### Expected Load
- **Daily Active Users (DAU):** ~30,000 (30% of total)
- **Peak Concurrent Users:** ~5,000
- **API Requests/Second:** ~500-1,000
- **Database Queries/Second:** ~2,000
- **WebSocket Connections:** ~5,000
- **Storage:** ~1TB for documents/images
- **Bandwidth:** ~5TB/month

---

## 1. Database Scaling Strategy

### A. Supabase Scaling (Recommended)
```sql
-- Enable connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';

-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_consultations_status_date 
ON consultations(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_unread 
ON messages(consultation_id, read) 
WHERE read = false;

CREATE INDEX CONCURRENTLY idx_patients_user_active 
ON patients(user_id) 
WHERE deleted_at IS NULL;

-- Partition large tables
CREATE TABLE messages_2024 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### B. Database Optimization
```javascript
// backend/src/config/database-optimized.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000,   // 30 second query timeout
});

// Read replica for read-heavy operations
const readPool = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
  max: 30,
});

module.exports = { pool, readPool };
```

---

## 2. Backend Scaling

### A. Horizontal Scaling with PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telehealth-api',
    script: './src/app.js',
    instances: 'max',        // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true
  }]
};
```

### B. Load Balancer Configuration (Nginx)
```nginx
# /etc/nginx/sites-available/telehealth
upstream backend {
    least_conn;
    server backend1.example.com:3001;
    server backend2.example.com:3001;
    server backend3.example.com:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name api.telehealth.com;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}
```

---

## 3. Caching Implementation

### A. Redis Caching Layer
```javascript
// backend/src/services/cache.service.js
const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: 6379,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async get(key) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value, ttl = 3600) {
    await this.redis.setex(
      key, 
      ttl, 
      JSON.stringify(value)
    );
  }

  async invalidate(pattern) {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  // Cache frequently accessed data
  async getCachedUser(userId) {
    const cacheKey = `user:${userId}`;
    let user = await this.get(cacheKey);
    
    if (!user) {
      user = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
      await this.set(cacheKey, user, 3600); // Cache for 1 hour
    }
    
    return user;
  }

  // Cache consultation counts
  async getCachedStats(providerId) {
    const cacheKey = `stats:provider:${providerId}`;
    let stats = await this.get(cacheKey);
    
    if (!stats) {
      stats = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM consultations 
        WHERE provider_id = $1
      `, [providerId]);
      
      await this.set(cacheKey, stats, 300); // Cache for 5 minutes
    }
    
    return stats;
  }
}

module.exports = new CacheService();
```

---

## 4. Frontend Optimization

### A. Next.js Performance Config
```javascript
// frontend/next.config.js
module.exports = {
  images: {
    domains: ['cdn.telehealth.com'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Optimize bundle size
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lodash', 'date-fns'],
  },
  
  // Static Generation for marketing pages
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'development';
  },
};
```

### B. Component Optimization
```tsx
// frontend/src/components/OptimizedPatientList.tsx
import { memo, useMemo, useCallback } from 'react';
import { useVirtual } from '@tanstack/react-virtual';

const PatientList = memo(({ patients }) => {
  const parentRef = useRef();
  
  // Virtual scrolling for large lists
  const rowVirtualizer = useVirtual({
    size: patients.length,
    parentRef,
    estimateSize: useCallback(() => 80, []),
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${rowVirtualizer.totalSize}px` }}>
        {rowVirtualizer.virtualItems.map(virtualRow => (
          <PatientRow 
            key={virtualRow.index}
            patient={patients[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
});
```

---

## 5. Message Queue for Background Jobs

### A. Bull Queue Implementation
```javascript
// backend/src/queues/consultation.queue.js
const Queue = require('bull');
const nodemailer = require('nodemailer');

const consultationQueue = new Queue('consultation', {
  redis: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

// Process consultation notifications
consultationQueue.process('send-notification', async (job) => {
  const { patientEmail, consultationId, type } = job.data;
  
  // Send email notification
  await emailService.send({
    to: patientEmail,
    subject: 'Consultation Update',
    template: type,
    data: { consultationId }
  });
  
  return { sent: true };
});

// Add job to queue
const addConsultationNotification = async (data) => {
  await consultationQueue.add('send-notification', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};

module.exports = { consultationQueue, addConsultationNotification };
```

---

## 6. WebSocket Scaling with Socket.io

```javascript
// backend/src/sockets/scaled-socket.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const setupScaledSocket = (io) => {
  const pubClient = createClient({ 
    host: process.env.REDIS_HOST 
  });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  // Sticky sessions for Socket.io
  io.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
      socket.sessionID = sessionID;
      socket.join(sessionID);
    }
    next();
  });

  return io;
};
```

---

## 7. CDN & Static Assets

### A. Cloudflare Configuration
```javascript
// frontend/src/lib/cdn.js
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

export const getCDNUrl = (path) => {
  if (process.env.NODE_ENV === 'production') {
    return `${CDN_URL}${path}`;
  }
  return path;
};

// Use in components
<img src={getCDNUrl('/images/logo.png')} />
```

### B. Image Optimization
```javascript
// Use Next.js Image component with CDN
import Image from 'next/image';

<Image
  src={getCDNUrl('/images/hero.jpg')}
  width={1200}
  height={600}
  loading="lazy"
  placeholder="blur"
  quality={85}
/>
```

---

## 8. Monitoring & Performance

### A. Application Performance Monitoring
```javascript
// backend/src/monitoring/apm.js
const apm = require('elastic-apm-node').start({
  serviceName: 'telehealth-api',
  secretToken: process.env.ELASTIC_APM_TOKEN,
  serverUrl: process.env.ELASTIC_APM_URL,
  captureBody: 'all',
  errorOnAbortedRequests: true,
  transactionSampleRate: 1.0,
});

// Custom metrics
const trackAPIMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    apm.addLabels({
      'http.status_code': res.statusCode,
      'http.method': req.method,
      'http.path': req.path,
      'response.time': duration,
    });
    
    if (duration > 1000) {
      apm.captureError(new Error(`Slow API: ${req.path} took ${duration}ms`));
    }
  });
  
  next();
};
```

---

## 9. Cost Optimization

### Infrastructure Costs (Monthly)
| Service | Specification | Cost |
|---------|--------------|------|
| **Frontend (Vercel)** | Pro plan | $20 |
| **Backend (AWS EC2)** | 3x t3.large | $180 |
| **Database (RDS)** | db.r5.xlarge | $340 |
| **Redis (ElastiCache)** | cache.r6g.large | $120 |
| **CDN (Cloudflare)** | Pro plan | $20 |
| **Storage (S3)** | 1TB | $23 |
| **Monitoring** | DataDog/NewRelic | $99 |
| **Total** | | **~$802/month** |

### Cost per User
- **100,000 users:** $0.008 per user/month
- **Break-even:** ~1,000 paying users at $1/month

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Redis caching
- [ ] Implement database connection pooling
- [ ] Add database indexes
- [ ] Set up CDN for static assets
- [ ] Implement basic monitoring

### Phase 2: Optimization (Week 3-4)
- [ ] Implement query optimization
- [ ] Add response caching
- [ ] Set up message queues
- [ ] Optimize frontend bundle size
- [ ] Implement lazy loading

### Phase 3: Scaling (Week 5-6)
- [ ] Set up load balancer
- [ ] Configure auto-scaling
- [ ] Implement database read replicas
- [ ] Set up WebSocket clustering
- [ ] Add comprehensive monitoring

### Phase 4: Testing (Week 7-8)
- [ ] Load testing with k6
- [ ] Stress testing
- [ ] Failover testing
- [ ] Performance profiling
- [ ] Security audit

---

## Load Testing Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 5000 },  // Peak load
    { duration: '10m', target: 5000 }, // Stay at peak
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function() {
  // Test login
  let loginRes = http.post('https://api.telehealth.com/auth/login', {
    email: 'test@example.com',
    password: 'password',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });
  
  // Test dashboard
  let dashboardRes = http.get('https://api.telehealth.com/patient/dashboard', {
    headers: { 'Authorization': `Bearer ${loginRes.json('token')}` },
  });
  
  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

---

## Key Takeaways

1. **Start with caching** - Biggest performance gain for least effort
2. **Database is usually the bottleneck** - Optimize queries and add indexes
3. **Use CDN aggressively** - Offload static content
4. **Monitor everything** - You can't optimize what you don't measure
5. **Scale horizontally** - Multiple smaller servers > one large server
6. **Queue background jobs** - Don't make users wait for emails/notifications
7. **Implement gradually** - Don't try to optimize everything at once

## Estimated Timeline: 8 weeks
## Estimated Cost: ~$800/month for 100,000 users
## Revenue needed: 800-1,000 paying subscribers
