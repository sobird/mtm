/**
 * 商家成长 卡片组件
 *
 * @todo
 * shopInfo 获取
 * 路由跳转权限判断
 *
 * sobird<i@sobird.me> at 2023/10/12 22:40:17 created.
 */

import React, { ComponentProps, useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import QRCode from 'qrcode.react';
import { message } from 'antd';
// import { openNewTab } from '@util/agent';
import Card from '../workbench/components/card';
import './index.scss';

import AnalysisService, { IOperation } from '@/services/analysis';
import MerchantService from '@/services/merchant';

type MerchantGrowthData = Partial<Pick<IOperation, 'scoreSet' | 'rateSet'>>;

enum CARD_TYPE {
  serviceScore = 'serviceScore',
  overallScore = 'overallScore',
}

type dataKey = 'serviceScore' | 'overallScore';

const TAG_STYLES = {
  normal: {
    color: '#0080FF',
    backgroundColor: 'rgba(0,128,255,0.08)',
  },
  excellent: {
    color: '#00B84A',
    backgroundColor: 'rgba(0,184,74,0.08)',
  },
  bad: {
    color: '#FF4338',
    backgroundColor: 'rgba(255,67,56,0.08)',
  },
  noData: {
    color: '#666666',
    backgroundColor: '#EBEBEB',
  },
};

const cardConfig: { [key in dataKey]: any } = {
  serviceScore: {
    title: '服务评价分',
    tips: (
      <div>
        平台从售后、物流、客服、纠纷 四个维度对商家的整体服务分进行评估的数据指标
        <div style={{ height: 10 }} />
        服务分达到4分及以上的商家为优秀商家
      </div>
    ),
    subData: [
      {
        title: '近30天3分钟回复率',
        key: 'customerReplyRate',
        unit: '%',
      },
      {
        title: '近30天发货及揽收准时率',
        key: 'collectOnTimeRate',
        unit: '%',
      },
    ],
  },
  overallScore: {
    title: '综合评价分',
    tips: (
      <div>
        综合评价分为近30天店铺下所有主动评价的订单分数的平均值
        <div style={{ height: 10 }} />
        对于近30天店铺的有效评价数不足的20个的店铺，暂不统计评分，综合评价分为0
        <div style={{ height: 10 }} />
        综合评价分低于4.0分 属于异常
        <div style={{ height: 10 }} />
        商家需要重点关注。如不及时调整会影响店铺的正常经营
      </div>
    ),
    subData: [
      {
        title: '新增评价数',
        key: 'newlyReviewCount',
        unit: '条',
      },
    ],
  },
};

const formatRate = (data: string | number, unit: string) => {
  if (data === 0) {
    return `${data}${unit}`;
  }
  if (!data) {
    return `--${unit}`;
  }
  if (unit === '%') {
    return `${(+data * 100).toFixed(2)}${unit}`;
  }
  return `${data}${unit}`;
};

const formatScore = (score: number) => {
  if (score === undefined || score === null) {
    return '--';
  }
  return score.toFixed(2);
};

interface GrowthCardProps extends ComponentProps<'div'> {
  type: dataKey;
  data: MerchantGrowthData;
  loading: boolean;
}

/** 成长卡片 */
const GrowthCard = ({ type, data, loading, ...props }: GrowthCardProps) => {
  const { scoreSet, rateSet } = data;
  const isService = type === CARD_TYPE.serviceScore;
  const subData = cardConfig[type].subData;
  const serviceScoreJudge = scoreSet?.serviceScoreJudge || 4;
  const overallScoreJudge = scoreSet?.overallScoreJudge || 4;

  let tagStyle = {};
  let tagName = '';
  if (scoreSet?.[type] === null || scoreSet?.[type] === undefined) {
    tagName = '';
    tagStyle = TAG_STYLES.noData;
  } else if (isService) {
    if (scoreSet?.[type] >= serviceScoreJudge) {
      tagName = '已达到优秀商家';
      tagStyle = TAG_STYLES.excellent;
    }
    if (scoreSet?.[type] < serviceScoreJudge) {
      tagName = '未达到优秀商家';
      tagStyle = TAG_STYLES.bad;
    }
  } else {
    if (scoreSet?.[type] >= overallScoreJudge) {
      tagName = '正常';
      tagStyle = TAG_STYLES.excellent;
    }
    if (scoreSet?.[type] < overallScoreJudge) {
      tagName = '预警';
      tagStyle = TAG_STYLES.bad;
    }
    if (scoreSet?.[type] === 0) {
      tagName = '暂未统计';
      tagStyle = TAG_STYLES.noData;
    }
  }

  return (
    <div className='growth-card' {...props}>
      <div className='growth-card-title'>
        <span className='growth-card-title-name'>{cardConfig[type].title}</span>

        {tagName ? (
          <span className='growth-card-title-tag' style={{ ...tagStyle }}>
            {tagName}
          </span>
        ) : null}
      </div>

      <div className='score-wrap'>
        <Tooltip
          title={cardConfig[type].tips}
          overlayClassName='home-page-tool-tip'
          color='#fff'
          overlayInnerStyle={{ fontSize: 12, color: '#333' }}
        >
          <div className='score'>
            {loading ? (
              <div className='loading'>
                {/* <Icon type="loading" style={{ fontSize: 23, color: '#0080ff' }} spin /> */}
              </div>
            ) : (
              formatScore(scoreSet?.[type])
            )}
            <span>分</span>
          </div>
        </Tooltip>
        {typeof scoreSet?.[type] !== 'number' ? <p className='no-data'>（计算中...）</p> : null}
      </div>

      <div className='notes-wrap'>
        <div className='tip'>请重点关注以下数据:</div>

        {subData.map((item: any) => (
          <p className='important-data' key={item.key}>{`${item.title}: ${formatRate(
            rateSet?.[item.key],
            item.unit
          )}`}</p>
        ))}
      </div>
    </div>
  );
};

export interface MerchantGrowthCardProps extends ComponentProps<typeof Card> {
  callback?: (data: any[]) => any;
}

/** 商家成长 */
const MerchantGrowthCard: React.FC<MerchantGrowthCardProps> = ({ callback, ...props }) => {
  const [data, setData] = useState<MerchantGrowthData>({});
  const shopInfo = {
    poiId: 148568,
    name: '小米妈妈家居旗舰店',
  };
  const { poiId, name: shopName } = shopInfo;
  // 路由权限判断
  const pathMap = {};
  const [loading, setLoading] = useState(true);
  const [countSet, setCountSet] = useState({ taskCount: 0, awardCount: 0 });
  const SHOP_JUMP_URL = `${process.env.SHOP_JUMP_URL}?env=prod&poiId=${poiId}&g_source=682`;

  /**
   * 任务跳转页面
   * @param path 跳转path
   * @param btnIndex 按钮下标
   * @param btnName 按钮名字
   */
  const taskPageJump = (path: string, btnIndex: number, btnName: string) => {
    if (!pathMap[path]) {
      message.error('当前跳转页面无权限，请联系主账户进行开通');
      return;
    }
    //openNewTab(path, '综合评价分');
  };

  /**
   * 商家经营分跳转
   * @param path
   * @param btnIndex
   * @param btnName
   */
  const scorePageJump = (path: string, btnIndex: number, btnName: string) => {
    if (!pathMap[path]) {
      message.error('当前跳转页面无权限，请联系主账户进行开通');
      return;
    }
    // openNewTab(path, '服务评价分');
  };

  useEffect(() => {
    if (!poiId) {
      return;
    }
    // 获取任务和奖励总数
    const tasks = MerchantService.tasks(poiId).then((res: any) => {
      const { curTaskCount, curAwardCount } = res;
      setCountSet({
        taskCount: curTaskCount || 0,
        awardCount: curAwardCount || 0,
      });

      return res;
    });
    const operation = AnalysisService.operation(poiId)
      .then(res => {
        console.log('res', res);
        setData(res || {});
        return res;
      })
      .finally(() => {
        setLoading(false);
      });

    Promise.all([tasks, operation]).then(res => {
      callback?.(res);
    });
  }, [poiId]);

  /**
   * 处理商家名称
   * @param title 待处理的商家名称
   * @returns { string }
   */
  const handleTitleWordsOverflow = (title: string): string | JSX.Element => {
    if (!title) return '商家经营';
    if (title.length > 10) {
      return (
        <Tooltip overlayInnerStyle={{ color: '#333', fontSize: 12 }} color='#fff' placement='top' title={title}>
          <span>{`${title.substring(0, 10)}...`}</span>
        </Tooltip>
      );
    }
    return title;
  };

  return (
    <Card
      className='merchant-growth-card'
      title={handleTitleWordsOverflow(shopName)}
      subTitle={
        <Tooltip
          color='#fff'
          title={
            <div className='merchant-shop-qrcode'>
              <div className='merchant-shop-qrcode-wrap'>
                <p className='merchant-shop-qrcode-title'>{shopName || '店铺二维码'}</p>
                <p className='merchant-shop-qrcode-desc'>打开美团App扫码查看店铺详情</p>
                <div className='qrcode-box'>
                  <QRCode size={100} value={SHOP_JUMP_URL} />
                </div>
              </div>
            </div>
          }
        >
          <i className='icon iconfont icon-qrcode'></i>
        </Tooltip>
      }
      extra={
        <div>
          <span>
            {countSet.taskCount ? (
              <>
                <a onClick={() => taskPageJump('/merchant-growing/growing-task', 0, '待做任务')}>
                  有{countSet.taskCount}个任务待完成
                </a>
              </>
            ) : null}
            {countSet.taskCount && countSet.awardCount ? '，' : null}
            {countSet.awardCount ? (
              <a onClick={() => taskPageJump('/merchant-growing/reward-center', 1, '待领奖励')}>
                有{countSet.awardCount}个奖励待查看
              </a>
            ) : null}
            {!countSet.taskCount && !countSet.awardCount ? (
              <a onClick={() => taskPageJump('/merchant-growing/growing-task', 2, '商家成长')}>商家成长</a>
            ) : null}
          </span>
        </div>
      }
      {...props}
    >
      <div className='growth-card-wrap'>
        <GrowthCard
          loading={loading}
          onClick={() => scorePageJump('/data/center/service-analysis', 0, '服务分析')}
          type={CARD_TYPE.serviceScore}
          data={data}
        />
        <GrowthCard
          loading={loading}
          onClick={() => scorePageJump('/customer-manage/comment', 1, '综合评价分')}
          type={CARD_TYPE.overallScore}
          data={data}
        />
      </div>
    </Card>
  );
};

export default MerchantGrowthCard;
