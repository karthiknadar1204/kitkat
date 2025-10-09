# Backend Deployment Guide

## 📦 Docker Deployment

### Files Created:
- `Dockerfile` - Container configuration
- `.dockerignore` - Files to exclude from build
- `docker-compose.yml` - Container orchestration

---

## 🚀 Quick Start

### 1. Build Docker Image
```bash
cd server
docker build -t kyra-backend .
```

### 2. Run with Docker
```bash
docker run -p 3002:3002 \
  -e DATABASE_URL="your_postgres_url" \
  -e MONGODB_DATABASE_URL="your_mongo_url" \
  -e JWT_SECRET="your_secret" \
  -e FRONTEND_URL="https://your-frontend.com" \
  kyra-backend
```

### 3. Or Use Docker Compose
```bash
# Create .env file with your credentials
docker-compose up -d
```

---

## 🌐 Deployment Options

### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DATABASE_URL=your_postgres_url
railway variables set MONGODB_DATABASE_URL=your_mongo_url
railway variables set JWT_SECRET=your_secret
railway variables set FRONTEND_URL=your_frontend_url

# Deploy
railway up
```

### Option 2: Render
1. Connect GitHub repository
2. Select "Docker" as environment
3. Add environment variables:
   - `DATABASE_URL`
   - `MONGODB_DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
4. Deploy

### Option 3: Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set DATABASE_URL=your_postgres_url
fly secrets set MONGODB_DATABASE_URL=your_mongo_url
fly secrets set JWT_SECRET=your_secret
fly secrets set FRONTEND_URL=your_frontend_url

# Deploy
fly deploy
```

### Option 4: AWS ECS
1. Push Docker image to ECR
2. Create ECS task definition
3. Configure environment variables
4. Deploy to ECS cluster

### Option 5: DigitalOcean App Platform
1. Connect GitHub repository
2. Select Dockerfile
3. Add environment variables
4. Deploy

---

## 🔐 Required Environment Variables

```env
# PostgreSQL (Neon/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database

# MongoDB (Atlas)
MONGODB_DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/database

# JWT Secret (generate secure random string)
JWT_SECRET=your_secure_random_secret_here

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database created (Neon/Supabase)
- [ ] MongoDB database created (Atlas)
- [ ] Environment variables configured
- [ ] JWT_SECRET is secure and random
- [ ] FRONTEND_URL is set correctly
- [ ] Migrations run (if needed)
- [ ] MongoDB initialized (collections/indexes)

---

## 🧪 Test Deployment

```bash
# Health check
curl https://your-deployed-url.com/api/auth/health

# Test registration
curl -X POST https://your-deployed-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"test123"}'

# Test login
curl -X POST https://your-deployed-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🔍 Troubleshooting

### Container won't start:
- Check logs: `docker logs <container_id>`
- Verify environment variables are set
- Ensure databases are accessible

### Database connection fails:
- Verify DATABASE_URL format
- Check MongoDB connection string
- Ensure IP whitelist allows your deployment platform

### CORS errors:
- Verify FRONTEND_URL is correct
- Check CORS configuration in index.js

---

## 📊 Monitoring

### Health Endpoint:
```javascript
// Add to routes/auth.route.js
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});
```

### Logs:
```bash
# Docker logs
docker logs -f <container_name>

# Railway logs
railway logs

# Render logs
# Available in dashboard
```

---

## 🚀 Production Tips

1. **Use SSL/TLS**: Always deploy with HTTPS
2. **Set NODE_ENV**: `NODE_ENV=production`
3. **Rate Limiting**: Add rate limiting middleware
4. **Monitoring**: Use services like Sentry, DataDog
5. **Backups**: Regular database backups
6. **Scaling**: Consider horizontal scaling for high traffic

---

## 📦 Dockerfile Explanation

```dockerfile
FROM node:20-alpine          # Lightweight Node.js image
WORKDIR /app                 # Set working directory
COPY package*.json ./        # Copy dependency files
RUN npm ci --only=production # Install production deps only
COPY . .                     # Copy application code
EXPOSE 3002                  # Expose port 3002
CMD ["node", "index.js"]     # Start application
```

---

## 🎯 Next Steps After Deployment

1. ✅ Update SDK `.env` with deployed backend URL
2. ✅ Test all endpoints
3. ✅ Monitor logs for errors
4. ✅ Set up automated backups
5. ✅ Configure domain name
6. ✅ Set up CI/CD pipeline

---

**Deployment Status:** Ready ✅  
**Docker Build:** Configured ✅  
**Environment:** Production-ready ✅

