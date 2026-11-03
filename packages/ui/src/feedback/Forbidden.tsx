import Link from 'next/link';

export interface ForbiddenProps {
  homeHref?: string;
}

export function Forbidden({ homeHref = '/' }: ForbiddenProps) {
  return (
    <div
      role='alert'
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 48, fontWeight: 600 }}>403</p>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>无权访问该页面</h1>
      <Link href={homeHref} style={{ color: 'var(--color-info)' }}>
        返回首页
      </Link>
    </div>
  );
}

export default Forbidden;
