# Vercel AI Gateway Setup - Complete & Database Integrated ✅

## 🎯 Overview
Vercel AI Gateway provides a **unified API** to multiple AI providers with:
- 📊 Usage monitoring & analytics
- 💰 Budget tracking & cost optimization
- ⚖️ Load balancing across providers
- 🔄 Automatic fallbacks on errors
- 🚀 Performance optimization
- 💾 **NEW: Integrated with Supabase `ai_conversations` & `ai_messages` tables**

---

## ✅ Latest Updates (January 7, 2026)

### Database Integration
- ✅ Integrated with Supabase `ai_conversations` table
- ✅ Integrated with Supabase `ai_messages` table
- ✅ Auto-save all conversations with tool calls and results
- ✅ Cross-device conversation sync via Realtime
- ✅ Conversation persistence and history
- ✅ RLS (Row Level Security) enabled for privacy

### New Unified AI Service
**File**: `src/lib/unified-ai-service.ts` (500+ lines)

**Features**:
- Auto-conversation creation and management
- Message persistence to Supabase
- Streaming and non-streaming support
- Tool calling with result tracking
- Context items support
- Auto-model selection (speed/quality/cost priority)
- Vision-capable chat (auto-selects GPT-4/Gemini)

**Store Integration**:
All actions added to Zustand store:
- `sendAIMessage()` - Quick chat with auto-save
- `sendVisionMessage()` - Vision chat
- `getAIConversations()` - Load user conversations
- `deleteAIConversation()` - Delete with cascade
- `archiveAIConversation()` - Archive/unarchive
- `pinAIConversation()` - Pin/unpin
- `getAIConversationWithMessages()` - Full conversation
- `updateAIConversationTitle()` - Update title

---

## ✅ Installation Complete

### 1. Packages Installed
```bash
✓ ai - Vercel AI SDK core
✓ @ai-sdk/openai - OpenAI provider
✓ @ai-sdk/anthropic - Anthropic (Claude) provider
✓ @ai-sdk/google - Google (Gemini) provider
```

### 2. Environment Variables
Added to `.env.local`:
```env
AI_GATEWAY_API_KEY=vck_[YOUR_VERCEL_AI_GATEWAY_API_KEY]
```

**Note**: Get your API key from Vercel Dashboard → AI Gateway → API Keys

### 3. Files Created
- ✅ `src/lib/ai-gateway.ts` - Gateway configuration & model selection
- ✅ `scripts/test-ai-gateway.ts` - Test script
- ✅ Updated `src/lib/ai-providers.ts` - Added AI Gateway as default provider

---

## 🚀 Usage Examples

### Example 1: Quick Chat (Auto-Save to DB)
```typescript
import { useAppStore } from '@/lib/store';

const { sendAIMessage } = useAppStore();

// Send message - auto-saves to Supabase
const result = await sendAIMessage(
  'Explain React hooks in simple terms',
  {
    streaming: false,
    priority: 'speed', // or 'quality' or 'cost'
  }
);

console.log(result.text); // AI response
console.log(result.conversationId); // Conversation ID for follow-up
console.log(result.selectedModel); // Auto-selected model
```

### Example 2: Streaming Chat
```typescript
const result = await sendAIMessage(
  'Write a poem about TypeScript',
  {
    streaming: true,
    priority: 'quality', // Uses Claude or GPT-4
  }
);

// Stream response
for await (const chunk of result.textStream) {
  console.log(chunk); // Print each chunk
}
```

### Example 3: Continue Conversation
```typescript
// First message
const firstResult = await sendAIMessage('Hello AI!');
const conversationId = firstResult.conversationId;

// Follow-up message (maintains context)
const secondResult = await sendAIMessage(
  'What did I just say?',
  { conversationId }
);
```

### Example 4: Vision Chat (Image Analysis)
```typescript
import { useAppStore } from '@/lib/store';

const { sendVisionMessage } = useAppStore();

const result = await sendVisionMessage(
  'What is in this image?',
  'https://example.com/image.jpg',
  { streaming: false }
);

console.log(result.text); // AI description of image
```

### Example 5: Load Conversation History
```typescript
const { getAIConversations, getAIConversationWithMessages } = useAppStore();

// Get all conversations
const conversations = await getAIConversations({
  includeArchived: false,
  limit: 20,
});

// Get specific conversation with messages
const conversation = await getAIConversationWithMessages(conversationId);
console.log(conversation.title);
console.log(conversation.messages); // Array of messages
```

### Example 6: Manage Conversations
```typescript
const { 
  deleteAIConversation, 
  archiveAIConversation, 
  pinAIConversation,
  updateAIConversationTitle 
} = useAppStore();

// Archive conversation
await archiveAIConversation(conversationId, true);

// Pin to top
await pinAIConversation(conversationId, true);

// Update title
await updateAIConversationTitle(conversationId, 'React Hooks Discussion');

// Delete (cascades to messages)
await deleteAIConversation(conversationId);
```

