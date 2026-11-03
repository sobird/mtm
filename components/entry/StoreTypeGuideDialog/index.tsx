'use client';

import { Button, Dialog } from '@/components/ui';

import styles from './StoreTypeGuideDialog.module.css';

interface GuideRow {
  key: number;
  poiTypeName: string;
  poiTypeDesc: string;
}

const GUIDE_ROWS: GuideRow[] = [
  { key: 1, poiTypeName: '企业旗舰店', poiTypeDesc: '经营一个品牌商品的旗舰店' },
  {
    key: 2,
    poiTypeName: '企业旗舰店',
    poiTypeDesc: '经营多个品牌商品，且各品牌归属于同一实际控制人的旗舰店',
  },
  { key: 3, poiTypeName: '企业旗舰店', poiTypeDesc: '卖场型品牌（服务类商标）商标权利人开设的旗舰店' },
  {
    key: 4,
    poiTypeName: '企业专卖店',
    poiTypeDesc: '经营一个授权品牌的商品，但未获得品牌（注册商标）权利人独占授权入驻美团开放平台的商家专卖店',
  },
  {
    key: 5,
    poiTypeName: '企业专卖店',
    poiTypeDesc: '经营多个授权品牌的商品，且各品牌归同一实际控制人的商家专卖店',
  },
  { key: 6, poiTypeName: '企业专营店', poiTypeDesc: '经营多个自有品牌商品的专营店' },
  {
    key: 7,
    poiTypeName: '企业专营店',
    poiTypeDesc: '经营多个授权品牌商品，持有相应注册商标权利人出具的销售授权文件',
  },
  { key: 8, poiTypeName: '企业专营店', poiTypeDesc: '同时经营自有品牌商品和授权品牌商品的专营店' },
  { key: 9, poiTypeName: '企业工厂店', poiTypeDesc: '经营一个或多个品牌商品的工厂店' },
  {
    key: 10,
    poiTypeName: '企业工厂店',
    poiTypeDesc: '经营商品的商标持有人或持有相应注册商标权利人出具的销售授权文件',
  },
  { key: 11, poiTypeName: '企业工厂店', poiTypeDesc: '经营商品均为自主生产的工厂店' },
];

function getRowSpans(rows: GuideRow[]): number[] {
  const spans = rows.map(() => 0);
  let index = 0;

  while (index < rows.length) {
    let end = index;

    while (end < rows.length && rows[end].poiTypeName === rows[index].poiTypeName) {
      end += 1;
    }

    spans[index] = end - index;
    index = end;
  }

  return spans;
}

export interface StoreTypeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreTypeGuideDialog({ open, onOpenChange }: StoreTypeGuideDialogProps) {
  const rowSpans = getRowSpans(GUIDE_ROWS);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title='企业店铺类型和资质说明'
      className={styles.dialog}
      footer={<Button onClick={() => onOpenChange(false)}>我知道了</Button>}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope='col'>店铺类型</th>
            <th scope='col'>店铺说明</th>
          </tr>
        </thead>
        <tbody>
          {GUIDE_ROWS.map((row, index) => (
            <tr key={row.key}>
              {rowSpans[index] > 0 ? (
                <td rowSpan={rowSpans[index]} className={styles.typeName}>
                  {row.poiTypeName}
                </td>
              ) : null}
              <td>{row.poiTypeDesc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

export default StoreTypeGuideDialog;
