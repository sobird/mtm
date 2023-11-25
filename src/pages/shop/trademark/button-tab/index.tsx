import { Button } from 'antd';

import './buttontab.scss';

interface IProps {
  buttonTabBoxStyle?: any; // button-tab-box高度
  config?: any[];
}

export default (props: IProps) => {
  const { config } = props;

  /**
   * @description: 点击事件
   * @param {*}
   * @return {*}
   */
  const handClick = (func: any) => {
    func?.();
  };

  /**
   * @description: 生成按钮的dom
   *
   * @param {*}
   * @return {*}
   */
  const getDoms = () => {
    return (config || []).map((item: any) => {
      return (
        <Button
          onClick={() => { return handClick(item.func); }}
          type={item.type}
          className="defaultBtn"
          style={item.style}
          key={item.key}
          disabled={item.disabled}
        >
          {item.text}
        </Button>
      );
    });
  };
  const { buttonTabBoxStyle } = props;
  return (
    <div className="button-tab-box" style={buttonTabBoxStyle}>
      {getDoms()}
    </div>
  );
};
