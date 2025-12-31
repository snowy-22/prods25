# CanvasFlow Training & Achievement System - Developer Guide

**Sürüm**: 1.0.0-training-beta
**Son Güncelleme**: 2025-01-15
**Durum**: Production Ready (Demo Data)

---

## 📋 Quick Reference

### File Structure
```
src/
├── lib/
│   ├── training-system.ts        # Training modules, progress tracking
│   ├── achievement-system.ts     # 50+ achievements, blockchain verification
│   ├── ecommerce-system.ts       # Reservation & purchase systems
│   └── json-tracking.ts          # Module & process flow tracking
│
├── components/widgets/
│   ├── training-module-widget.tsx      # Training UI component
│   ├── achievements-widget.tsx         # Achievement showcase
│   ├── award-card-widget.tsx          # Profile award display
│   ├── reservation-widget.tsx         # Calendar reservation
│   ├── purchase-widget.tsx            # E-commerce checkout
│   └── hue-widget.tsx                 # Philips Hue control
│
└── app/api/
    └── hue/route.ts                    # Hue Bridge API endpoint
```

### Key Types

#### TrainingModule
```typescript
interface TrainingModule {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: TrainingCategory;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  prerequisiteModules?: string[]; // Locked if prereqs not met
  steps: TrainingStep[];
  completionReward?: string; // Achievement ID to award
  icon: string;
  coverImage?: string;
  order: number;
}
```

#### Achievement
```typescript
interface Achievement {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
  icon: string;
  unlockCriteria?: string;
  isSecret?: boolean; // Hidden until earned
}
```

#### AwardedAchievement
```typescript
interface AwardedAchievement {
  id: string;
  userId: string;
  achievementId: string;
  awardedAt: string;
  blockchainHash: string;
  verificationChain: VerificationNode[];
  isPubliclyDisplayed?: boolean;
  customMessage?: string;
}
```

#### UserTrainingProgress
```typescript
interface UserTrainingProgress {
  userId: string;
  moduleId: string;
  startedAt: string;
  completedAt?: string;
  currentStepId: string;
  completedSteps: string[];
  progress: number; // 0-100
  quizScores?: Record<string, number>;
  achievementsEarned: string[];
}
```

---

## 🔧 Core Classes

### TrainingTracker

```typescript
class TrainingTracker {
  // Start training on a module
  startModule(userId: string, moduleId: string): UserTrainingProgress
  
  // Complete a step
  completeStep(userId: string, moduleId: string, stepId: string): UserTrainingProgress
  
  // Get user's progress across all modules
  getUserProgress(userId: string): UserTrainingProgress[]
  
  // Get progress for specific module
  getModuleProgress(userId: string, moduleId: string): UserTrainingProgress | undefined
}
```

### AchievementBlockchain

```typescript
class AchievementBlockchain {
  // Generate SHA-256 hash of data
  generateHash(data: any): string
  
  // Create verification node with HMAC signature
  createVerificationNode(
    id: string,
    userId: string,
    verifier: 'system' | 'user' | 'admin'
  ): VerificationNode
  
  // Verify entire chain integrity
  verifyChain(chain: VerificationNode[]): boolean
  
  // Award achievement with blockchain record
  awardAchievement(
    id: string,
    userId: string,
    verifier: 'system' | 'user' | 'admin'
  ): AwardedAchievement
  
  // Export as NFT metadata
  exportAsNFT(award: AwardedAchievement): NFTMetadata
}
```

### ECommerceBlockchain

```typescript
class ECommerceBlockchain {
  // Create reservation with hash
  createReservation(
    userId: string,
    slot: ReservationSlot,
    customerInfo: CustomerInfo,
    participants: number
  ): Reservation
  
  // Confirm reservation (add verification node)
  confirmReservation(
    reservation: Reservation,
    verifier: string
  ): Reservation
  
  // Create purchase with confirmation code
  createPurchase(
    userId: string,
    items: PurchaseItem[],
    shippingInfo: ShippingInfo,
    billingInfo: BillingInfo,
    paymentMethod: string
  ): Purchase
  
  // Confirm payment (add verification node)
  confirmPayment(
    purchase: Purchase,
    verifier: string,
    paymentMethod: string
  ): Purchase
  
  // Export transaction as NFT
  exportTransactionNFT(purchase: Purchase): NFTMetadata
}
```

