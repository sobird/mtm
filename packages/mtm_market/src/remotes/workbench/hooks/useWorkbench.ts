/**
 * useWorkbenchService
 *
 * sobird<i@sobird.me> at 2023/10/12 17:15:59 created.
 */

import { useState, useEffect } from 'react';
import AnalysisService from '@/services/analysis';

interface resultProps {
  // 加载中
  loading: boolean;
  // 工作台数据
  overview: { [key: string]: any };
  // 今日实时数据
  realdata: { [key: string]: any };
}

const useHomeData = (): resultProps => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ [key: string]: any }>({});
  // todo
  const poiId = 123;

  useEffect(() => {
    if (!poiId) return;
    AnalysisService.workbench(poiId)
      .then(res => {
        setData(res);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [poiId]);

  return {
    loading,
    overview: data?.overview || {},
    realdata: data?.realdata || {},
  };
};

export default useHomeData;
