/**
 * 用户登录页面
 * 
 * sobird<i@sobird.me> at 2023/06/12 8:24:06 created.
 */
import React, { useEffect } from 'react';
import { useNavigate, RouterProviderProps, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import './index.scss';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  console.log('location', location)
  useEffect(() => {
    try {
      // 短时间多次登录处理逻辑
      const preLoginDateStr = localStorage.getItem('preLoginDateStr') || '';
      const preLoginDateArr = preLoginDateStr.split(',');
      // 最近10秒连续登陆3次，最近1分钟连续登陆5次，跳转到error，并进行上报
      if ((preLoginDateArr.length >= 3 && +preLoginDateArr[0] - +preLoginDateArr[2] < 10000) || (preLoginDateArr.length >= 5 && +preLoginDateArr[0] - +preLoginDateArr[4] < 60000)) {
        metrics.report('login', 1, {
          type: 'endlessLoop',
          code: -1,
          msg: '无限重定向',
        });
        localStorage.setItem('preLoginDateStr', '');
        navigate(`/error?message=${encodeURIComponent('您的店铺登录遇到问题，请切换账号再尝试')}`);
      }
    } catch (error) {
      console.error('endlessLoop', error);
    }
  }, [navigate]);
  // 补签协议的 case 增加特殊的scene，只牵涉到登陆和忘记密码
  const { search } = location;
  const query = queryString.parse(search);
  const from = query && query.from;
  const isSupply = from === '/supplementSignContract';
  let loginContinue = `${process.env.FMA_EPASSPORT_SIGN_CONTINUE_URL
    || window.location.origin}/afterlogin?scene=platform${isSupply ? '-contract' : ''}-login&from=${from}`;
  let recContinue = `${process.env.FMA_EPASSPORT_CONTINUE_URL}?scene=platform${isSupply ? '-contract' : ''}-recover`;

  loginContinue = encodeURIComponent(loginContinue);
  recContinue = encodeURIComponent(recContinue);

  let recoverUrl = `${process.env.FMA_EPASSPORT_RECOVER_URL}&continue=${recContinue}`;
  const singupUrl = encodeURIComponent(`${window.location.origin}/register?from=${from}`);
  recoverUrl = encodeURIComponent(recoverUrl);
  const loginUrl = `${process.env.EPASSPORT_LOGIN_URL}&leftBottomLink=${singupUrl}&rightBottomLink=${recoverUrl}&continue=${loginContinue}`;
  // 需要特殊申请一个配置，注册按钮设置为链接方式并且打开新页面

  return (
    <div className="login">
      <div className="login-header">
        <div className="logo-box">
          <img src="https://p0.meituan.net/ingee/8272a28c8bb22fb54e2d4856badb610b5813.png" alt="" className="mt-logo" />
          <img
            src="https://p0.meituan.net/ingee/ad96da3c1a817b82d3016db13d97934b9222.png"
            alt=""
            className="thh-logo"
          />
        </div>
      </div>
      <div className="login-body">
        <div className="login-main">
          <img
            src="https://s3plus.meituan.net/v1/mss_1ada830d56584ddeae1b0899c231c552/source/INGEE_SOURCEFILE/3854455/ingeetemp/1616337183840/assets/%E6%B3%A8%E5%86%8C%E5%BA%95%E5%9B%BE%401.5x.png"
            alt=""
            className="bg"
          />
          <div className="login-window">
            <div className="login-title">登录</div>
            <div className="iframe-container">
              <iframe
                title="美团团好货"
                src={loginUrl}
                // sandbox="allow-forms allow-scripts allow-top-navigation allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="login-footer">
        <p className="copy">©2020 meituan.com 京ICP证070791号 京公网安备11010502025545号</p>
      </div>
    </div>
  )
}

export default Login;