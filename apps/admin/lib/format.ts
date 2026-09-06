/** 把 unknown 错误收敛成一句话。catch 块只调这个，别手写三元。 */
export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** https://a.dev/x → a.dev/x（表格里站点列展示用）。 */
export function formatHost(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

/** 0.185 → '18.5%'。digits 默认 1。 */
export function formatCtr(ctr: number, digits = 1): string {
  return `${(ctr * 100).toFixed(digits)}%`;
}

/** zh-CN 本地时间展示（api-keys 等管理页用）。 */
export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString('zh-CN');
}
