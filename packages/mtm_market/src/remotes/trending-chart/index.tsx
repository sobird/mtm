/**
 * 经营趋势 卡片组件
 *
 * sobird<i@sobird.me> at 2023/10/13 19:20:09 created.
 */

import React, { useState, useEffect } from 'react';
// import homeApiManage from '@api/home-api-manage';
import dayjs from 'dayjs';
// import { mc } from '@util/report/wrapper';

import { Radio } from 'antd';

const { Group: RadioGroup, Button: RadioButton } = Radio;

const RadioButtonGroup = RadioGroup;
import { Line } from '@ant-design/charts';
import Card from '../workbench/components/card';
import './index.scss';

import AnalysisService, { ITrendingResponse } from '@/services/analysis';

// line属性配置
interface chartLineProps {
  title: string; // 卡片标题
  tipWord: string;
  dataKey: string;
  unit: '元' | '人' | '单' | '%' | '次' | '件';
  format?: 'money' | 'number';
  reportParams?: {
    valLab: { [key: string]: any };
  };
}

// chart选项配置
const tradeDataConfig: chartLineProps[] = [
  {
    title: '商品成交件数',
    tipWord: '店铺所有商品成交的总件数',
    dataKey: 'transactionNum',
    unit: '件',
    format: 'number',
    reportParams: {
      valLab: {
        btn_index: 0,
        btn_name: '商品成交件数',
      },
    },
  },
  {
    title: '支付金额',
    tipWord: '该店铺支付订单的总金额，包含买家实际支付和使用平台优惠券的总金额，未剔除售后订单',
    dataKey: 'payPrice',
    unit: '元',
    format: 'money',
    reportParams: {
      valLab: {
        btn_index: 1,
        btn_name: '支付金额',
      },
    },
  },
  {
    title: '评价数',
    tipWord: '统计周期内用户主动评价总数',
    dataKey: 'reviewNum',
    unit: '次',
    format: 'number',
    reportParams: {
      valLab: {
        btn_index: 2,
        btn_name: '评价数',
      },
    },
  },
  {
    title: '3分钟客服回复率',
    tipWord: '（咨询总人数之和—3分钟未回复人数之和 ）/ 咨询总人数之和',
    dataKey: 'customerReplyRate',
    unit: '%',
    reportParams: {
      valLab: {
        btn_index: 3,
        btn_name: '3分钟客服回复率',
      },
    },
  },
];

interface buttonOptions {
  key: string;
  params: {
    startTime: number;
    endTime: number;
  };
  label: string;
  sectionNum: number;
  reportParams?: {
    valLab: { [key: string]: any };
  };
}

const buttonWidthParams: buttonOptions[] = [
  {
    key: 'near7days',
    params: {
      endTime: +dayjs().subtract(1, 'day').format('YYYYMMDD'),
      startTime: +dayjs().subtract(7, 'day').format('YYYYMMDD'),
    },
    label: '近7天',
    sectionNum: 7,
    reportParams: {
      valLab: {
        menu_name: '近7天',
      },
    },
  },
  {
    key: 'near30days',
    params: {
      endTime: +dayjs().subtract(1, 'day').format('YYYYMMDD'),
      startTime: +dayjs().subtract(30, 'day').format('YYYYMMDD'),
    },
    label: '近30天',
    sectionNum: 30,
    reportParams: {
      valLab: {
        menu_name: '近30天',
      },
    },
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
    return (val * 100).toFixed() + unit;
  }
  return val >= 10000 ? `${val / 10000}万` : val;
};

/**
 * 自定义linechart hover框内容
 * @param data hover数据
 */
const linechartHoverContent = (selectChartData: chartLineProps, data: any) => {
  let content: string;
  const { unit, title } = selectChartData;
  switch (unit) {
    case '%':
      content = (data[0].value * 100).toFixed(2);
      break;
    case '元':
      content = (+data[0].value).toFixed(2);
      break;
    default:
      content = data[0].value;
  }
  return `${title} ${content}${unit}`;
};

