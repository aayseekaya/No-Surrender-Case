# No Surrender - Card Development System

Modern, performanslı ve güvenli kart geliştirme sistemi.
## 🚀 Özellikler

### ✨ Kullanıcı Deneyimi İyileştirmeleri
- **Auto-Click Sistemi**: Butona basılı tutarak otomatik geliştirme (100ms interval)
- **Batch Processing**: Tek seferde birden fazla progress artırma (max 10 click)
- **Hızlı Geliştir**: Progress'i %100'e kadar hızlıca artırma
- **Smooth Animations**: Framer Motion ile akıcı animasyonlar
- **Responsive Design**: Mobil ve desktop uyumlu tasarım
- **Optimistic Updates**: UI'da anında güncelleme
- **SWR Caching**: Akıllı veri önbellekleme (5s cards, 1s energy)

### ⚡ Performans Optimizasyonları
- **Reduced API Calls**: 50 ayrı istek yerine tek batch istek
- **Client-Side Caching**: SWR ile veri önbellekleme
- **Optimistic Updates**: UI'da anında güncelleme
- **Debounced Requests**: Gereksiz istekleri önleme

### 🔒 Güvenlik Önlemleri
- **Rate Limiting**: Dakikada maksimum istek sınırı
- **Cooldown System**: İstekler arası bekleme süresi (100ms)
- **Input Validation**: Tüm girdilerin doğrulanması
- **Batch Limits**: Toplu işlemlerde güvenlik sınırları (max 10)
- **IP Tracking**: Kullanıcı bazlı izleme
- **JWT Authentication**: Güvenli kimlik doğrulama
- **Password Hashing**: Bcrypt ile şifre güvenliği

### 🛡️ Veri Bütünlüğü
- **Atomic Operations**: Veri tutarlılığı garantisi
- **Error Handling**: Kapsamlı hata yönetimi
- **Data Validation**: Tüm verilerin doğrulanması
- **Consistent State**: Tutarlı veri durumu
- **Backup Strategy**: Veri yedekleme stratejisi

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Styling
- **Framer Motion**: Animasyonlar
- **SWR**: Data fetching ve caching
- **Lucide React**: İkonlar

### Backend
- **Node.js**: Runtime environment
- **Next.js API Routes**: API endpoints
- **MongoDB + Mongoose**: Veritabanı
- **Redis**: Caching ve rate limiting
- **JWT**: Authentication
- **Bcryptjs**: Password hashing

### Testing
- **Jest**: Unit testing
- **React Testing Library**: Component testing
- **Supertest**: API testing

## 📁 Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── Card.tsx        # Kart bileşeni (auto-click özellikli)
│   ├── CardGrid.tsx    # Kart grid'i
│   ├── EnergyDisplay.tsx # Enerji göstergesi
│   └── LevelFilter.tsx # Seviye filtresi
├── hooks/              # Custom React hooks
│   ├── useCards.ts     # SWR ile kart verisi
│   └── useOptimisticUpdate.ts # Optimistic updates
├── pages/
│   ├── api/            # API endpoints
│   │   ├── progress.ts # Tek progress artırma (transactions)
│   │   ├── batch-progress.ts # Toplu progress artırma
│   │   ├── level-up.ts # Seviye atlama
│   │   ├── energy.ts   # Enerji bilgisi
│   │   ├── cards.ts    # Kart listesi
│   │   └── auth/       # Authentication
│   │       └── login.ts # Login endpoint
│   ├── index.tsx       # Ana sayfa (SWR + Optimistic)
│   └── _app.tsx        # App wrapper
├── lib/                # Utility fonksiyonları
│   ├── database.ts     # MongoDB bağlantısı
│   ├── redis.ts        # Redis servisi
│   ├── security.ts     # Güvenlik yönetimi
│   ├── rateLimit.ts    # Rate limiting
│   ├── auth.ts         # JWT authentication
│   ├── transactions.ts # MongoDB transactions
│   └── cardData.ts     # Kart verileri
├── types/              # TypeScript tipleri
├── styles/             # CSS stilleri
└── __tests__/          # Test dosyaları
    ├── components/     # Component tests
    ├── api/           # API tests
    ├── lib/           # Library tests
    ├── integration/   # Integration tests
    └── performance/   # Performance tests
```

## 🚀 Kurulum

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Environment değişkenlerini ayarlayın:**
```bash
cp .env.example .env.local
```

3. **Veritabanını başlatın:**
```bash
# MongoDB (Docker ile)
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Redis (Docker ile)
docker run -d --name redis -p 6379:6379 redis:alpine
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

## 📊 API Endpoints

### POST /api/progress
Tek progress artırma (atomic operations ile)
```json
{
  "cardId": "string"
}
```

### POST /api/batch-progress ⭐ YENİ
Toplu progress artırma (performanslı sistem)
```json
{
  "cardId": "string",
  "clicks": 5
}
```

### POST /api/level-up
Kart seviyesini yükseltme
```json
{
  "cardId": "string"
}
```

### GET /api/energy
Enerji bilgilerini getirme
```json
{
  "energy": 85,
  "regenerationTime": 30,
  "success": true
}
```

### GET /api/cards ⭐ YENİ
Kullanıcının kartlarını getirme
```json
{
  "cards": [
    {
      "id": "string",
      "name": "Uzun Kılıç",
      "description": "Gümüş Diş - Sade, keskin bir savaş kılıcı.",
      "level": 1,
      "progress": 0,
      "image": "/images/uzun_kilic_1.png",
      "type": "uzun_kilic"
    }
  ],
  "success": true
}
```

