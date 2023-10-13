/**
 * 经营趋势 卡片组件
 *
 * sobird<i@sobird.me> at 2023/10/13 19:20:09 created.
 */

import React, { useState, useEffect } from 'react';
import { Radio, RadioChangeEvent } from 'antd';
import { Line } from '@ant-design/charts';
import Card from '../workbench/components/card';
import './index.scss';

import AnalysisService, { ITrendingResponse } from '@/services/analysis';
import { Last_7_Day_Range, Last_1_Month_Range } from '@/utils/constant';

/** 经营趋势 数据项 */
export interface LineChartItem {
  title: string;
  tips: string;
  key: keyof ITrendingResponse;
  unit: '元' | '人' | '单' | '%' | '次' | '件';
  format?: 'money' | 'number';
}

/** 经营趋势 数据配置 */
const LineChartConfig: LineChartItem[] = [
  {
    title: '商品成交件数',
    tips: '店铺所有商品成交的总件数',
    key: 'transactionLine',
    unit: '件',
    format: 'number',
  },
  {
    title: '支付金额',
    tips: '该店铺支付订单的总金额，包含买家实际支付和使用平台优惠券的总金额，未剔除售后订单',
    key: 'paymentAmountLine',
    unit: '元',
    format: 'money',
  },
  {
    title: '评价数',
    tips: '统计周期内用户主动评价总数',
    key: 'reviewLine',
    unit: '次',
    format: 'number',
  },
  {
    title: '3分钟客服回复率',
    tips: '（咨询总人数之和—3分钟未回复人数之和 ）/ 咨询总人数之和',
    key: 'serviceReplyRateLine',
    unit: '%',
  },
];

const DateRangeConfig = [
  {
    key: 'Last_7_Day_Range',
    label: '近7天',
    value: Last_7_Day_Range,
  },
  {
    key: 'Last_1_Month_Range',
    label: '近30天',
    value: Last_1_Month_Range,
  },
];

/**
 * 修改chart y 轴单位
 * @param val 展示值
 * @param unit 单位
 * @returns
 */
const formatterLineChartY = (val: any, unit: string) => {
  if (unit === '%') {
    return (val * 1).toFixed() + unit;
  }
  return val >= 10000 ? `${val / 10000}万` : val;
};

/**
 * 自定义linechart hover框内容
 * @param data hover数据
 */
const linechartTooltip = (selectedData: LineChartItem, value: any) => {
  let content: string;
  const { unit, title } = selectedData;
  switch (unit) {
    case '%':
      content = (value * 1).toFixed(2);
      break;
    case '元':
      content = (+value).toFixed(2);
      break;
    default:
      content = value;
  }
  // return `${title} ${content}${unit}`;
  return {
    name: title,
    value: `${content}${unit}`,
  };
};

const TrendingLineChart = () => {
  const [data, setData] = useState<Partial<ITrendingResponse>>({});
  const [lineChartType, setLineChartType] = useState(LineChartConfig[0].key);
  const [dateRangeType, setDateRangeType] = useState(DateRangeConfig[1].key);
  const [selectedData, setSelectedData] = useState(LineChartConfig[0]);
  const poiId = 123;

  const currentData = data[lineChartType] || [];
  const currentConf = LineChartConfig.find((item: any) => item.key === lineChartType);

  // 数据请求
  useEffect(() => {
    if (!poiId) {
      return;
    }
    const dateRange = DateRangeConfig.find(item => item.key === dateRangeType);
    const [startTime, endTime] = dateRange.value.map(item => item.format('YYYYMMDD'));

    AnalysisService.trending({
      poiId,
      startTime,
      endTime,
    }).then(res => {
      setData(res);
    });
  }, [poiId, dateRangeType]);

  const dataRangeChange = (event: RadioChangeEvent) => {
    setDateRangeType(event.target.value);
  };
  const lineChartChange = (event: RadioChangeEvent) => {
    setLineChartType(event.target.value);
  };

  return (
    <Card
      className='trending-line-chart-card'
      title='经营趋势'
      extra={
        <Radio.Group onChange={dataRangeChange} value={dateRangeType} size='small'>
          {DateRangeConfig.map(item => (
            <Radio.Button className='radio-button' key={item.key} value={item.key}>
              {item.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      }
    >
      <Radio.Group value={lineChartType} onChange={lineChartChange} style={{padding: '20px 0'}}>
        {LineChartConfig.map((item: LineChartItem) => (
          <Radio key={item.key} value={item.key}>
            {item.title}
          </Radio>
        ))}
      </Radio.Group>

      <Line
        xAxis={{
          field: 'date',
        }}
        yAxis={{
          label: {
            formatter: (val: any) => formatterLineChartY(val, currentConf.unit),
          },
        }}
        xField='date'
        yField='value'
        data={currentData}
        height={214}
        color='#0080ff'
        smooth={true}
        tooltip={{
          formatter: axis => {
            return linechartTooltip(currentConf, axis.value);
          },
        }}
      />
    </Card>
  );
};

export default TrendingLineChart;
