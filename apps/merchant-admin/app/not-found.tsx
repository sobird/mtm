import Link from 'next/link';

import { PageContainer } from '@/components/layout/PageContainer';

export default function NotFound() {
  return (
    <PageContainer title='页面不存在' description='您访问的页面可能已下线，或地址输入有误。'>
      <p>
        <Link href='/'>返回首页</Link>
      </p>
    </PageContainer>
  );
}
