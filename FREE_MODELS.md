# Free Models Guide for CV Tailor

This document lists verified free models available on OpenRouter for the CV generation pipeline.

## Current Configuration

The app is configured to use: **`meta-llama/llama-3.3-70b-instruct:free`**

## Recommended Free Models (February 2026)

### 1. **Llama 3.3 70B Instruct (FREE)** ⭐ Recommended
- **Model ID**: `meta-llama/llama-3.3-70b-instruct:free`
- **Cost**: $0 (completely free)
- **Performance**: Matches GPT-4 level performance
- **Context**: 128K tokens
- **Best for**: General tasks, structured output, CV generation
- **Rate limits**: 20 requests/min, 200 requests/day

### 2. **Mistral Small 3.1 24B (FREE)**
- **Model ID**: `mistralai/mistral-small-3.1-24b:free`
- **Cost**: $0
- **Performance**: Excellent for lighter tasks
- **Context**: 32K tokens
- **Best for**: Quick responses, simpler structured outputs

### 3. **Qwen3 Coder 480B (FREE)**
- **Model ID**: `qwen/qwen3-coder-480b:free`
- **Cost**: $0
- **Performance**: Strongest free coding model
- **Context**: 262K tokens
- **Best for**: Code-heavy projects, technical CVs

### 4. **DeepSeek R1 (FREE)** - Currently Unavailable
- **Model ID**: `deepseek/deepseek-r1:free`
- **Status**: ⚠️ No endpoints found (as of test date)
- **Note**: May become available again in the future

## How to Change Models

Update the `OPENROUTER_MODEL` environment variable in `.env.local`:

```bash
# Option 1: Llama 3.3 70B (GPT-4 level, recommended)
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Option 2: Mistral Small (lighter, faster)
OPENROUTER_MODEL=mistralai/mistral-small-3.1-24b:free

# Option 3: Qwen Coder (best for technical CVs)
OPENROUTER_MODEL=qwen/qwen3-coder-480b:free
```

## Rate Limits

All free models on OpenRouter share these limits:
- **20 requests per minute**
- **200 requests per day**
- No credit card required
- No spending limits

For the CV generation app, this translates to:
- **Agent 1 (Categorizer)**: 1 request per analysis
- **Agent 2 (CV Writers)**: N requests (where N = number of roles, typically 2-4)
- **Total per analysis**: ~3-5 requests
- **Max analyses per day**: ~40-60 (well within limits)

## Production Considerations

⚠️ **For production use**, consider:
1. Using a paid model for better reliability
2. Implementing request queueing for multiple concurrent users
3. Caching results to minimize API calls
4. Setting up failover to alternative models

## Testing the Model

A test script is available at `test-deepseek.js` (update the MODEL constant to test different models).

## Sources

- [OpenRouter Free Models](https://openrouter.ai/collections/free-models)
- [OpenRouter Models Ranked 2026](https://www.teamday.ai/blog/best-free-ai-models-openrouter-2026)
- [OpenRouter Free Models List](https://costgoat.com/pricing/openrouter-free-models)
