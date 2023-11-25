/**
 * 商家入住 店铺类型及主营类目 设置
 *
 * sobird<i@sobird.me> at 2023/06/22 22:41:07 created.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form, Card, Button, Alert, Radio, Cascader, Modal, message, Table,
} from 'antd';
import LayoutEntry from '@/layout/entry';
import MerchantService, {
  IMerchantCategory,
  IMerchantEntryEntity,
  IMerchantType,
} from '@/services/merchant';
import { getRowSpans, listToTree } from '@/utils';

import './index.scss';

const { Column } = Table;

function EntryShop() {
  const navigate = useNavigate();
  const [categoryOptions, setCategoryOptions] = useState<IMerchantCategory[]>([]);
  const [entryType, setEntryType] = useState<IMerchantType[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([MerchantService.category(), MerchantService.task()]).then(([categoryList, entryTask]) => {
      const categoryTree = listToTree(categoryList);
      setCategoryOptions(categoryTree);

      MerchantService.entryDetail(entryTask.entryTaskId).then(({ base }) => {
        const categoryId = base.category;
        const categoryValues = [categoryId];

        const categoryItem = categoryList.find((item) => { return item.id === base.category; });
        let categoryParentId = categoryItem.parentId;
        const catItem = categoryList.find((item) => { return item.id === categoryParentId; });

        while (categoryParentId) {
          categoryValues.unshift(catItem.id);
          categoryParentId = catItem.parentId;
        }

        form.setFieldsValue({ ...base, category: categoryValues, entryTaskId: entryTask.entryTaskId });
      });
    });

    // 获取店铺类型
    MerchantService.type().then((res) => {
      setEntryType(res);
    });
  }, []);

  // 表单提交
  const onFinish = (values: IMerchantEntryEntity['base']) => {
    const { category, poiType } = values;

    if (!category) {
      message.error('请选择主营类目');
      return;
    }

    if (!poiType) {
      message.error('请选择店铺类型');
      return;
    }

    MerchantService.updateEntry({
      base: {
        category: category[(category as number[]).length],
        poiType,
      },
    }).then(() => {
      navigate('/settleinjx/company');
    });
  };

  const options = entryType.map((item) => {
    return {
      value: item.poiType,
      label: (
        <>
          <span className="title">
            企业
            {item.poiTypeName}
          </span>
          <span className="desc">{item.poiTypeDesc}</span>
        </>
      ),
    };
  });

  const data = [
    {
      key: 1,
      poiTypeName: '企业旗舰店',
      poiTypeDesc: '经营一个品牌商品的旗舰店',
    },
    {
      key: 2,
      poiTypeName: '企业旗舰店',
      poiTypeDesc: '经营多个品牌商品，且各品牌归属于同一实际控制人的旗舰店',
    },
    {
      key: 3,
      poiTypeName: '企业旗舰店',
      poiTypeDesc: '卖场型品牌（服务类商标）商标权利人开设的旗舰店',
    },
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
    {
      key: 6,
      poiTypeName: '企业专营店',
      poiTypeDesc: '经营多个自有品牌商品的专营店',
    },
    {
      key: 7,
      poiTypeName: '企业专营店',
      poiTypeDesc: '经营多个授权品牌商品，持有相应注册商标权利人出具的销售授权文件',
    },
    {
      key: 8,
      poiTypeName: '企业专营店',
      poiTypeDesc: '同时经营自有品牌商品和授权品牌商品的专营店',
    },
    {
      key: 9,
      poiTypeName: '企业工厂店',
      poiTypeDesc: '经营一个或多个品牌商品的工厂店',
    },
    {
      key: 10,
      poiTypeName: '企业工厂店',
      poiTypeDesc: '经营商品的商标持有人或持有相应注册商标权利人出具的销售授权文件',
    },
    {
      key: 11,
      poiTypeName: '企业工厂店',
      poiTypeDesc: '经营商品均为自主生产的工厂店',
    },
  ];

  const rowSpans = getRowSpans(data, 'poiTypeName');

  return (
    <LayoutEntry>
      <div className="entry-shop">
        <div className="entry-shop-tips">
          <Alert
            message="目前平台仅开放数码家电/办公、宠物生活、母婴玩具、服饰鞋包、运动户外、汽配摩托、医药健康类目的商家自入驻，其余类目邀约制入驻请勿提交申请。入驻审核时效预计在7个工作日内，感谢支持。"
            type="info"
            showIcon
          />
        </div>

        <div className="entry-shop-main">
          <h2>请选择您的店铺类型及主营类目</h2>

          <Card>
            <Form form={form} onFinish={onFinish} layout="vertical">
              <Form.Item name="category" label="主营类目">
                <Cascader
                  options={categoryOptions}
                  fieldNames={{ label: 'name', value: 'id' }}
                  placeholder="主营类目决定您店铺的经营范围，请谨慎选择"
                  style={{ width: 430 }}
                />
              </Form.Item>
              <Form.Item
                name="poiType"
                label={(
                  <>
                    店铺类型
                    <Button onClick={() => { return setOpen(true); }} type="link" className="how-select">
                      该如何选择？
                    </Button>
                  </>
                )}
              >
                <Radio.Group
                  onChange={(event) => {
                    const { value } = event.target;
                    const poi = entryType.find((item) => { return item.poiType === value; });

                    Modal.warning({
                      title: `确定更改店铺类型为 ${poi.poiTypeName} ？`,
                      content: '温馨提示：如果更换店铺类型，店铺名称会被清空，需重新上传',
                      okText: '确定',
                    });
                  }}
                  options={options}
                  className="shop-type-radio"
                />
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className="entry-footer">
          <Button
            type="primary"
            onClick={() => {
              form.submit();
            }}
          >
            下一步
          </Button>
        </div>
      </div>

      <Modal
        title="企业店铺类型和资质说明"
        centered
        open={open}
        onOk={() => { return setOpen(false); }}
        onCancel={() => { return setOpen(false); }}
        width={1000}
        okText="我知道了"
      >
        <Table bordered pagination={false} dataSource={data}>
          <Column
            title="店铺类型"
            dataIndex="poiTypeName"
            key="poiTypeName"
            render={(text, _record, index) => {
              return {
                children: text,
                props: {
                  rowSpan: rowSpans[index],
                },
              };
            }}
          />
          <Column title="店铺说明" dataIndex="poiTypeDesc" key="poiTypeDesc" />
        </Table>
      </Modal>
    </LayoutEntry>
  );
}

export default EntryShop;
