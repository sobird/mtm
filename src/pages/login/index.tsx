/**
 * 用户登录页面
 *
 * sobird<i@sobird.me> at 2023/06/12 8:24:06 created.
 */
import React, { useEffect } from 'react';
import { useNavigate, RouterProviderProps, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import './index.scss';
import mtmLogo from '@/assets/mtm_logo.png';
import mtmLoginBg from '@/assets/mtm_login_bg.png';
import policeIcon from '@/assets/police_icon.png';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  console.log('location', location);
  useEffect(() => {
    try {
      // 短时间多次登录处理逻辑
      const preLoginDateStr = localStorage.getItem('preLoginDateStr') || '';
      const preLoginDateArr = preLoginDateStr.split(',');
      // 最近10秒连续登陆3次，最近1分钟连续登陆5次，跳转到error，并进行上报
      if (
        (preLoginDateArr.length >= 3 && +preLoginDateArr[0] - +preLoginDateArr[2] < 10000) ||
        (preLoginDateArr.length >= 5 && +preLoginDateArr[0] - +preLoginDateArr[4] < 60000)
      ) {
        //
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
  const from = query?.from;
  const isSupply = from === '/supplementSignContract';
  let loginContinue = `${
    process.env.EPASSPORT_SIGN_CONTINUE_URL || window.location.origin
  }/afterlogin?scene=platform${isSupply ? '-contract' : ''}-login&from=${from}`;
  let recContinue = `${process.env.EPASSPORT_CONTINUE_URL}?scene=platform${isSupply ? '-contract' : ''}-recover`;

  loginContinue = encodeURIComponent(loginContinue);
  recContinue = encodeURIComponent(recContinue);

  let recoverUrl = `${process.env.EPASSPORT_RECOVER_URL}&continue=${recContinue}`;
  const singupUrl = encodeURIComponent(`${window.location.origin}/register?from=${from}`);
  recoverUrl = encodeURIComponent(recoverUrl);
  const loginUrl = `${process.env.EPASSPORT_LOGIN_URL}&leftBottomLink=${singupUrl}&rightBottomLink=${recoverUrl}&continue=${loginContinue}`;
  // 需要特殊申请一个配置，注册按钮设置为链接方式并且打开新页面

  return (
    <div className='login'>
      <div className='login-header'>
        <div className='logo-box'>
          <img src={mtmLogo} />
        </div>
      </div>
      <div className='login-body'>
        <div className='login-main'>
          <img src={mtmLoginBg} className='bg' />
          <div className='login-window'>
            <div className='login-title'>登录</div>
            <div className='iframe-container'>
              <iframe
                title='美团电商'
                src={loginUrl}
                // sandbox="allow-forms allow-scripts allow-top-navigation allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>
      <div className='login-footer'>
        <div className='contact-reword'>
          <a target='_blank' href='https://beian.miit.gov.cn' rel='noreferrer' style={{ marginTop: '3px' }}>
            <span>©2020 meituan.com 京ICP备10211739号</span>
          </a>
          <div />
          <img src={policeIcon} style={{ marginRight: '3px' }} />
          <a
            target='_blank'
            href='http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11000002002052'
            rel='noreferrer'
          >
            <span>京公网安备11000002002052号</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
