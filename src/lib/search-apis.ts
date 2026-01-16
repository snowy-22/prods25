// Centralized real API fetchers for search panel
// You must set your API keys in .env.local

export async function fetchAiResult(query: string): Promise<string> {
  // Example: OpenAI GPT-4o
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key missing');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: query }],
      max_tokens: 256,
      temperature: 0.7,
    })
  });
  const data = await res.json();
  if (!data.choices || !data.choices[0]?.message?.content) throw new Error('AI yanıtı alınamadı');
  return data.choices[0].message.content.trim();
}

export async function fetchWebResults(query: string): Promise<Array<{title:string,url:string}>> {
  // Example: SerpAPI (Google Custom Search alternative)
  const apiKey = process.env.NEXT_PUBLIC_SERPAPI_KEY;
  if (!apiKey) throw new Error('SerpAPI anahtarı eksik');
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google&api_key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.organic_results) throw new Error('Web sonuçları alınamadı');
  return data.organic_results.slice(0, 6).map((r: any) => ({ title: r.title, url: r.link }));
}

export async function fetchYoutubeResults(query: string): Promise<Array<{id:string,title:string}>> {
  // Example: YouTube Data API v3
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YouTube API anahtarı eksik');
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items) throw new Error('YouTube sonuçları alınamadı');
  return data.items.map((item: any) => ({ id: item.id.videoId, title: item.snippet.title }));
}