---

## 📱 Widget Integration

### Adding Training Module Widget to Canvas

```typescript
// In store or component
const newItem: ContentItem = {
  id: `training-${Date.now()}`,
  type: 'training-module',
  title: 'Eğitim Modülleri',
  x: 100,
  y: 100,
  width: 600,
  height: 400,
  // ... other ContentItem props
};

// Widget renderer handles dynamic import
// <TrainingModuleWidget item={item} onUpdate={handleUpdate} />
```

### Widget Props Pattern

All new widgets follow this pattern:

```typescript
interface WidgetProps {
  item: ContentItem;
  onUpdate?: (updates: Partial<ContentItem>) => void;
}

export default function MyWidget({ item, onUpdate }: WidgetProps) {
  // State management with local state + optional persistence
  const [state, setState] = useState(defaultState);
  
  // Update parent (for persistence in store)
  const handleChange = (data: any) => {
    onUpdate?.({
      metadata: { ...item.metadata, ...data }
    });
  };
  
  return <div>{/* UI */}</div>;
}
```

---

## 🔐 Security & Verification

### Blockchain Hash Algorithm

```typescript
// SHA-256 Hashing
import crypto from 'crypto';

function generateHash(data: any): string {
  const json = JSON.stringify(data);
  return crypto.createHash('sha256').update(json).digest('hex');
}
```

### HMAC Signature

```typescript
// HMAC-SHA256 Signature
const BLOCKCHAIN_SECRET = process.env.BLOCKCHAIN_SECRET || 'default-secret';

function createSignature(data: string): string {
  return crypto
    .createHmac('sha256', BLOCKCHAIN_SECRET)
    .update(data)
    .digest('hex');
}
```

### Verification Chain Logic

```typescript
// Verify chain integrity
function verifyChain(chain: VerificationNode[]): boolean {
  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    
    // Check previous hash link
    if (i > 0) {
      const previousNode = chain[i - 1];
      if (node.previousHash !== previousNode.hash) {
        return false; // Chain broken
      }
    }
    
    // Verify signature
    const expectedSignature = createSignature(node.hash + node.timestamp);
    if (node.signature !== expectedSignature) {
      return false; // Tampered
    }
  }
  
  return true; // Chain valid
}
```

---

## 📊 Adding New Achievements

### Step 1: Define Achievement

```typescript
const myAchievement: Achievement = {
  id: 'ach-custom-001',
  title: 'Custom Master',
  titleTr: 'Özel Uzman',
  description: 'Complete 10 custom tasks',
  descriptionTr: '10 özel görev tamamla',
  category: 'productivity',
  rarity: 'rare',
  points: 150,
  icon: '⭐',
  unlockCriteria: 'complete_task_count >= 10',
  isSecret: false
};

// Add to ACHIEVEMENTS array
ACHIEVEMENTS.push(myAchievement);
```

### Step 2: Award Achievement

```typescript
// In your component or API endpoint
const blockchain = new AchievementBlockchain();
const award = blockchain.awardAchievement(
  'ach-custom-001',
  userId,
  'system'
);

// Store in database
await supabase
  .from('achievements')
  .insert({
    user_id: userId,
    achievement_id: award.achievementId,
    blockchain_hash: award.blockchainHash,
    verification_chain: award.verificationChain,
    awarded_at: award.awardedAt
  });
```

### Step 3: Display Achievement

```typescript
// In AchievementsWidget
const achievement = ACHIEVEMENTS.find(a => a.id === award.achievementId);

return (
  <Card className={`border-2 ${RARITY_COLORS[achievement.rarity]}`}>
    <CardHeader>
      <CardTitle>{achievement.titleTr}</CardTitle>
      <CardDescription>{achievement.descriptionTr}</CardDescription>
    </CardHeader>
    {/* ... */}
  </Card>
);
```