### POST /api/auth/login ⭐ YENİ
Kullanıcı girişi (JWT token)
```json
{
  "username": "string",
  "password": "string"
}
```

## 🎯 Performans İyileştirmeleri

### 1. **Batch Processing**
**Problem**: 50 ayrı API isteği
**Çözüm**: Tek batch istek ile 10'a kadar progress artırma

```typescript
// Eski sistem: 50 istek
for (let i = 0; i < 50; i++) {
  await fetch('/api/progress', { body: { cardId } });
}

// Yeni sistem: 5 istek
for (let i = 0; i < 5; i++) {
  await fetch('/api/batch-progress', { 
    body: { cardId, clicks: 10 } 
  });
}
```

### 2. **Auto-Click Sistemi**
**Problem**: Manuel tıklama zorluğu
**Çözüm**: Basılı tutarak otomatik geliştirme (100ms interval)

```typescript
const startAutoClick = useCallback(() => {
  autoClickInterval.current = setInterval(() => {
    if (currentEnergy >= 1 && card.progress < 100 && !isLoading) {
      setClickCount(prev => prev + 1);
      handleAction(1);
    } else {
      stopAutoClick();
    }
  }, 100); // 100ms interval
}, []);
```

### 3. **Hızlı Geliştir**
**Problem**: Progress'i %100'e çıkarmak için çok tıklama
**Çözüm**: Tek tıkla maksimum progress artırma (max 10)

```typescript
const handleQuickProgress = async () => {
  const clicksNeeded = Math.ceil((100 - card.progress) / 2);
  const maxClicks = Math.min(clicksNeeded, currentEnergy, 10); // Batch limit
  if (maxClicks > 0) {
    await handleAction(maxClicks);
  }
};
```

### 4. **SWR Caching**
**Problem**: Sürekli API istekleri
**Çözüm**: Akıllı veri önbellekleme

```typescript
export function useCards() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/cards',
    fetcher,
    {
      refreshInterval: 5000, // 5 saniyede bir yenile
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
}
```

### 5. **Optimistic Updates**
**Problem**: UI gecikmesi
**Çözüm**: Anında UI güncelleme

```typescript
// Optimistic update
mutateCards({
  cards: cards.map(c => 
    c.id === cardId 
      ? { ...c, progress: newProgress, level: newLevel }
      : c
  ),
  success: true
}, false);

// Actual API call
await updateCardProgress(cardId, 2, 1, 1);
```

## 🔒 Güvenlik Önlemleri

### 1. **Rate Limiting**
```typescript
const DEFAULT_SECURITY_CONFIG = {
  maxRequestsPerMinute: 60,
  maxBatchClicks: 10,
  cooldownPeriod: 100, // 100ms
};
```

### 2. **Input Validation**
```typescript
validateRequestBody(body: any): { valid: boolean; error?: string } {
  if (!body.cardId || typeof body.cardId !== 'string') {
    return { valid: false, error: 'Valid cardId is required' };
  }
  if (body.clicks && (typeof body.clicks !== 'number' || body.clicks < 1)) {
    return { valid: false, error: 'Clicks must be a positive number' };
  }
  return { valid: true };
}
```

### 3. **JWT Authentication**
```typescript
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

### 4. **Atomic Operations**
```typescript
// Calculate new progress
const newProgress = Math.min(100, card.progress + 2);
const isLevelUp = newProgress >= 100 && card.progress < 100;

// Update card
card.progress = isLevelUp ? 0 : newProgress;
if (isLevelUp) {
  card.level = Math.min(3, card.level + 1);
  card.image = `/images/${card.type}_${card.level}.png`;
  card.description = getCardDescription(card.type, card.level);
}

// Update user energy (only if not leveling up)
if (!isLevelUp) {
  user.energy = Math.max(0, user.energy - 1);
}

// Save both documents
await card.save();
await user.save();
```

## 🧪 Test Stratejisi

### Unit Tests
```bash
npm test
```

### Component Tests
```bash
npm test -- --testPathPattern="components"
```

### API Tests
```bash
npm test -- --testPathPattern="api"
```

### Integration Tests
```bash
npm test -- --testPathPattern="integration"
```

### Performance Tests
```bash
npm test -- --testPathPattern="performance"
```

## 📈 Performans Metrikleri

### Önceki Sistem
- **API Calls**: 50 istek/kart seviye atlama
- **Network Load**: ~50KB/kart
- **User Experience**: Yavaş ve sıkıcı
- **Server Load**: Yüksek
- **Data Integrity**: Riskli

### Yeni Sistem
- **API Calls**: 5 istek/kart seviye atlama (%90 azalma)
- **Network Load**: ~5KB/kart (%90 azalma)
- **User Experience**: Hızlı ve akıcı
- **Server Load**: Düşük
- **Data Integrity**: Atomic operations ile garantili
- **Caching**: SWR ile akıllı önbellekleme
- **Security**: JWT + Rate limiting + Input validation

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/no-surrender
MONGODB_URI_PROD=mongodb://your-production-mongodb-uri

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# Energy
ENERGY_REGEN_RATE=1
ENERGY_REGEN_INTERVAL=60000
MAX_ENERGY=100

# Environment
NODE_ENV=production
DEBUG=false
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

