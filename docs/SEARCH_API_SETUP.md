# Search Panel API Setup

To enable real search results in the search panel, you must provide API keys for the following services in your `.env.local` file at the project root:

```
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_SERPAPI_KEY=your-serpapi-key-here
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key-here
```

- **OpenAI API Key:** https://platform.openai.com/api-keys
- **SerpAPI Key (Google Search):** https://serpapi.com/manage-api-key
- **YouTube Data API Key:** https://console.cloud.google.com/apis/credentials

After adding your keys, restart the dev server:

```
npm run dev
```

> Not: API anahtarlarınız gizli kalmalıdır. `.env.local` dosyanızı asla paylaşmayın veya sürüm kontrolüne eklemeyin.