---

## 🎓 Adding New Training Modules

### Step 1: Create Module

```typescript
const myModule: TrainingModule = {
  id: 'custom-001',
  title: 'Advanced Features',
  titleTr: 'İleri Özellikler',
  description: 'Learn advanced platform features',
  descriptionTr: 'Platform\'un ileri özelliklerini öğrenin',
  category: 'advanced',
  difficulty: 'expert',
  estimatedMinutes: 45,
  prerequisiteModules: ['basic-001', 'basic-002'],
  icon: '🚀',
  order: 30,
  completionReward: 'ach-advanced-master',
  steps: [
    {
      id: 'step-adv-1',
      title: 'Step 1: Overview',
      titleTr: 'Adım 1: Genel Bakış',
      content: 'Learn the advanced features...',
      contentTr: 'İleri özellikleri öğrenin...',
      type: 'text',
      aiHint: 'Focus on the core concepts',
      aiHintTr: 'Temel kavramlara odaklan',
    },
    // ... more steps
  ]
};

TRAINING_MODULES.push(myModule);
```

### Step 2: Handle Module Progress

```typescript
// In TrainingModuleWidget
const tracker = new TrainingTracker();

const handleStartModule = (module: TrainingModule) => {
  const progress = tracker.startModule(userId, module.id);
  setSelectedModule(module);
  setCurrentStep(0);
};

const handleCompleteStep = (stepId: string) => {
  const progress = tracker.completeStep(userId, moduleId, stepId);
  
  if (progress.completedAt) {
    // Module completed
    if (progress.achievementsEarned.length > 0) {
      // Award achievement
      const blockchain = new AchievementBlockchain();
      blockchain.awardAchievement(
        progress.achievementsEarned[0],
        userId,
        'system'
      );
    }
  }
};
```

---

## 🛍️ E-Commerce Integration

### Creating Reservation Slots

```typescript
import { generateDaySlots } from '@/lib/ecommerce-system';

const reservationConfig = {
  workingHours: { start: '09:00', end: '18:00' },
  slotDuration: 60, // minutes
  maxCapacityPerSlot: 5,
  pricingTiers: [
    { minParticipants: 1, pricePerPerson: 100 },
    { minParticipants: 5, pricePerPerson: 85 }
  ]
};

const date = new Date('2025-01-20');
const existingReservations = []; // From database
const slots = generateDaySlots(date, reservationConfig, existingReservations);

// slots = [
//   { date: '2025-01-20', startTime: '09:00', endTime: '10:00', capacity: 5, booked: 2, price: 100, isAvailable: true },
//   { date: '2025-01-20', startTime: '10:00', endTime: '11:00', capacity: 5, booked: 5, price: 100, isAvailable: false },
//   ...
// ]
```

### Processing Purchase

```typescript
const blockchain = new ECommerceBlockchain();

const purchase = blockchain.createPurchase(
  userId,
  [
    { productId: 'prod-1', name: 'Product 1', price: 100, quantity: 2 },
    { productId: 'prod-2', name: 'Product 2', price: 50, quantity: 1 }
  ],
  {
    address: 'Atatürk Cad. 1',
    city: 'İstanbul',
    zipCode: '34000'
  },
  {
    name: 'Türk Mühendis',
    email: 'turk@example.com',
    address: 'Atatürk Cad. 1'
  },
  'card'
);

// purchase contains:
// - id, items, subtotal, tax, total
// - confirmationCode (8-char alphanumeric)
// - blockchainHash, verificationChain
// - status: 'pending'

// After payment confirmation
const confirmedPurchase = blockchain.confirmPayment(
  purchase,
  'admin',
  'stripe'
);
// Adds verification node to chain
```

---

## 📡 API Integration (Future)

### Planned Endpoints

