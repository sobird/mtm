import { Product } from '@/lib/db/models';

export interface ProductDTO {
  [key: string]: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/**
 * Returns the selling product snapshot. `poiId` is accepted for API-shape
 * compatibility; the demo seed stores a single snapshot.
 */
export async function getSellingProduct(poiId?: number): Promise<{ total: number; items: ProductDTO[] }> {
  void poiId;

  const row = await Product.findOne({ order: [['id', 'ASC']] });

  if (!row) {
    return { total: 0, items: [] };
  }

  const payload = asRecord(row.payload);
  const total = Number(payload.total);
  const items = Array.isArray(payload.items) ? (payload.items as ProductDTO[]) : [];

  return { total: Number.isFinite(total) ? total : 0, items };
}
