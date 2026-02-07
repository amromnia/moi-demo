# Express Server Setup

This project now uses an Express server to handle API proxying instead of Vercel serverless functions. This allows you to deploy anywhere (VPS, Docker, cloud providers, etc.).

## Architecture

- **Frontend**: React app built with Vite
- **Backend**: Express server that proxies requests to MOI API
- **Development**: Both servers run concurrently
- **Production**: Express serves the built frontend and handles API proxy

## Server Routes

### `/token` - Token endpoint
Proxies authentication requests to `https://webapi.moi.gov.eg/token`

### `/api/proxy` - Generic proxy endpoint
Proxies any MOI API endpoint using the `target` query parameter:
```
/api/proxy?target=/api/MoiProfileApi/GetProfile&param1=value1
```

### `/api/*` - Direct API routes
Catch-all route that proxies directly to MOI API:
```
/api/MoiProfileApi/GetProfile
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Run development servers (runs both Express backend and Vite frontend):
```bash
npm run dev
```

This starts:
- Express dev server on `http://localhost:3001` (backend API proxy)
- Vite dev server on `http://localhost:5173` (frontend)
- Vite proxies API calls to Express server

## Production Build & Deployment

1. Build the frontend:
```bash
npm run build
```

2. Run the production server:
```bash
npm run server
```

Or use the combined command:
```bash
npm start
```

The production server will:
- Serve the built React app from the `/dist` folder
- Handle API proxy requests to MOI API
- Run on port 3000 (or PORT environment variable)

## Deployment Options

### VPS / Cloud Server
```bash
npm install --production
npm start
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server"]
```

### Environment Variables
- `MMM_PORT`: Server port (default: 3000)

## Benefits over Vercel Functions

✅ Deploy anywhere (not locked to Vercel)  
✅ No serverless function cold starts  
✅ Full control over server configuration  
✅ No CORS issues (server-side API calls)  
✅ Can add middleware, sessions, etc.  
✅ Works with any hosting provider
