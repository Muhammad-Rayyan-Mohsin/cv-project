# Vercel Production Deployment - Free Model Configuration

## ✅ Code Changes Pushed

The code has been pushed to `main` with the free model configuration.

## ⚠️ Required: Update Vercel Environment Variables

To use the free model in production, you need to update the environment variable in Vercel:

### Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Navigate to your `cv-project` project

2. **Update Environment Variable**
   - Go to: **Settings** → **Environment Variables**
   - Find `OPENROUTER_MODEL` or add it if it doesn't exist
   - Set the value to: `deepseek/deepseek-r1-0528:free`
   - Apply to: **Production, Preview, and Development**

3. **Redeploy**
   - Go to the **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Select **Redeploy**
   - Choose **Use existing Build Cache** (faster)

### Alternative: Deploy via CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Set environment variable
vercel env add OPENROUTER_MODEL production
# When prompted, enter: deepseek/deepseek-r1-0528:free

# Redeploy
vercel --prod
```

### Alternative: Use Vercel Dashboard Auto-Redeploy

Simply push to `main` again (Vercel auto-deploys on push):

```bash
git commit --allow-empty -m "Trigger Vercel redeploy for env var changes"
git push origin main
```

## 🔍 Verify Production Deployment

After redeployment, check the logs:

1. Go to: **Deployments** → Select latest deployment → **Logs**
2. Make a test CV analysis on production
3. Look for logs like:
   ```
   [OpenRouter - Categorizer] Starting API call
   Model: deepseek/deepseek-r1-0528:free
   ```

## 📋 Current Free Model Configuration

- **Model**: `deepseek/deepseek-r1-0528:free`
- **Cost**: $0 (completely free)
- **Rate Limits**: 20 req/min, 200 req/day
- **Sufficient for**: ~40-60 CV analyses per day

## 🚨 Important Notes

1. **No costs** - This model is completely free on OpenRouter
2. **Rate limits** - Free tier has reasonable limits for a CV generation app
3. **Production ready** - DeepSeek R1 has GPT-4 level performance
4. **Fallback** - If the free model is unavailable, consider:
   - `meta-llama/llama-3.3-70b-instruct:free`
   - `mistralai/mistral-small-3.1-24b:free`

## 📚 Additional Resources

- [FREE_MODELS.md](FREE_MODELS.md) - Complete guide on free models
- [OpenRouter Models](https://openrouter.ai/models) - Browse all available models
- [test-deepseek.js](test-deepseek.js) - Local testing script
