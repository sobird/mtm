import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: '注册 - 美团电商商家管理后台',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
