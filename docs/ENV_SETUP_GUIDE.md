# Environment Variables Configuration

## Supabase Configuration

```bash
# Supabase API URLs and Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (for server-side operations)
# KEEP THIS SECRET - Never expose to client
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Stripe Configuration

```bash
# Stripe API Keys
STRIPE_PUBLIC_KEY=pk_test_51234567890abcdefghijk_12345...
STRIPE_SECRET_KEY=sk_test_12345678901234567890_12345...

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_test_12345678901234567890_12345...
```

## Application URLs

```bash
# Application base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=https://yourdomain.com # for production

# Stripe redirect URLs (after successful/cancelled payment)
NEXT_PUBLIC_STRIPE_SUCCESS_URL=${NEXT_PUBLIC_APP_URL}/purchases/success
NEXT_PUBLIC_STRIPE_CANCEL_URL=${NEXT_PUBLIC_APP_URL}/purchases/cancel
```

## Authentication

```bash
# JWT Secret for authentication
NEXT_PUBLIC_JWT_SECRET=your-random-secret-key-min-32-characters

# OAuth2 Providers (optional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

## Database

```bash
# Encryption key for sensitive data (32 hex characters)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Database URL (if using raw SQL connections)
DATABASE_URL=postgresql://user:password@localhost:5432/canvasflow
```

## AI/ML Services

```bash
# Google Genkit API Key
GENKIT_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx

# Genkit Model Configuration
GENKIT_MODEL=gemini-1.5-pro

# Optional: Other AI service keys
OPENAI_API_KEY=sk-xxxxxxx
```

## Logging & Analytics

```bash
# Log levels: 'debug', 'info', 'warn', 'error'
LOG_LEVEL=info

# Analytics Service (optional)
ANALYTICS_ID=ua-xxxxxxxxx-x
SENTRY_DSN=https://xxxx@sentry.io/xxxx
```

## Feature Flags

```bash
# Enable/disable features
NEXT_PUBLIC_ENABLE_TRAINING=true
NEXT_PUBLIC_ENABLE_ACHIEVEMENTS=true
NEXT_PUBLIC_ENABLE_ECOMMERCE=true
NEXT_PUBLIC_ENABLE_ADMIN_PANEL=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Development vs Production

### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

## Setup Instructions

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy API URL and Anon Key

2. **Create Stripe Account**
   - Go to https://stripe.com
   - Create account
   - Get API keys from https://dashboard.stripe.com/apikeys
   - Create webhook endpoint for `http://localhost:3000/api/payments/webhook`

3. **Create .env.local file**
   ```bash
   cp .env.example .env.local
   ```

4. **Fill in values**
   - Add all Supabase credentials
   - Add all Stripe credentials
   - Add application URL

5. **Run Supabase migrations**
   ```bash
   # Upload migration to Supabase dashboard
   # Or use Supabase CLI:
   supabase db push
   ```

6. **Install dependencies**
   ```bash
   npm install
   ```

7. **Start development**
   ```bash
   npm run dev
   ```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env.local` to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Keep `STRIPE_SECRET_KEY` secret
- Rotate webhook secrets periodically
- Use HTTPS in production
- Enable RLS (Row Level Security) in Supabase
- Validate all Stripe webhook signatures

## Testing with Stripe

### Test Credit Cards
- Visa: `4242 4242 4242 4242`
- Visa (Declined): `4000 0000 0000 0002`
- Mastercard: `5555 5555 5555 4444`
- Amex: `3782 822463 10005`

Use any future date for expiration and any 3-digit CVC.

## Webhook Testing

Use Stripe CLI to test webhooks locally:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login with Stripe account
stripe login

# Forward webhook events to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test event
stripe trigger payment_intent.succeeded
```

## Production Deployment

1. Set environment variables in your hosting provider (Vercel, Netlify, etc.)
2. Update Stripe webhook endpoint to production domain
3. Use `pk_live_xxx` and `sk_live_xxx` keys (not test keys)
4. Configure Supabase project for production
5. Enable CORS for your production domain
6. Set up SSL/TLS certificate (usually automatic)
7. Enable email verification in Supabase auth
8. Configure backup and disaster recovery

## Troubleshooting

### Stripe Connection Failed
- Check `STRIPE_SECRET_KEY` is correct
- Verify API version compatibility
- Check webhook secret matches

### Supabase Connection Failed
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check network connectivity
- Verify RLS policies allow access

### Webhook Not Receiving Events
- Verify webhook URL is correct and accessible
- Check webhook secret in environment
- Verify event subscription in Stripe dashboard
- Check server logs for errors
