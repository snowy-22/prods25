/**
 * AI FUNCTION CALLING HIZLI REFERANS
 * 
 * Bu dosya AI function calling sisteminin tüm özelliklerini gösterir.
 * Copy-paste yaparak kullanabilirsiniz.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { logAIRequest, logToolCall, updateAIRequestStatus, type AIToolName } from '@/lib/ai/ai-logger';

// ============================================================================
// 1. TEMEL TOOL TANIMLAMA
// ============================================================================

/**
 * Basit bir hesap makinesi tool örneği
 */
const calculatorTool = ai.defineTool(
  {
    name: 'calculator',
    description: 'Matematik işlemleri yapar: toplama, çıkarma, çarpma, bölme',
    
    // INPUT SCHEMA - AI hangi parametreleri göndermeli?
    inputSchema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide'])
        .describe('Yapılacak işlem tipi'),
      a: z.number().describe('İlk sayı'),
      b: z.number().describe('İkinci sayı'),
    }),
    
    // OUTPUT SCHEMA - Ne dönecek?
    outputSchema: z.object({
      result: z.number(),
      explanation: z.string(),
    }),
  },
  
  // IMPLEMENTATION - Gerçek fonksiyon
  async ({ operation, a, b }) => {
    let result: number;
    
    switch (operation) {
      case 'add': result = a + b; break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
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

// ============================================================================
// 2. API ÇAĞRISIİ YAPAN TOOL
// ============================================================================

/**
 * YouTube API çağrısı yapan tool örneği
 */
const youtubeSearchTool = ai.defineTool(
  {
    name: 'youtubeSearch',
    description: 'YouTube\'da video arar ve sonuçları döner',
    
    inputSchema: z.object({
      query: z.string().min(1).describe('Aranacak kelime/cümle'),
      maxResults: z.number().optional().default(5).describe('Max sonuç sayısı'),
    }),
    
    outputSchema: z.array(z.object({
      title: z.string(),
      videoId: z.string(),
      channel: z.string(),
      thumbnail: z.string().url(),
    })),
  },
  
  async ({ query, maxResults = 5 }) => {
    // Gerçek API çağrısı
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}` +
      `&maxResults=${maxResults}&type=video` +
      `&key=${process.env.YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high.url,
    }));
  }
);

// ============================================================================
// 3. DATABASE İŞLEMLERİ YAPAN TOOL
// ============================================================================

/**
 * Zustand store'a item ekleyen tool
 */
const addItemToCanvasTool = ai.defineTool(
  {
    name: 'addItemToCanvas',
    description: 'Canvas\'a yeni bir item ekler (video, image, widget, vb.)',
    
    inputSchema: z.object({
      type: z.enum(['video', 'image', 'website', 'notes', 'clock']),
      title: z.string().min(1),
      url: z.string().url().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    }),
    
    outputSchema: z.object({
      success: z.boolean(),
      itemId: z.string(),
    }),
  },
  
  async ({ type, title, url, x, y }) => {
    // Supabase'e kaydet
    const supabase = createClient();
    
    const newItem = {
      id: `ai-${Date.now()}`,
      type,
      title,
      url,
      x: x || Math.random() * 500,
      y: y || Math.random() * 500,
      width: 400,
      height: 300,
      created_at: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('canvas_items')
      .insert([newItem]);
    
    if (error) throw error;
    
    return {
      success: true,
      itemId: newItem.id,
    };
  }
);

// ============================================================================
// 4. LOGLAMA İLE TOOL KULLANIMI
// ============================================================================

/**
 * Tool'u loglama ile birlikte kullanma örneği
 */
const loggedYoutubeSearchTool = ai.defineTool(
  {
    name: 'youtubeSearch',
    description: 'YouTube arama yapar ve loglar',
    inputSchema: z.object({
      query: z.string(),
      requestLogId: z.string().optional(), // Loglama için
    }),
    outputSchema: z.any(),
  },
  
  async ({ query, requestLogId }) => {
    const startTime = Date.now();
    
    try {
      // Gerçek API çağrısı
      const results = await searchYouTube(query);
      
      // BAŞARILI TOOL ÇAĞRISINI LOGLA
      if (requestLogId) {
        await logToolCall(
          requestLogId,
          'youtubeSearch',
          { query },
          results,
          undefined, // error yok
          Date.now() - startTime // duration
        );
      }
      
      return results;
    } catch (error: any) {
      // HATA DURUMUNU LOGLA
      if (requestLogId) {
        await logToolCall(
          requestLogId,
          'youtubeSearch',
          { query },
          undefined, // output yok
          error.message, // error var
          Date.now() - startTime
        );
      }
      
      throw error;
    }
  }
);

// ============================================================================
// 5. FLOW İLE KULLANIM (Tam Örnek)
// ============================================================================

/**
 * Tool'ları kullanan AI flow
 */
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: z.object({
      userId: z.string(),
      conversationId: z.string().optional(),
      messages: z.array(MessageSchema),
    }),
    outputSchema: z.object({
      response: z.string(),
    }),
  },
  
  async (input) => {
    // 1️⃣ LOGLAMA: İstek başladı
    const logId = await logAIRequest(input.userId, 'assistant', {
      prompt: input.messages[input.messages.length - 1]?.content,
      conversationId: input.conversationId,
      modelName: 'gemini-1.5-flash',
    });
    
    try {
      // 2️⃣ AI ÇAĞRISI: Tool'larla birlikte
      const result = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        messages: input.messages,
        tools: [
          calculatorTool,
          youtubeSearchTool,
          addItemToCanvasTool,
        ],
      });
      
      // 3️⃣ LOGLAMA: Başarılı
      await updateAIRequestStatus(logId, 'success', {
        response: result.text,
        tokensUsed: result.usage?.totalTokens,
      });
      
      return { response: result.text };
      
    } catch (error: any) {
      // 4️⃣ LOGLAMA: Hata
      await updateAIRequestStatus(logId, 'error', {
        errorMessage: error.message,
      });
      
      throw error;
    }
  }
);

