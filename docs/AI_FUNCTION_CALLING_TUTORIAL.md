# AI Function Calling (Tool Use) Eğitimi

## 📚 İçindekiler
1. [Function Calling Nedir?](#function-calling-nedir)
2. [Nasıl Çalışır?](#nasıl-çalışır)
3. [Tool (Fonksiyon) Tanımlama](#tool-tanımlama)
4. [Loglama Sistemi](#loglama-sistemi)
5. [Pratik Örnekler](#pratik-örnekler)

---

## Function Calling Nedir?

**Function Calling** (Tool Use), AI modelinin gerçek fonksiyonları çağırabilmesi demektir. 
AI sadece text üretmez, **aynı zamanda aksiyonlar da alabilir**.

### Örnek Senaryo:
```
Kullanıcı: "YouTube'da React dersleri bul"

Klasik AI: "YouTube'da React Tutorial, Learn React in 30 Minutes gibi videolar bulabilirsiniz"

Function Calling ile AI:
1. youtubeSearch("React tutorials") fonksiyonunu ÇAĞIRIR
2. Gerçek sonuçlar gelir: [video1, video2, video3]
3. AI bu sonuçları kullanıcıya gösterir
```

---

## Nasıl Çalışır?

### 1. AI Tool'ları Tanır
AI'ya hangi fonksiyonları kullanabileceğini söyleriz:
```typescript
const tools = [
  youtubeSearchTool,      // YouTube'da video arama
  pageScraperTool,        // Web sayfası içeriği çekme
  addPlayerTool,          // Canvas'a player ekleme
  highlightElementTool    // UI elementini vurgulama
];
```

### 2. AI İhtiyaç Olunca Çağırır
Kullanıcı isteğini analiz eder ve hangi tool'u kullanacağına karar verir:
```typescript
// Kullanıcı: "Şu sayfanın içeriğini analiz et: https://react.dev"
// AI düşünür: "pageScraper tool'unu kullanmalıyım"

AI → pageScraper({ url: 'https://react.dev' })
```

### 3. Sonuç AI'ya Geri Döner
```typescript
Tool Response: "React is a JavaScript library for building..."
AI bu bilgiyle yanıt verir: "React.dev sayfasında React'in..."
```

---

## Tool Tanımlama

### Basit Tool Örneği
```typescript
import { ai } from '@/ai/genkit';
import { z } from 'zod'; // Type validation için

// 1. Tool'u tanımla
const calculateTool = ai.defineTool(
  {
    name: 'calculate',
    description: 'Matematik işlemleri yapar (toplama, çıkarma, çarpma, bölme)',
    
    // Input schema - AI hangi parametreleri göndermeli?
    inputSchema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number().describe('İlk sayı'),
      b: z.number().describe('İkinci sayı'),
    }),
    
    // Output schema - Ne dönecek?
    outputSchema: z.object({
      result: z.number(),
      explanation: z.string(),
    }),
  },
  
  // 2. Gerçek fonksiyon implementasyonu
  async ({ operation, a, b }) => {
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) throw new Error('Sıfıra bölme hatası!');
        result = a / b;
        break;
    }
    
    return {
      result,
      explanation: `${a} ${operation} ${b} = ${result}`,
    };
  }
);
```

### Gerçek Dünya Örneği - YouTube Arama
```typescript
const youtubeSearchTool = ai.defineTool(
  {
    name: 'youtubeSearch',
    description: 'YouTube\'da video arar. Kullanıcı video aramak istediğinde kullan.',
    
    inputSchema: z.object({
      query: z.string().describe('Arama sorgusu (örn: "React tutorials")'),
      maxResults: z.number().optional().default(5),
    }),
    
    outputSchema: z.array(z.object({
      title: z.string(),
      link: z.string().url(),
      channel: z.string(),
      views: z.number().optional(),
      duration: z.string().optional(),
    })),
  },
  
  async ({ query, maxResults = 5 }) => {
    // Gerçek YouTube API çağrısı
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}` +
      `&maxResults=${maxResults}&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      views: undefined, // API'dan gelmiyorsa
      duration: undefined,
    }));
  }
);
```

---

## Loglama Sistemi

Her AI kullanımını ve tool çağrısını logluyoruz. **3 adım:**

### 1. AI İsteği Başlat
```typescript
import { logAIRequest, logToolCall, updateAIRequestStatus } from '@/lib/ai/ai-logger';

export async function askAi(input: AssistantInput) {
  const userId = input.userId || 'anonymous';
  
  // 1. LOG: İstek başladı
  const logId = await logAIRequest(userId, 'assistant', {
    prompt: input.messages[input.messages.length - 1]?.content[0]?.text,
    conversationId: input.conversationId,
    modelName: 'gemini-1.5-flash',
  });
  
  try {
    // AI çağrısı...
  } catch (error) {
    // Hata durumunda log
    await updateAIRequestStatus(logId, 'error', {
      errorMessage: error.message,
    });
  }
}
```

### 2. Tool Çağrısını Logla
```typescript
// Tool tanımında loglama ekle
const youtubeSearchTool = ai.defineTool(
  { /* ... schema ... */ },
  async ({ query }) => {
    const startTime = Date.now();
    
    try {
      // Gerçek işlem
      const results = await searchYouTube(query);
      
      // LOG: Tool başarılı
      await logToolCall(
        currentLogId,  // Global veya context'ten al
        'youtubeSearch',
        { query },
        results,
        undefined,
        Date.now() - startTime
      );
      
      return results;
    } catch (error) {
      // LOG: Tool hata verdi
      await logToolCall(
        currentLogId,
        'youtubeSearch',
        { query },
        undefined,
        error.message,
        Date.now() - startTime
      );
      throw error;
    }
  }
);
```

### 3. İstek Tamamlandı
```typescript
export async function askAi(input: AssistantInput) {
  const logId = await logAIRequest(/* ... */);
  
  try {
    const result = await ai.prompt({
      prompt: input.messages,
      tools: [youtubeSearchTool, pageScraperTool],
    });
    
    // 3. LOG: Başarılı
    await updateAIRequestStatus(logId, 'success', {
      response: result.text,
      tokensUsed: result.usage?.totalTokens,
    });
    
    return result;
  } catch (error) {
    await updateAIRequestStatus(logId, 'error', {
      errorMessage: error.message,
    });
    throw error;
  }
}
```

---

## Pratik Örnekler

### Örnek 1: Web Scraper Tool
```typescript
const pageScraperTool = ai.defineTool(
  {
    name: 'pageScraper',
    description: 'Web sayfasının içeriğini çeker. URL\'den text çıkarır.',
    inputSchema: z.object({
      url: z.string().url(),
    }),
    outputSchema: z.string(),
  },
  async ({ url }) => {
    const response = await fetch(url);
    const html = await response.text();
    
    // HTML'den sadece text çıkar (basitleştirilmiş)
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 5000); // İlk 5000 karakter
  }
);
```

### Örnek 2: Canvas'a Item Ekleme
```typescript
const addPlayerTool = ai.defineTool(
  {
    name: 'addPlayerTool',
    description: 'Canvas\'a yeni bir player/item ekler. Video, website, ya da image eklemek için kullan.',
    inputSchema: z.object({
      url: z.string().url(),
      title: z.string(),
      type: z.enum(['video', 'website', 'image']).optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      itemId: z.string().optional(),
    }),
  },
  async ({ url, title, type }) => {
    // Zustand store'a ekle (server-side olduğu için event gönder)
    const newItem = {
      id: `ai-item-${Date.now()}`,
      type: type || 'website',
      title,
      url,
      x: Math.random() * 500,
      y: Math.random() * 500,
      width: 400,
      height: 300,
    };
    
    // Real-time güncelleme için
    await broadcastCanvasUpdate(newItem);
    
    return {
      success: true,
      itemId: newItem.id,
    };
  }
);
```

### Örnek 3: UI Element Vurgulama
```typescript
const highlightElementTool = ai.defineTool(
  {
    name: 'highlightElement',
    description: 'Kullanıcıya rehberlik etmek için UI elementini vurgular.',
    inputSchema: z.object({
      elementId: z.string(),
      duration: z.number().optional().default(3000),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  async ({ elementId, duration = 3000 }) => {
    // Client'a event gönder
    await sendClientEvent('highlight-element', {
      elementId,
      duration,
    });
    
    return { success: true };
  }
);
```

---

## Tam Akış Örneği

### Kullanıcı İsteği
```
"YouTube'da en iyi React kurslarını bul ve canvas'a ekle"
```

### AI Akışı (Otomatik)
```typescript
// 1. AI youtubeSearch tool'unu çağırır
const videos = await youtubeSearchTool({ query: 'best React courses' });
// Sonuç: [
//   { title: 'React - The Complete Guide', link: '...', channel: 'Academind' },
//   { title: 'Full React Course 2024', link: '...', channel: 'freeCodeCamp' }
// ]

// 2. AI her video için addPlayerTool'u çağırır
for (const video of videos.slice(0, 3)) {
  await addPlayerTool({
    url: video.link,
    title: video.title,
    type: 'video'
  });
}

// 3. AI kullanıcıya yanıt verir
return "3 adet en iyi React kursunu canvas'a ekledim. Academind ve freeCodeCamp'ten..."
```

### Loglar (Otomatik Kaydedilir)
```typescript
{
  id: 'ai-1234567890-abc',
  user_id: 'user-123',
  flow_type: 'assistant',
  prompt: 'YouTube\'da en iyi React kurslarını bul ve canvas\'a ekle',
  model_name: 'gemini-1.5-flash',
  tool_calls: [
    {
      tool_name: 'youtubeSearch',
      input: { query: 'best React courses' },
      output: [ /* 5 video */ ],
      duration_ms: 1200,
      timestamp: 1704400000000
    },
    {
      tool_name: 'addPlayerTool',
      input: { url: '...', title: 'React - The Complete Guide', type: 'video' },
      output: { success: true, itemId: 'ai-item-...' },
      duration_ms: 80,
      timestamp: 1704400001200
    },
    // ... 2 video daha
  ],
  status: 'success',
  tokens_used: 850,
  duration_ms: 2500
}
```

---

## En İyi Pratikler

### ✅ DO (Yapılması Gerekenler)
1. **Her tool'u logla**: Debugging ve maliyet takibi için
2. **Clear descriptions yaz**: AI'nın ne zaman kullanacağını anlaması için
3. **Input validation yap**: Zod schema ile güvenli input
4. **Error handling**: Try-catch ve error loglama
5. **Rate limiting**: Çok fazla tool call önleme

### ❌ DON'T (Yapılmaması Gerekenler)
1. **Sensitive data loglama**: API keys, passwords
2. **Too many tools**: AI karışır, max 8-10 tool
3. **Slow tools**: 30 saniyeden uzun çalışan toollar timeout'a sebep olur
4. **Unclear naming**: `doStuff` yerine `searchYouTubeVideos` kullan

---

## İstatistikler Görüntüleme

```typescript
import { getUserAIStats } from '@/lib/ai/ai-logger';

// Kullanıcının AI kullanımını göster
const stats = await getUserAIStats('user-123', {
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Son 7 gün
});

console.log(stats);
// {
//   totalRequests: 45,
//   successfulRequests: 42,
//   failedRequests: 3,
//   totalTokensUsed: 12500,
//   avgDuration: 1850,
//   topTools: [
//     { tool: 'youtubeSearch', count: 28 },
//     { tool: 'pageScraper', count: 15 },
//     { tool: 'addPlayerTool', count: 12 }
//   ],
//   topFlows: [
//     { flow: 'assistant', count: 40 },
//     { flow: 'analyze-content', count: 5 }
//   ]
// }
```

---

## Özet

1. **Function Calling** = AI gerçek fonksiyonları çağırabilir
2. **Tool tanımı** = `ai.defineTool()` ile schema + implementation
3. **Loglama** = Her istek, tool call, ve sonuç database'e kaydedilir
4. **3 adım**: logAIRequest → logToolCall → updateAIRequestStatus

**Sonuç**: Şeffaf, takip edilebilir, güvenli AI sistemi! 🚀
