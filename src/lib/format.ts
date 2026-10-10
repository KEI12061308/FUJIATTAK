const yenFormatter = new Intl.NumberFormat("ja-JP");

/** 整数の円を「¥1,234」形式にする。マイナスは「-¥1,234」。 */
export function formatYen(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}¥${yenFormatter.format(Math.abs(Math.trunc(amount)))}`;
}