// ============================================================================
// 6. CLIENT-SIDE KULLANIM
// ============================================================================

/**
 * Component'ten AI çağrısı yapma
 */
async function askAIFromComponent(userMessage: string) {
  try {
    const response = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        conversationId: conversationId,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.response;
    
  } catch (error) {
    console.error('AI request failed:', error);
    throw error;
  }
}

// Kullanım örneği:
// const reply = await askAIFromComponent("YouTube'da React dersleri bul");

// ============================================================================
// 7. İSTATİSTİKLER VE ANALİZ
// ============================================================================

/**
 * Kullanıcının AI kullanım istatistiklerini getir
 */
async function showUserAIStats(userId: string) {
  const stats = await getUserAIStats(userId, {
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Son 7 gün
  });
  
  console.log('AI Kullanım İstatistikleri:');
  console.log('- Toplam istek:', stats.totalRequests);
  console.log('- Başarılı:', stats.successfulRequests);
  console.log('- Başarısız:', stats.failedRequests);
  console.log('- Toplam token:', stats.totalTokensUsed);
  console.log('- Ortalama süre:', stats.avgDuration, 'ms');
  console.log('- En çok kullanılan tool:', stats.topTools[0]?.tool);
}

/**
 * Detaylı logları görüntüle
 */
async function showDetailedLogs(userId: string) {
  const logs = await getAILogs(userId, {
    flowType: 'assistant',
    status: 'success',
    limit: 5,
  });
  
  logs.forEach(log => {
    console.log(`\n--- Log: ${log.id} ---`);
    console.log('Prompt:', log.prompt);
    console.log('Tool çağrıları:', log.tool_calls?.length || 0);
    console.log('Süre:', log.duration_ms, 'ms');
    console.log('Token:', log.tokens_used);
  });
}

// ============================================================================
// 8. QUOTA KONTROLÜ
// ============================================================================

/**
 * AI kullanımı öncesi quota kontrolü
 */
async function checkQuotaBeforeAI(userId: string) {
  const quota = await checkAIQuota(userId, 24, 100); // 24 saatte max 100
  
  if (quota.quota_exceeded) {
    throw new Error(
      `AI quota limit exceeded. ` +
      `You can make ${quota.remaining_requests} more requests. ` +
      `Quota resets at ${quota.reset_at}.`
    );
  }
  
  console.log(`Remaining AI requests: ${quota.remaining_requests}`);
  return quota;
}

// ============================================================================
// 9. HATA YÖNETİMİ
// ============================================================================

/**
 * Robust error handling ile tool
 */
const robustTool = ai.defineTool(
  {
    name: 'robustTool',
    description: 'Hata yönetimi olan güvenli tool',
    inputSchema: z.object({ input: z.string() }),
    outputSchema: z.any(),
  },
  
  async ({ input }) => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await dangerousOperation(input);
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed:`, error.message);
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
    
    throw new Error(
      `Tool failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }
);

// ============================================================================
// 10. ÇOK ADIMLI İŞLEM (Multi-Step)
// ============================================================================

/**
 * Birden fazla tool'u sırayla kullanan örnek
 */
async function multiStepAITask(userId: string, query: string) {
  // 1. YouTube'da ara
  const videos = await youtubeSearchTool({ query, maxResults: 3 });
  
  // 2. Her videoyu canvas'a ekle
  const addedItems = [];
  for (const video of videos) {
    const result = await addItemToCanvasTool({
      type: 'video',
      title: video.title,
      url: `https://youtube.com/watch?v=${video.videoId}`,
    });
    addedItems.push(result.itemId);
  }
  
  // 3. Kullanıcıya bildir
  return {
    message: `${videos.length} video bulundu ve canvas'a eklendi`,
    itemIds: addedItems,
  };
}

// ============================================================================
// ÖZET: TEMEL ADIMLAR
// ============================================================================

/*
1. Tool Tanımlama:
   - ai.defineTool() kullan
   - inputSchema ve outputSchema belirt
   - Implementation yaz

2. Loglama Ekle:
   - logAIRequest() - istek başında
   - logToolCall() - her tool çağrısında
   - updateAIRequestStatus() - istek sonunda

3. Flow'da Kullan:
   - ai.defineFlow() ile flow oluştur
   - tools array'ine tool'ları ekle
   - Error handling ekle

4. Test Et:
   - Console loglarını kontrol et
   - Database'de ai_usage_logs tablosunu incele
   - İstatistikleri görüntüle

5. Monitoring:
   - getUserAIStats() ile kullanım takibi
   - checkAIQuota() ile limit kontrolü
   - getAILogs() ile debugging
*/

export {
  calculatorTool,
  youtubeSearchTool,
  addItemToCanvasTool,
  assistantFlow,
  askAIFromComponent,
  showUserAIStats,
  checkQuotaBeforeAI,
};
