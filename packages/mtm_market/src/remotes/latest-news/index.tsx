/**
 * 最新动态 卡片组件
 *
 * sobird<i@sobird.me> at 2023/10/11 19:17:53 created.
 */

import React, { useState, useEffect, ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import MessageService from '@/services/message';
import Card from '../workbench/components/card';
import './index.scss';

export interface LatestNewsCardProps extends ComponentProps<typeof Card> {
  callback?: (data: any) => any;
}

const LatestNewsCard: React.FunctionComponent<LatestNewsCardProps> = ({callback, ...props}) => {
  const [tabNoticeList, setTabNoticeList] = useState([]);
  // const [noticeTitleMaxWidthList, setNoticeTitleMaxWidthList] = useState<number[]>(new Array(3).fill(0));

  // 重置最新动态消息内容最大宽度
  // const resetNewsMaxWidth = list => {
  //   const totalTitleWordCount = list.reduce((pre, cur) => {
  //     pre += cur.title?.length || 0;
  //     return pre;
  //   }, 0);
  //   // 总字数不超宽或字数均超过15，按照字数比例分配
  //   if (totalTitleWordCount <= 51 || list.every(item => item?.title?.length > 15)) {
  //     list.forEach((item, index: number) => {
  //       setNoticeTitleMaxWidthList((list: number[]) => {
  //         const cloneList = list.slice();
  //         // 整行宽度剩余766px给消息标题
  //         cloneList[index] = Math.floor((item?.title?.length / totalTitleWordCount) * 766);
  //         return cloneList;
  //       });
  //     });
  //   } else {
  //     let curUsedSpace = 0;
  //     let curAllocatedWordCount = 0;
  //     list
  //       .filter(item => item?.title?.length <= 15)
  //       .forEach(item => {
  //         setNoticeTitleMaxWidthList((li: Array<number>) => {
  //           const cloneList = li.slice();
  //           const computedIndex = list.findIndex(it => it.messageId === item.messageId);
  //           // 默认15字占用屏幕宽度230px,按比例分配
  //           cloneList[computedIndex] = Math.floor((item?.title?.length / 15) * 230);
  //           curUsedSpace += cloneList[computedIndex];
  //           curAllocatedWordCount += item?.title?.length || 0;
  //           return cloneList;
  //         });
  //       });
  //     if (totalTitleWordCount === curAllocatedWordCount) return;
  //     const computedList = list.filter(item => item?.title?.length > 15);
  //     computedList.forEach(item => {
  //       setNoticeTitleMaxWidthList((li: Array<number>) => {
  //         const cloneList = li.slice();
  //         const computedIndex = list.findIndex(it => it.messageId === item.messageId);
  //         cloneList[computedIndex] = Math.floor(
  //           (item?.title?.length / (totalTitleWordCount - curAllocatedWordCount)) * (766 - curUsedSpace)
  //         );
  //         return cloneList;
  //       });
  //     });
  //   }
  // };

  // useEffect(() => {
  //   resetNewsMaxWidth(tabNoticeList);
  // }, [tabNoticeList]);

  useEffect(() => {
    MessageService.latestNews().then(res => {
      setTabNoticeList(res || []);
      callback?.(res);
    });
  }, []);

  if (!tabNoticeList.length) {
    return null;
  }
  return (
    <Card
      classCard='latest-news-card'
      headStyle={{ borderBottom: 0, minHeight: 40 }}
      title='最新动态'
      subTitle={
        <div className='news-list'>
          {tabNoticeList.map(item => (
            <div className='news-brief' key={item?.id}>
              <Link className='news-title' to={`/site-notice/detail/${item?.id}?catagoryName=${item?.catagoryName}`}>
                {item.title}
              </Link>
              <span className='news-date'>{dayjs(item.publishTime * 1000).format('MM-DD')}</span>
            </div>
          ))}
        </div>
      }
      extra={
        <Link to='/site-notice/' className='news-more'>
          更多
          <RightOutlined />
        </Link>
      }
      {...props}
    />
  );
};
export default LatestNewsCard;
