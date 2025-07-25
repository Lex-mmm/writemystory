# 🔧 Render.com Deployment Troubleshooting Guide

## 🚨 **Common Render Build Issues & Solutions**

### **Issue: Module Resolution Failures**

Render.com has stricter module resolution than local development. Here are the most common fixes:

---

## 🛠️ **Quick Fixes to Try:**

### **1. Check Environment Variables on Render**

Make sure these are set in your Render dashboard:

```
POSTMARK_SERVER_API_TOKEN=26d0735b-7dfa-4c62-af60-83362b5651ab
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

### **2. Add Build Command Override**

In Render dashboard → Settings → Build & Deploy:

**Build Command:**
```bash
npm ci && npm run build
```

**Start Command:**
```bash
npm start
```

### **3. Node.js Version Lock**

Add to your `package.json`:
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### **4. Install Missing Dependencies**

Sometimes Render doesn't install all dependencies. Add to build command:
```bash
npm ci --force && npm run build
```

---

## 🔍 **Debugging Steps:**

### **Check Render Logs:**
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for specific error messages

### **Common Error Patterns:**

#### **"Module not found: postmarkService"**
```bash
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### **"Cannot resolve '../../../lib/postmarkService'"**
```bash
# Solution: Use absolute imports instead
# Change from: import { PostmarkService } from '../../../lib/postmarkService';
# To: import { PostmarkService } from '@/lib/postmarkService';
```

#### **"Build failed because of webpack errors"**
```bash
# Solution: Add webpack config to next.config.js
```

---

## 🔧 **Render-Specific Fixes:**

### **1. Update next.config.js**

Add this to handle Render's build environment:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postmark']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('postmark');
    }
    return config;
  },
  // Render.com specific optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true
};

module.exports = nextConfig;
```

### **2. Add .nvmrc File**

Create `.nvmrc` in project root:
```
18.17.0
```

### **3. Update package.json Scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "npm run build"
  }
}
```

---

## 🚀 **Deployment Checklist:**

### **Before Deploying:**
- [ ] All environment variables set in Render
- [ ] Node.js version specified in package.json
- [ ] Dependencies up to date
- [ ] Build works locally with `npm run build`

### **Render Dashboard Settings:**
- [ ] **Runtime**: Node.js 18
- [ ] **Build Command**: `npm ci && npm run build`
- [ ] **Start Command**: `npm start`
- [ ] **Auto-Deploy**: Enabled from main branch

### **Environment Variables in Render:**
- [ ] `POSTMARK_SERVER_API_TOKEN`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NODE_ENV=production`

---

## 🔥 **Emergency Fix (If All Else Fails):**

### **Temporary Workaround:**

If the PostmarkService import is causing issues, temporarily comment it out:

**In `app/api/questions/route.ts`:**
```typescript
// import { PostmarkService } from '../../../lib/postmarkService';

// Temporary email function for deployment
async function sendQuestionsViaEmail(questions: any[], teamMembers: any[], storyId: string) {
  console.log('Email sending temporarily disabled for deployment');
  return { success: true, message: 'Email temporarily disabled' };
}
```

This will let you deploy and test the webhook, then we can fix the email sending afterward.

---

## 📋 **What to Check First:**

1. **Render Logs** - Go to dashboard and check build logs
2. **Environment Variables** - Verify all secrets are set
3. **Node Version** - Make sure Render uses Node 18
4. **Dependencies** - Check if all packages installed correctly

## 🆘 **Next Steps:**

Please share the **exact error message** from Render's build logs, and I'll provide a specific fix for your situation!

**To get logs:**
1. Go to https://dashboard.render.com
2. Click your service
3. Go to "Logs" tab
4. Copy the error message

I'll help you fix the exact issue! 🎯
