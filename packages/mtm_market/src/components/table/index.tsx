/**
 * 表格
 *
 * sobird<i@sobird.me> at 2023/10/05 23:50:18 created.
 */

import React, { ComponentProps } from 'react';
import { Table } from 'antd';
import useSearchParamsState from '@/hooks/useSearchParamsState';

const MTable: React.FC<ComponentProps<typeof Table>> = ({ children, pagination, ...props }) => {
  const [searchParamPn, setSearchParamPn] = useSearchParamsState('pn', '1');
  const [searchParamPs, setSearchParamPs] = useSearchParamsState('ps', '20');

  return (
    <Table
      rowKey='id'
      scroll={{ x: 1400 }}
      size='middle'
      pagination={{
        position: ['bottomCenter'],
        current: Number(searchParamPn),
        pageSize: Number(searchParamPs),
        showSizeChanger: true,
        onChange: (page, pageSize) => {
          setSearchParamPn(String(page));
          setSearchParamPs(String(pageSize));
        },
        ...pagination,
      }}
      {...props}
    >
      {children}
    </Table>
  );
};

export default MTable;