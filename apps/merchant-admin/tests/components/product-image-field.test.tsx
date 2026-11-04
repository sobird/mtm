import { act, cleanup, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { ToastProvider } from '@/components/ui/Toast';

const mocks = vi.hoisted(() => ({ uploadProductImage: vi.fn() }));

vi.mock('@/lib/services/products', () => ({
  uploadProductImage: mocks.uploadProductImage,
}));

import ProductImageField from '@/components/product/ProductImageField';

function imageFile(name: string): File {
  return new File(['fake'], name, { type: 'image/png' });
}

function deferredUploads() {
  const resolvers: Array<(value: { id: string; url: string }) => void> = [];

  mocks.uploadProductImage.mockImplementation(
    () =>
      new Promise<{ id: string; url: string }>(resolve => {
        resolvers.push(resolve);
      })
  );

  return resolvers;
}

afterEach(cleanup);

beforeEach(() => {
  mocks.uploadProductImage.mockReset();
});

test('逐个串行上传，最多保留 5 张', async () => {
  const resolvers = deferredUploads();
  const onChange = vi.fn();
  const { container } = render(
    <ToastProvider>
      <ProductImageField value={[]} onChange={onChange} />
    </ToastProvider>
  );

  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(
    input,
    Array.from({ length: 7 }, (_, index) => imageFile(`${index}.png`))
  );

  await waitFor(() => expect(resolvers).toHaveLength(1));
  expect(mocks.uploadProductImage).toHaveBeenCalledTimes(1);

  for (let index = 0; index < 5; index += 1) {
    // eslint-disable-next-line no-await-in-loop -- 串行断言：逐个放行上传
    await waitFor(() => expect(resolvers).toHaveLength(index + 1));
    // eslint-disable-next-line no-await-in-loop -- 串行断言：逐个放行上传
    await act(async () => {
      resolvers[index]({ id: String(index), url: `https://example.com/${index}.png` });
    });
  }

  await waitFor(() => expect(mocks.uploadProductImage).toHaveBeenCalledTimes(5));
  await waitFor(() => {
    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toHaveLength(5);
  });
  expect(onChange.mock.calls.at(-1)?.[0]).toEqual([
    'https://example.com/0.png',
    'https://example.com/1.png',
    'https://example.com/2.png',
    'https://example.com/3.png',
    'https://example.com/4.png',
  ]);
});

test('已有 4 张时只再上传 1 张', async () => {
  const resolvers = deferredUploads();
  const onChange = vi.fn();
  const existing = ['a', 'b', 'c', 'd'];
  const { container } = render(
    <ToastProvider>
      <ProductImageField value={existing} onChange={onChange} />
    </ToastProvider>
  );

  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await userEvent.upload(input, [imageFile('e.png'), imageFile('f.png')]);

  await waitFor(() => expect(resolvers).toHaveLength(1));
  await act(async () => {
    resolvers[0]({ id: 'e', url: 'https://example.com/e.png' });
  });

  await waitFor(() => {
    const lastCall = onChange.mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual(['a', 'b', 'c', 'd', 'https://example.com/e.png']);
  });
  expect(mocks.uploadProductImage).toHaveBeenCalledTimes(1);
});