const TrendingChart = () => {
  const [data, setData] = useState<Partial<ITrendingResponse>>({});
  const [chartType, setChartTpe] = useState(tradeDataConfig[0].dataKey);
  const [buttonType, setButtonType] = useState(buttonWidthParams[1].key);
  const poiId = 123;
  const [selectChartData, setSelectChartData] = useState(tradeDataConfig[0]);

  useEffect(() => {
    if (!poiId) {
      return;
    }
    const dateParams = buttonWidthParams.find((item: buttonOptions) => item.key === buttonType);
    const params = {
      poiId,
      ...dateParams.params,
    };

    AnalysisService.trending(params).then(res => {
      setData(res);
    })
    // homeApiManage.getManageTrend(params).then(res => {
    //   if (res.code === 0) {
    //     setData(res?.data || []);
    //   }
    // });
  }, [poiId, buttonType]);

  useEffect(() => {
    const hasBeSelectedData = tradeDataConfig.find((item: any) => item.dataKey === chartType);
    setSelectChartData(hasBeSelectedData);
  }, [chartType]);

  const getChartData = () => {
    const sectionNum = buttonWidthParams.find((item: buttonOptions) => item.key === buttonType).sectionNum;
    const chartSeries = Array.from({ length: sectionNum }, (_, index: number) => ({
      date: dayjs()
        .subtract(sectionNum - index, 'day')
        .format('YYYY-MM-DD'),
      value: Math.round(Math.random() * 100),
      // transactionData.find(
      //   (data: any) => {
      //     console.log('data', data, +dayjs()
      //     .subtract(sectionNum - index, 'day')
      //     .format('YYYYMMDD'))
      //     return data?.date ===
      //     +dayjs()
      //       .subtract(sectionNum - index, 'day')
      //       .format('YYYYMMDD')
      //   }

      // )?.[chartType] ?? (chartType === 'customerReplyRate' ? null : 0),
    }));
    console.log('chartSeries', chartSeries);
    return chartSeries;
  };

  const chartData = getChartData();

  /**
   * 选择日期
   * @param val 选中时间的自定义key
   */
  const handleButtonChange = (val: any) => {
    const selectedTimeBtnData = buttonWidthParams.find((item: buttonOptions) => item.key === val);
    const {
      reportParams: { valLab },
    } = selectedTimeBtnData;
    const radioValLab = selectChartData.reportParams.valLab;
    // mc('b_group_mall_b_l11545cz_mc', { poi_id: poiId, ...valLab, ...radioValLab });
    setButtonType(val);
  };

  /**
   * 选择数据类型
   * @param val 选中的数据类型
   */
  const handleTypechange = (val: any) => {
    const selectedEchart = tradeDataConfig.find((item: chartLineProps) => item.dataKey === val);
    const {
      reportParams: { valLab },
    } = selectedEchart;
    const btnName = buttonType === 'near7days' ? '近7天' : '近30天';
    // mc('b_group_mall_b_vkdkw90u_mc', { poi_id: poiId, ...valLab, menu_name: btnName });
    setChartTpe(val);
  };

  return (
    <div className='home-component-manage-tendency'>
      <Card
        title='经营趋势'
        extra={
          <RadioButtonGroup onChange={handleButtonChange} value={buttonType}>
            {buttonWidthParams.map((item: buttonOptions) => (
              <RadioButton type='hollow' className='radio-button' key={item.key} value={item.key} size='small'>
                {item.label}
              </RadioButton>
            ))}
          </RadioButtonGroup>
        }
      >
        <RadioGroup value={chartType} onChange={handleTypechange} className='type-select'>
          {tradeDataConfig.map((item: chartLineProps) => (
            <Radio key={item.dataKey} value={item.dataKey}>
              {item.title}
            </Radio>
          ))}
        </RadioGroup>

        <Line
          key={selectChartData.title}
          // xAxis='date'
          // yAxis={{
          //   field: 'value',
          //   min: 0,
          //   where: true,
          //   label: {
          //     formatter: (val: any) => formatterLineChartY(val, selectChartData.unit),
          //   },
          // }}
          // chart={{
          //   height: 214,
          //   colors: ['#0080ff'],
          // }}
          xField='date'
          yField='value'
          data={chartData}
          height={214}
          smooth={true}
          // tooltip={{
          //   htmlContent: (label: any, data: any) =>
          //     `<div class="g2-tooltip-tendency"><p>${label}</p><p>${linechartHoverContent(
          //       selectChartData,
          //       data
          //     )}</p></div>`,
          // }}
        />
      </Card>
    </div>
  );
};

export default TrendingChart;
