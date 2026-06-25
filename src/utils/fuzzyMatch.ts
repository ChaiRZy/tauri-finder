/**
 * 经典模糊匹配算法
 * 查询字符必须按顺序出现在目标字符串中
 * 连续匹配得分更高，用于排序
 */

export interface FuzzyResult {
  target: string;
  score: number;
  highlights: [number, number][];
}

export function fuzzyMatch(query: string, target: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (!q) return null;
  if (q === t) return { target, score: 1000, highlights: [[0, target.length]] };
  if (t.includes(q)) {
    const idx = t.indexOf(q);
    return { target, score: 900 - idx, highlights: [[idx, idx + q.length]] };
  }

  // 字符按顺序匹配
  let qi = 0;
  let prevIdx = -1;
  let score = 0;
  let consecutive = 0;
  const highlights: [number, number][] = [];
  let highlightStart = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (highlightStart === -1) highlightStart = ti;
      if (prevIdx === ti - 1) {
        consecutive++;
        score += 10 + consecutive * 5;
      } else {
        consecutive = 1;
        score += 10;
      }
      if (consecutive === 1 && highlights.length > 0) {
        highlights[highlights.length - 1] = [highlights[highlights.length - 1][0], ti - 1];
      }
      prevIdx = ti;
      qi++;
    } else {
      if (consecutive > 0) {
        highlights.push([highlightStart, ti - 1]);
        highlightStart = -1;
      }
      consecutive = 0;
      // 每跳过1个字扣3分
      score -= 3;
    }
  }

  if (consecutive > 0) {
    highlights.push([highlightStart, prevIdx]);
  }

  if (qi < q.length) return null;

  // 越短的匹配得分越高
  score += (100 - Math.abs(t.length - q.length)) * 2;
  // 匹配开头加分
  if (highlights.length > 0 && highlights[0][0] === 0) score += 50;

  return { target, score: Math.max(0, score), highlights };
}

export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  maxResults = 100,
): T[] {
  if (!query.trim()) return items;
  const results: { item: T; score: number }[] = [];
  for (const item of items) {
    const text = getText(item);
    const match = fuzzyMatch(query, text);
    if (match) {
      results.push({ item, score: match.score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults).map((r) => r.item);
}
