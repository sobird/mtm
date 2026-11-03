import { prisma } from '@/lib/db';
import type { Message } from '@/lib/generated/prisma';

import { AppError } from '../errors';

export type MessageKind = 'news' | 'detail';

export interface MessageBriefDTO {
  kind: MessageKind;
  id: string;
  type: number;
  title: string;
  publishTime: string | null;
}

export interface MessageDTO extends MessageBriefDTO {
  content: string | null;
  createTime: string | null;
  duration: number | null;
  noticeStyle: number | null;
  notifyEnable: boolean | null;
  actionList: unknown;
}

function toISO(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function toMessageBriefDTO(row: Message): MessageBriefDTO {
  return {
    kind: row.kind as MessageKind,
    id: row.id,
    type: row.type ?? 0,
    title: row.title ?? '',
    publishTime: toISO(row.publishTime),
  };
}

function toMessageDTO(row: Message): MessageDTO {
  return {
    ...toMessageBriefDTO(row),
    content: row.content ?? null,
    createTime: toISO(row.createTime),
    duration: row.duration ?? null,
    noticeStyle: row.noticeStyle ?? null,
    notifyEnable: row.notifyEnable ?? null,
    actionList: row.actionList ?? [],
  };
}

export async function getLatestMessages(): Promise<MessageBriefDTO[]> {
  const rows = await prisma.message.findMany({
    where: { kind: 'news' },
    orderBy: { publishTime: 'desc' },
  });

  const list: MessageBriefDTO[] = [];
  for (const row of rows) {
    list.push(toMessageBriefDTO(row));
  }

  return list;
}

export async function getMessage(id: string): Promise<MessageDTO> {
  const row = await prisma.message.findUnique({ where: { kind_id: { kind: 'detail', id } } });

  if (!row) {
    throw new AppError('NOT_FOUND', 404, '消息不存在');
  }

  return toMessageDTO(row);
}