```typescript
// GET /api/achievements
// Returns user's achievements with blockchain verification

// POST /api/achievements/:id/award
// Awards achievement to user (admin only)

// POST /api/reservations
// Create reservation with blockchain hash

// POST /api/purchases
// Create purchase and process payment

// POST /api/training/:moduleId/complete
// Mark training module as complete
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] TrainingTracker.startModule() creates progress record
- [ ] TrainingTracker.completeStep() increments progress
- [ ] AchievementBlockchain.generateHash() produces consistent output
- [ ] AchievementBlockchain.verifyChain() detects tampering
- [ ] ECommerceBlockchain.generateConfirmationCode() produces 8-char string

### Integration Tests
- [ ] TrainingModuleWidget renders 6 modules
- [ ] Clicking "Başla" switches to step view
- [ ] Completing all steps marks module as complete
- [ ] AchievementsWidget displays earned achievements
- [ ] NFT export downloads valid JSON

### UI Tests
- [ ] ReservationWidget calendar interaction
- [ ] PurchaseWidget 4-step navigation
- [ ] Award visibility toggle works
- [ ] Filter dropdowns in achievements
- [ ] Blockchain hash truncation

### Performance Tests
- [ ] Generating 50+ achievements doesn't lag
- [ ] Verification chain with 10+ nodes stays fast
- [ ] Filtering 50 achievements < 500ms

---

## 🔍 Debugging

### Enable Verbose Logging

```typescript
// In training-module-widget.tsx
const handleCompleteStep = (moduleId: string, stepId: string) => {
  console.log('[Training] Starting step completion:', { moduleId, stepId });
  const result = tracker.completeStep(userId, moduleId, stepId);
  console.log('[Training] Step completed:', result);
};
```

### Inspect Blockchain Hash

```typescript
const blockchain = new AchievementBlockchain();
const testData = { userId: 'test', achievementId: 'ach-test' };
const hash = blockchain.generateHash(testData);
console.log('[Blockchain] Generated hash:', hash);
// Should produce 64-char hex string
```

### Check Verification Chain

```typescript
const blockchain = new AchievementBlockchain();
const award = blockchain.awardAchievement('ach-test', 'user123', 'system');

console.log('[Blockchain] Award created:', {
  id: award.id,
  hash: award.blockchainHash,
  chainLength: award.verificationChain.length,
  isValid: blockchain.verifyChain(award.verificationChain)
});
```

---

## 📈 Performance Considerations

### Optimization Tips

1. **Lazy Load Achievements**
   ```typescript
   // Load in pagination instead of all at once
   const ACHIEVEMENTS_PER_PAGE = 10;
   const paginated = achievements.slice(
     (page - 1) * ACHIEVEMENTS_PER_PAGE,
     page * ACHIEVEMENTS_PER_PAGE
   );
   ```

2. **Memoize Blockchain Verification**
   ```typescript
   const memoizedVerify = useMemo(
     () => blockchain.verifyChain(chain),
     [chain]
   );
   ```

3. **Batch Hash Generation**
   ```typescript
   // Instead of hashing individually
   const batchHash = crypto
     .createHash('sha256')
     .update(JSON.stringify(awards))
     .digest('hex');
   ```

---

## 🚀 Deployment Checklist

- [ ] Environment variables set (BLOCKCHAIN_SECRET, DB keys)
- [ ] Database migrations run (achievements, training_progress tables)
- [ ] API endpoints tested
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Monitoring/logging setup
- [ ] Backup strategy defined
- [ ] Security audit complete
- [ ] Load testing passed
- [ ] User documentation finalized

---

## 📚 Resources

- [SHA-256 Hashing](https://en.wikipedia.org/wiki/SHA-2)
- [HMAC Signatures](https://en.wikipedia.org/wiki/HMAC)
- [NFT Metadata Standard](https://docs.opensea.io/docs/metadata-standards)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [React Hooks Patterns](https://react.dev/reference/react/hooks)

---

**Version**: 1.0.0-training-beta
**Last Updated**: 2025-01-15
**Status**: Production Ready (Requires Database Integration)

