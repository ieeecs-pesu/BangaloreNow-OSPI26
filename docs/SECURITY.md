# Security Configuration Guide

## Google Maps API Key Security

### Current Implementation
- ✅ API key moved to environment variables (`VITE_GOOGLE_MAPS_API_KEY`)
- ✅ Map ID moved to environment variables (`VITE_GOOGLE_MAPS_MAP_ID`)

### Google Maps API Security Options

#### 1. **HTTP Referrer Restrictions** (Recommended for Web Apps)
In Google Cloud Console:
1. Go to APIs & Services > Credentials
2. Select your API key
3. Under "Application restrictions", choose "HTTP referrers (web sites)"
4. Add allowed referrers:
   ```
   http://localhost:5173/*
   https://yourdomain.com/*
   https://*.yourdomain.com/*
   ```

#### 2. **API Restrictions**
Restrict the key to specific APIs:
- Maps JavaScript API
- Places API (if used)
- Geocoding API (if used)

#### 3. **Usage Quotas**
Set daily quotas to prevent unexpected charges:
- Set reasonable daily limits
- Enable quota alerts

### Environment Variables Security

#### Frontend (.env)
```bash
# ⚠️ Note: Frontend env vars are exposed to browsers
# Only put non-sensitive configuration here
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here
```

#### Backend (.env)
```bash
# ✅ Backend env vars are secure
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_SERVER=your_server
POSTGRES_DB=your_database
```

## Security Best Practices

### 1. **API Key Rotation**
- Rotate Google Maps API keys periodically
- Use different keys for development/staging/production

### 2. **Database Security**
- ✅ Database credentials in environment variables
- ✅ Use connection pooling
- ✅ Use parameterized queries (SQLAlchemy handles this)

### 3. **CORS Configuration**
- ✅ Properly configured in backend settings
- ✅ Restricts frontend origins

### 4. **Environment Files**
- ✅ .env files in .gitignore
- ✅ .env.example provided for setup
- ✅ Separate configs for different environments

## Production Deployment Checklist

### Frontend
- [ ] Use domain-restricted Google Maps API key
- [ ] Set production API_BASE_URL
- [ ] Enable HTTPS
- [ ] Configure CSP headers

### Backend
- [ ] Use managed database service
- [ ] Set strong database passwords
- [ ] Enable database SSL
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use secrets management service

### Infrastructure
- [ ] Use HTTPS everywhere
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Enable automated backups
- [ ] Use CDN for static assets

## Monitoring and Alerts

### Google Maps Usage
- Monitor API usage in Google Cloud Console
- Set up billing alerts
- Monitor quotas and limits

### Database
- Monitor connection counts
- Monitor query performance
- Set up backup monitoring

### Application
- Monitor error rates
- Set up performance monitoring
- Monitor API response times