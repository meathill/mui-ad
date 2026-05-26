/**
 * 站长（operator / root key）模式下，按账号的功能（API Keys、待审批等）不适用时的占位提示。
 * 与 /users 非 admin 的拦截样式保持一致。
 */
export default function TenantOnlyNotice({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-deep">{label}</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">{title}</h1>
      <p className="mt-4 text-ink-soft">{children}</p>
    </div>
  );
}
