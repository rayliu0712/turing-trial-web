/**
 * 台灣在地姓名生成演算法 (純離線組合，零外部依賴)
 */

export const TAIWAN_SURNAMES = [
  '陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊',
  '許', '鄭', '謝', '洪', '郭', '邱', '曾', '廖', '賴', '徐',
  '周', '葉', '蘇', '莊', '江', '呂', '何', '羅', '高', '蕭',
  '潘', '朱', '簡', '彭', '游', '詹', '胡', '施', '沈', '余',
  '盧', '梁', '趙', '顏', '柯', '翁', '魏', '孫', '戴', '范',
] as const;

export const TAIWAN_GIVEN_NAMES = [
  // 男性與常見陽剛名
  '家豪', '冠宇', '建宏', '俊傑', '承翰', '柏翰', '宇軒', '宗翰',
  '冠廷', '子軒', '家瑋', '冠霖', '志豪', '志偉', '建志', '家銘',
  '博宇', '彥廷', '浩然', '睿恩', '敬軒', '哲緯', '凱翔', '紹廷',
  '維倫', '佑安', '宥廷', '子睿', '宏偉', '明哲', '正雄', '冠名',
  // 女性與常見溫潤名
  '雅婷', '詠晴', '子晴', '怡君', '欣怡', '心怡', '詩涵', '鈺婷',
  '佳穎', '思婷', '宛婷', '雅雯', '雅慧', '家妤', '品妍', '羽彤',
  '芷萱', '若涵', '晴文', '語晨', '郁婷', '欣樺', '佩暄', '宜蓁',
  '巧恩', '雨璇', '雨潔', '佳萱', '庭瑄', '采潔', '詠潔', '玟綺',
  // 自然中性名
  '品睿', '宥嘉', '晨曦', '允諾', '天佑', '沐恩', '晴天', '安晴',
] as const;

/**
 * 隨機擲骰生成單一台灣在地姓名
 */
export function generateRandomTaiwaneseName(excludeSet?: Set<string>): string {
  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const surname = TAIWAN_SURNAMES[Math.floor(Math.random() * TAIWAN_SURNAMES.length)];
    const givenName = TAIWAN_GIVEN_NAMES[Math.floor(Math.random() * TAIWAN_GIVEN_NAMES.length)];
    const fullName = `${surname}${givenName}`;
    if (!excludeSet || !excludeSet.has(fullName)) {
      return fullName;
    }
  }
  // 備用防重複 fallback (加上次序數字避免死循環)
  const base = `${TAIWAN_SURNAMES[0]}${TAIWAN_GIVEN_NAMES[0]}`;
  return `${base}${Math.floor(Math.random() * 90 + 10)}`;
}

/**
 * 批次生成多個互不重複的台灣姓名
 */
export function generateUniqueNames(count: number): string[] {
  const result: string[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const name = generateRandomTaiwaneseName(used);
    used.add(name);
    result.push(name);
  }

  return result;
}