### Example 7: Component Integration
```typescript
'use client';

import { useAppStore } from '@/lib/store';
import { useState } from 'react';

export function ChatComponent() {
  const { sendAIMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await sendAIMessage(input, {
        streaming: true,
        priority: 'speed',
      });

      // Stream response
      for await (const chunk of result.textStream) {
        setResponse(prev => prev + chunk);
      }
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      <div>{response}</div>
    </div>
  );
}
```

---

## 🚀 Usage (Legacy - Direct Gateway Access)

### Basic Text Generation
```typescript
import { streamText } from 'ai';
import { getGatewayModel } from '@/lib/ai-gateway';

const result = streamText({
  model: getGatewayModel('gpt-4-turbo'),
  prompt: 'Your prompt here',
});

for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

### Auto-Select Best Model
```typescript
import { selectBestModel, getGatewayModel } from '@/lib/ai-gateway';

// Select based on priority
const modelId = selectBestModel({ 
  priority: 'speed', // or 'quality' or 'cost'
  requiresVision: false 
});

const result = streamText({
  model: getGatewayModel(modelId),
  prompt: 'Your prompt here',
});
```

### Available Models
| Model ID | Provider | Best For |
|----------|----------|----------|
| `gemini-1.5-flash` | Google | Speed & Cost |
| `gemini-1.5-pro` | Google | Balance |
| `gpt-4-turbo` | OpenAI | Vision & Complex Tasks |
| `gpt-3.5-turbo` | OpenAI | Cost Optimization |
| `claude-3-opus` | Anthropic | Quality & Reasoning |
| `claude-3-sonnet` | Anthropic | Balance |
| `claude-3-haiku` | Anthropic | Speed |

---

## 🧪 Testing

Run the test script:
```bash
npm install tsx -D
npx tsx scripts/test-ai-gateway.ts
```

**Expected output:**
- ✅ Fast response test (Gemini Flash)
- ✅ Quality response test (Claude Sonnet)
- ✅ Cost-effective test (GPT-3.5)
- 📊 Token usage & costs for each

---

## 🎨 Integration with TV25

### 1. Chat Assistant
The AI Gateway is now integrated with your AI provider system in Settings.

### 2. Default Configuration
- **Primary Provider**: Vercel AI Gateway (unified)
- **Fallback 1**: Gemini 1.5 Flash
- **Fallback 2**: GPT-3.5 Turbo
- **Mode**: Auto-select by capability

### 3. Cost Tracking
Monitor usage in Vercel dashboard:
- Go to: https://vercel.com/your-team/ai-gateway
- View: Token usage, costs, provider distribution

---

## 📊 Benefits for TV25

### Before (Direct Provider Calls)
- ❌ Single provider dependency
- ❌ No fallback on errors
- ❌ Manual cost tracking
- ❌ No load balancing

### After (AI Gateway)
- ✅ Multi-provider support
- ✅ Automatic fallbacks
- ✅ Real-time cost monitoring
- ✅ Load balancing across providers
- ✅ Centralized monitoring

---

## 🔧 Advanced Configuration

### Custom Fallback Chain
```typescript
import { getModelWithFallback } from '@/lib/ai-gateway';

const model = await getModelWithFallback(
  'claude-3-opus', // Preferred
  ['gpt-4-turbo', 'gemini-1.5-pro'] // Fallbacks
);
```

### Budget Limits
Set in Vercel dashboard:
1. Go to AI Gateway settings
2. Set monthly budget limit
3. Configure alerts at 50%, 80%, 100%

### Rate Limiting
Configure per-provider limits to avoid hitting quotas.

---

## 📈 Next Steps

1. ✅ **Deploy to Production** - Push to main branch
2. 🧪 **Monitor Usage** - Check Vercel AI Gateway dashboard
3. 🎯 **Optimize Costs** - Adjust model selection based on metrics
4. 🔄 **Add More Providers** - Expand provider pool as needed

---

## 🆘 Troubleshooting

### Gateway not working?
1. Check API key in `.env.local`
2. Verify provider API keys are set
3. Check Vercel dashboard for errors

### High costs?
1. Review model selection (use `selectBestModel` with `cost` priority)
2. Set budget limits in dashboard
3. Enable caching for repeated queries

### Provider errors?
Gateway automatically falls back to next available provider. Check logs for details.

---

## 📚 Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [AI Gateway Dashboard](https://vercel.com/ai-gateway)
- [Provider Comparison](https://vercel.com/docs/ai-gateway/providers)

---

**Status**: ✅ **Ready for Production**

Vercel AI Gateway is now your primary AI infrastructure, providing unified access to OpenAI, Anthropic, and Google AI with monitoring and fallbacks built-in.
