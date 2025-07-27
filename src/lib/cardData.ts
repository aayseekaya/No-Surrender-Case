import { CardData, CardType } from '@/types';

export const CARD_DATA: Record<CardType, CardData> = {
  uzun_kilic: {
    type: 'uzun_kilic',
    name: 'Uzun Kılıç',
    description: 'Sade, keskin bir savaş kılıcı.',
    images: {
      level1: '/images/uzun_kilic_1.png',
      level2: '/images/uzun_kilic_2.png',
      level3: '/images/uzun_kilic_3.png',
    },
    levelDescriptions: {
      level1: 'Gümüş Diş - Sade, keskin bir savaş kılıcı.',
      level2: 'Zümrüt Yürek - Can alıcı darbeler için güçlendirildi.',
      level3: 'Altın Pençe - Kralların kanını döken efsanevi keskinlik.',
    },
  },
  savas_baltasi: {
    type: 'savas_baltasi',
    name: 'Savaş Baltası',
    description: 'Hafif ve hızlı bir balta.',
    images: {
      level1: '/images/savas_baltasi_1.png',
      level2: '/images/savas_baltasi_2.png',
      level3: '/images/savas_baltasi_3.png',
    },
    levelDescriptions: {
      level1: 'Ay Parçası - Hafif ve hızlı bir balta.',
      level2: 'Zümrüt Kesik - Derin yaralar açan büyülü çelik.',
      level3: 'Efsane Yarma - Tek vuruşta kale kapısı deler.',
    },
  },
  buyu_asasi: {
    type: 'buyu_asasi',
    name: 'Büyü Asası',
    description: 'Temel büyü asası.',
    images: {
      level1: '/images/buyu_asasi_1.png',
      level2: '/images/buyu_asasi_2.png',
      level3: '/images/buyu_asasi_3.png',
    },
    levelDescriptions: {
      level1: 'Gölge Dalı - Temel büyü asası.',
      level2: 'Zümrüt Kök - Doğanın gücüyle titreşir.',
      level3: 'Altın Kök - Yıldızları yere indirir, zamanı büker.',
    },
  },
  kalkan: {
    type: 'kalkan',
    name: 'Kalkan',
    description: 'Basit bir koruma aracı.',
    images: {
      level1: '/images/kalkan_1.png',
      level2: '/images/kalkan_2.png',
      level3: '/images/kalkan_3.png',
    },
    levelDescriptions: {
      level1: 'Gümüş Siperi - Basit bir koruma aracı.',
      level2: 'Zümrüt Zırh - Gelen saldırıyı yansıtır.',
      level3: 'Altın Duvar - Tanrılar bile geçemez.',
    },
  },
  savas_cekici: {
    type: 'savas_cekici',
    name: 'Savaş Çekici',
    description: 'Ağır ve yıkıcı.',
    images: {
      level1: '/images/savas_cekici_1.png',
      level2: '/images/savas_cekici_2.png',
      level3: '/images/savas_cekici_3.png',
    },
    levelDescriptions: {
      level1: 'Taş Parçalayıcı - Ağır ve yıkıcı.',
      level2: 'Zümrüt Ezici - Zırhları paramparça eder.',
      level3: 'Altın Hüküm - Dünyayı çatlatır, düşmanları ezer.',
    },
  },
  egri_kilic: {
    type: 'egri_kilic',
    name: 'Eğri Kılıç',
    description: 'Hafif ve çevik bir bıçak.',
    images: {
      level1: '/images/egri_kilic_1.png',
      level2: '/images/egri_kilic_2.png',
      level3: '/images/egri_kilic_3.png',
    },
    levelDescriptions: {
      level1: 'Gümüş Pençe - Hafif ve çevik bir bıçak.',
      level2: 'Zümrüt Çengel - Derin kesikler için eğildi.',
      level3: 'Altın Yılan - Gölge gibi kayar, kaderi biçer.',
    },
  },
  kisa_kilic: {
    type: 'kisa_kilic',
    name: 'Kısa Kılıç',
    description: 'Hızlı saldırılar için ideal.',
    images: {
      level1: '/images/kisa_kilic_1.png',
      level2: '/images/kisa_kilic_2.png',
      level3: '/images/kisa_kilic_3.png',
    },
    levelDescriptions: {
      level1: 'Gölge Kesik - Hızlı saldırılar için ideal.',
      level2: 'Zümrüt Fısıltı - Sessiz ama ölümcül.',
      level3: 'Altın Dilim - Zamanda bile iz bırakır.',
    },
  },
  buyu_kitabi: {
    type: 'buyu_kitabi',
    name: 'Büyü Kitabı',
    description: 'Temel büyüleri içerir.',
    images: {
      level1: '/images/buyu_kitabi_1.png',
      level2: '/images/buyu_kitabi_2.png',
      level3: '/images/buyu_kitabi_3.png',
    },
    levelDescriptions: {
      level1: 'Gümüş Sayfalar - Temel büyüleri içerir.',
      level2: 'Zümrüt Kehanet - Geleceği okur, kaderi değiştirir.',
      level3: 'Altın Kitabe - Evrenin sırlarını fısıldar, gerçekliği ezer.',
    },
  },
};

export function getCardImage(type: CardType, level: number): string {
  const cardData = CARD_DATA[type];
  switch (level) {
    case 1:
      return cardData.images.level1;
    case 2:
      return cardData.images.level2;
    case 3:
      return cardData.images.level3;
    default:
      return cardData.images.level1;
  }
}

export function getCardDescription(type: CardType, level: number): string {
  const cardData = CARD_DATA[type];
  switch (level) {
    case 1:
      return cardData.levelDescriptions.level1;
    case 2:
      return cardData.levelDescriptions.level2;
    case 3:
      return cardData.levelDescriptions.level3;
    default:
      return cardData.levelDescriptions.level1;
  }
}

export function getCardData(type: CardType): CardData {
  return CARD_DATA[type];
}

export const CARD_TYPES: CardType[] = [
  'uzun_kilic',
  'savas_baltasi',
  'buyu_asasi',
  'kalkan',
  'savas_cekici',
  'egri_kilic',
  'kisa_kilic',
  'buyu_kitabi',
]; 