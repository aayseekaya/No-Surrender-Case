# No Surrender - Card Development System

Modern, performanslı ve güvenli kart geliştirme sistemi. Kullanıcılar kartlarını geliştirerek seviye atlayabilir ve enerji sistemi ile dengeli bir oyun deneyimi yaşayabilirler.

## 🚀 Özellikler

### ✨ Kullanıcı Deneyimi İyileştirmeleri
- **Auto-Click Sistemi**: Butona basılı tutarak otomatik geliştirme
- **Batch Processing**: Tek seferde birden fazla progress artırma
- **Hızlı Geliştir**: Progress'i %100'e kadar hızlıca artırma
- **Smooth Animations**: Framer Motion ile akıcı animasyonlar
- **Responsive Design**: Mobil ve desktop uyumlu tasarım
- **Optimistic Updates**: UI'da anında güncelleme
- **SWR Caching**: Akıllı veri önbellekleme

### ⚡ Performans Optimizasyonları
- **Reduced API Calls**: 50 ayrı istek yerine tek batch istek
- **Client-Side Caching**: SWR ile veri önbellekleme
- **Optimistic Updates**: UI'da anında güncelleme
- **Debounced Requests**: Gereksiz istekleri önleme

### 🔒 Güvenlik Önlemleri
- **Rate Limiting**: Dakikada maksimum istek sınırı
- **Cooldown System**: İstekler arası bekleme süresi
- **Input Validation**: Tüm girdilerin doğrulanması
- **Batch Limits**: Toplu işlemlerde güvenlik sınırları
- **IP Tracking**: Kullanıcı bazlı izleme
- **JWT Authentication**: Güvenli kimlik doğrulama
- **Password Hashing**: Şifre güvenliği

### 🛡️ Veri Bütünlüğü
- **Atomic Operations**: Veri tutarlılığı garantisi
- **Error Handling**: Kapsamlı hata yönetimi
- **MongoDB Transactions**: Veri bütünlüğü garantisi
- **Rollback Support**: Hata durumunda geri alma
- **Backup Strategy**: Veri yedekleme stratejisi

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 14**: React framework
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: Styling
- **Framer Motion**: Animasyonlar
- **SWR**: Data fetching
- **Lucide React**: İkonlar

### Backend
- **Node.js**: Runtime environment
- **Next.js API Routes**: API endpoints
- **MongoDB + Mongoose**: Veritabanı
- **Redis**: Caching ve rate limiting
- **JWT**: Authentication

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
├── pages/
│   ├── api/            # API endpoints
│   │   ├── progress.ts # Tek progress artırma
│   │   ├── batch-progress.ts # Toplu progress artırma
│   │   ├── level-up.ts # Seviye atlama
│   │   └── energy.ts   # Enerji bilgisi
│   ├── index.tsx       # Ana sayfa
│   └── _app.tsx        # App wrapper
├── lib/                # Utility fonksiyonları
│   ├── database.ts     # MongoDB bağlantısı
│   ├── redis.ts        # Redis servisi
│   ├── security.ts     # Güvenlik yönetimi
│   ├── rateLimit.ts    # Rate limiting
│   └── cardData.ts     # Kart verileri
├── types/              # TypeScript tipleri
└── styles/             # CSS stilleri
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
# MongoDB ve Redis'i başlatın
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

## 📊 API Endpoints

### POST /api/progress
Tek progress artırma (eski sistem)
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
**Çözüm**: Basılı tutarak otomatik geliştirme

```typescript
const startAutoClick = useCallback(() => {
  autoClickInterval.current = setInterval(() => {
    if (currentEnergy >= 1 && card.progress < 100) {
      handleAction(1);
    }
  }, 100); // 100ms interval
}, []);
```

### 3. **Hızlı Geliştir**
**Problem**: Progress'i %100'e çıkarmak için çok tıklama
**Çözüm**: Tek tıkla maksimum progress artırma

```typescript
const handleQuickProgress = async () => {
  const clicksNeeded = Math.ceil((100 - card.progress) / 2);
  const maxClicks = Math.min(clicksNeeded, currentEnergy, 10);
  await handleAction(maxClicks);
};
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

### 3. **Cooldown System**
```typescript
checkCooldown(identifier: string, config: SecurityConfig): boolean {
  const now = Date.now();
  const lastAction = this.cooldowns.get(identifier);
  
  if (!lastAction || now - lastAction > config.cooldownPeriod) {
    this.cooldowns.set(identifier, now);
    return true;
  }
  return false;
}
```

## 🧪 Test Stratejisi

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Performance Tests
```bash
npm run test:performance
```

## 📈 Performans Metrikleri

### Önceki Sistem
- **API Calls**: 50 istek/kart seviye atlama
- **Network Load**: ~50KB/kart
- **User Experience**: Yavaş ve sıkıcı
- **Server Load**: Yüksek

### Yeni Sistem
- **API Calls**: 5 istek/kart seviye atlama (%90 azalma)
- **Network Load**: ~5KB/kart (%90 azalma)
- **User Experience**: Hızlı ve akıcı
- **Server Load**: Düşük

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/no-surrender
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

