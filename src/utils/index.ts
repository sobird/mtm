/**
 * index.ts
 * 
 * sobird<i@sobird.me> at 2023/06/30 19:48:37 created.
 */

/**
 * 实现表格数据相同的行合并
 * 
 * @param data any[]
 * @param key string
 * @returns
 */
export function getRowSpans (data: any[], key: string) {
  let sameValueLength = 0;
  const rowSpans = [];
  for(let i = data.length - 1; i >= 0; i--){
    if(i === 0) {
      rowSpans[i] = sameValueLength + 1;
      continue;
    }
    if(data[i][key] === data[i-1][key]) {
      rowSpans[i] = 0;
      sameValueLength++;
    } else {
      rowSpans[i] = sameValueLength + 1;
      sameValueLength = 0;
    }
  }
  return rowSpans;
}