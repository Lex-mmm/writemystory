# 🔒 SECURITY & SECRETS PROTECTION

## ⚠️ IMPORTANT: Files Protected from Git

The following types of files are automatically excluded from Git commits to protect sensitive information:

### 🚫 **Never Committed to Git:**

#### **Environment Files:**
- `.env*` - All environment files containing API keys and secrets
- `config*.local` - Local configuration files
- `*secret*`, `*token*`, `*key*`, `*password*`, `*credentials*` - Any files containing these keywords

#### **Setup Documentation (Contains Secrets):**
- `EMAIL_SYSTEM_TEST_RESULTS.md` - Contains Postmark API token
- `YOUR_SPECIFIC_DNS_RECORDS.md` - Contains DKIM keys and DNS values
- `POSTMARK_*.md` - Contains Postmark configuration details
- `CLOUDFLARE_*.md` - Contains Cloudflare setup information
- All `*_SETUP*.md`, `*_GUIDE*.md`, `*_CHECKLIST*.md` files

#### **Test & Debug Files:**
- `test-*.js`, `*-test.js` - Test scripts that may contain API calls
- `*.sh` - Shell scripts with potentially sensitive commands
- `check-*.js`, `diagnose-*.js` - Diagnostic scripts
- `comprehensive-test.sh` - Contains test commands with API endpoints

#### **Backup & Temporary Files:**
- `*.backup`, `*.bak`, `*.tmp` - Backup files that may contain sensitive data

---

## 🔑 **Secrets Currently in Use:**

### **Postmark Email Service:**
- **API Token**: `26d0735b-7dfa-4c62-af60-83362b5651ab`
- **Location**: `.env.local` file (protected)
- **Variable**: `POSTMARK_SERVER_API_TOKEN`

### **Supabase Database:**
- **Keys**: In `.env.local` file (protected)
- **Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

### **DNS Records (Public but Sensitive):**
- **DKIM Key**: Contains RSA public key for email authentication
- **Domain Verification**: Postmark verification token
- **Location**: Cloudflare DNS (not in code)

---

## ✅ **Safe to Commit:**

### **Source Code:**
- All `.tsx`, `.ts`, `.js` files in `app/`, `components/`, `lib/` directories
- `package.json`, `package-lock.json` (dependencies)
- `next.config.js`, `tsconfig.json` (configuration without secrets)

### **Documentation:**
- `README.md` (general project information)
- This `SECURITY.md` file

---

## 🛡️ **Security Best Practices:**

### **Before Committing:**
1. **Always run**: `git status` to check what files are being added
2. **Review changes**: `git diff` to see exactly what content is being committed
3. **Check for secrets**: Search for API keys, tokens, passwords in files

### **If Secrets Were Accidentally Committed:**
1. **Immediately rotate/regenerate** all exposed secrets
2. **Use Git history rewriting** to remove secrets from history
3. **Force push** the cleaned history (dangerous - coordinate with team)

### **Environment Variables:**
- **Development**: Use `.env.local` (never commit)
- **Production**: Set in hosting platform (Render, Vercel, etc.)
- **Never hardcode** secrets in source code

---

## 🚨 **Emergency Procedures:**

### **If API Token is Compromised:**
1. **Login to Postmark** → Account Settings → API Tokens
2. **Revoke the old token**: `26d0735b-7dfa-4c62-af60-83362b5651ab`
3. **Generate new token**
4. **Update `.env.local`** with new token
5. **Update production environment** variables

### **If Database Keys are Compromised:**
1. **Login to Supabase** → Settings → API
2. **Reset API keys**
3. **Update all environment files**
4. **Redeploy application**

---

## 📋 **Verification Checklist:**

Before any Git commit, verify:
- [ ] No `.env*` files in `git status`
- [ ] No API tokens visible in `git diff`
- [ ] No setup guides with secrets in commit
- [ ] All sensitive files match `.gitignore` patterns

---

**Last Updated:** $(date)  
**Security Level:** 🔒 High Protection Active
