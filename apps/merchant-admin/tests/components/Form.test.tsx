import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

afterEach(cleanup);

const schema = z.object({ mobile: z.string().min(11, '手机号必须为 11 位') });

test('shows the zod message for invalid input', async () => {
  const onSubmit = vi.fn();
  render(
    <Form schema={schema} defaultValues={{ mobile: '' }} onSubmit={onSubmit}>
      <Field label='手机号'>
        <Input name='mobile' />
      </Field>
      <Button type='submit'>提交</Button>
    </Form>
  );
  await userEvent.click(screen.getByText('提交'));
  expect(await screen.findByText('手机号必须为 11 位')).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.queryByText('手机号必须为 11 位')).toBeInTheDocument());
});

test('submits parsed values for valid input', async () => {
  const parsedSchema = z.object({
    mobile: z
      .string()
      .min(11)
      .transform(value => `+86${value}`),
  });
  const onSubmit = vi.fn();
  render(
    <Form schema={parsedSchema} defaultValues={{ mobile: '' }} onSubmit={onSubmit}>
      <Field label='手机号'>
        <Input name='mobile' />
      </Field>
      <Button type='submit'>提交</Button>
    </Form>
  );
  await userEvent.type(screen.getByRole('textbox'), '13800138000');
  await userEvent.click(screen.getByText('提交'));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toEqual({ mobile: '+8613800138000' });
});

test('Select renders options and reports the selected value', async () => {
  const onChange = vi.fn();
  render(
    <Select
      aria-label='城市'
      placeholder='请选择'
      options={[
        { value: 'bj', label: '北京' },
        { value: 2, label: '上海' },
      ]}
      onChange={onChange}
    />
  );

  const trigger = screen.getByRole('combobox');
  expect(trigger).toHaveTextContent('请选择');

  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('option', { name: '上海' }));

  expect(onChange).toHaveBeenCalledWith(2);
  expect(trigger).toHaveTextContent('上海');
});

test('Checkbox registers inside a Form', async () => {
  const agreeSchema = z.object({ agree: z.boolean().refine(value => value, '请勾选同意') });
  const onSubmit = vi.fn();
  render(
    <Form schema={agreeSchema} defaultValues={{ agree: false }} onSubmit={onSubmit}>
      <Checkbox name='agree' label='同意' />
      <Button type='submit'>提交</Button>
    </Form>
  );

  await userEvent.click(screen.getByLabelText('同意'));
  await userEvent.click(screen.getByText('提交'));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toEqual({ agree: true });
});
