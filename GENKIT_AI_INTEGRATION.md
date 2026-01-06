# Genkit AI + Database Integration - Complete ✅

## 🎯 Overview
CanvasFlow AI System integrates Google Genkit AI Framework with Supabase database for production-grade conversational AI:

- 🤖 **Genkit AI Flows** - Streaming, tool calling, multi-turn conversations
- 💾 **Supabase Persistence** - PostgreSQL with realtime sync
- 🔐 **Row Level Security** - User-isolated conversations
- 🛠️ **Rich Tool Support** - Web search, YouTube search, content analysis
- 📊 **Conversation Management** - Full CRUD with history tracking
- 🔄 **Cross-Device Sync** - Real-time updates via Supabase Realtime

---

## ✅ Latest Implementation (January 7, 2026)

### New AI Conversation Service
**File**: `src/lib/ai-conversation-service.ts` (350+ lines)

**Core Features**:
- ✅ Auto-conversation creation (`conv-{timestamp}-{userId}`)
- ✅ Message persistence with sequence ordering
- ✅ Conversation history loading for AI context
- ✅ Tool call/result tracking in JSONB fields
- ✅ Full CRUD operations (create, read, update, delete, archive, pin)
- ✅ Cascade delete (messages auto-deleted with conversation)
- ✅ User-based RLS security

**Class**: `AIConversationService`
```typescript
class AIConversationService {
  createConversation(userId, conversationId, title, contextItems?)
  saveMessage(userId, conversationId, role, content, sequenceNumber, toolCalls?, toolResults?, metadata?)
  loadConversationHistory(conversationId): Promise<Message[]>
  getConversations(userId, options?): Promise<Conversation[]>
  deleteConversation(userId, conversationId)
  archiveConversation(userId, conversationId, archived)
  pinConversation(userId, conversationId, pinned)
  getConversationWithMessages(userId, conversationId)
  updateConversationTitle(userId, conversationId, title)
}
```

---

## 🔧 Store Integration (8 Actions)

All actions added to Zustand store (`src/lib/store.ts`):

### 1. Send AI Message
```typescript
const { sendAIMessage } = useAppStore();

const result = await sendAIMessage('Explain React hooks', {
  conversationId: 'optional-existing-conversation',
  priority: 'speed' | 'quality' | 'cost',
  streaming: false
});

console.log(result.response);      // AI response text
console.log(result.conversationId); // For follow-up messages
console.log(result.toolCalls);      // Tools used by AI
```

### 2. Vision Chat
```typescript
const { sendVisionMessage } = useAppStore();

const result = await sendVisionMessage(
  'What is in this image?',
  'https://example.com/image.jpg',
  { streaming: false }
);
```

### 3. List Conversations
```typescript
const { getAIConversations } = useAppStore();

const conversations = await getAIConversations({
  includeArchived: false,
  limit: 20
});

conversations.forEach(conv => {
  console.log(conv.title, conv.message_count, conv.is_pinned);
});
```

### 4. Get Full Conversation
```typescript
const { getAIConversationWithMessages } = useAppStore();

const conversation = await getAIConversationWithMessages(conversationId);

console.log(conversation.title);
conversation.messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### 5. Manage Conversations
```typescript
const { 
  deleteAIConversation, 
  archiveAIConversation, 
  pinAIConversation,
  updateAIConversationTitle 
} = useAppStore();

// Archive
await archiveAIConversation(conversationId, true);

// Pin to top
await pinAIConversation(conversationId, true);

// Update title
await updateAIConversationTitle(conversationId, 'New Title');

// Delete (cascades to messages)
await deleteAIConversation(conversationId);
```

---

## 💾 Database Schema

### Table: ai_conversations
```sql
CREATE TABLE ai_conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  context_items JSONB,
  message_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_pinned ON ai_conversations(user_id, is_pinned);

-- RLS Policy
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversations" 
  ON ai_conversations FOR ALL 
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;
```

### Table: ai_messages
```sql
CREATE TABLE ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, sequence_number);
CREATE INDEX idx_ai_messages_user_id ON ai_messages(user_id);

-- RLS Policy
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own messages" 
  ON ai_messages FOR ALL 
  USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_messages;
```

---

## 🛠️ Genkit AI Integration

### Assistant Flow
**File**: `src/ai/flows/assistant-flow.ts`

**Available Tools**:
- `youtubeSearch` - Search YouTube for videos
- `pageScraper` - Scrape web page content
- `analyzeItem` - Analyze content items
- `suggestFrameStyles` - AI-powered design suggestions

**Usage in Store Actions**:
```typescript
// Store action calls Genkit flow
import { askAi } from '@/ai/flows/assistant-flow';

const result = await askAi({
  message: 'Your question here',
  history: [...previousMessages]
});

// result.response - AI answer
// result.toolCalls - Tools used
// result.toolResults - Tool outputs
```

---

## 🎨 Example: Complete Chat Component

```typescript
'use client';

import { useAppStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export function AIChat() {
  const { sendAIMessage, getAIConversations } = useAppStore();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const convs = await getAIConversations({ limit: 10 });
    setConversations(convs);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      const result = await sendAIMessage(input, {
        conversationId: currentConvId, // Continue existing or create new
        priority: 'speed',
        streaming: false
      });

      setResponse(result.response);
      setCurrentConvId(result.conversationId); // Save for follow-ups
      setInput('');
      
      // Reload conversation list
      await loadConversations();
    } catch (error) {
      console.error('AI error:', error);
      setResponse('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar: Conversations */}
      <div className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Conversations</h2>
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => setCurrentConvId(conv.id)}
            className={`p-2 rounded cursor-pointer ${
              currentConvId === conv.id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-semibold">{conv.title}</div>
            <div className="text-xs text-gray-500">
              {conv.message_count} messages
            </div>
          </div>
        ))}
      </div>

      {/* Main: Chat */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 overflow-auto mb-4">
          {response && (
            <div className="bg-blue-50 p-4 rounded">
              <strong>AI:</strong> {response}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI anything..."
            className="flex-1 border rounded px-4 py-2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 Security

### Row Level Security (RLS)
- ✅ Users can only access their own conversations
- ✅ Cascade delete ensures messages are deleted with conversations
- ✅ Authentication required for all operations

### Best Practices
- Always check `user` from store before AI operations
- Use conversation IDs for multi-turn conversations
- Archive old conversations instead of deleting
- Pin important conversations for quick access

---

## 📊 Performance

### Database Optimizations
- Indexed queries on `user_id`, `conversation_id`
- Sequence numbers for ordered message retrieval
- JSONB for flexible tool call storage
- Realtime subscriptions for cross-device sync

### Code-Splitting
- Dynamic imports for AI service (`await import(...)`)
- Non-blocking message saves
- Lazy loading of conversation lists

---

## ✅ Status

**Implementation**: Complete ✅  
**Compilation**: Passing ✅  
**Database**: Integrated ✅  
**Store Actions**: 8 actions ready ✅  
**Security**: RLS enabled ✅  
**Realtime**: Enabled ✅  

**Next Steps**:
1. Create AI chat UI component
2. Test conversation persistence
3. Test cross-device sync
4. Add conversation search
5. Implement conversation export

---

## 📚 Resources

- [Genkit AI Documentation](https://firebase.google.com/docs/genkit)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Assistant Flow Implementation](./src/ai/flows/assistant-flow.ts)
- [AI Conversation Service](./src/lib/ai-conversation-service.ts)
- [Migration: Database Schema](./supabase/migrations/20260107_live_data_sync_comprehensive.sql)
