"use strict";(window.webpackJsonp_mtm=window.webpackJsonp_mtm||[]).push([[507],{6638:(b,g,e)=>{e.d(g,{Z:()=>I});var u=e(85893),r=e(80403),B=e(28182);const I=({children:O})=>{const N=[{label:"\u9000\u51FA\u767B\u5F55",key:"1"}],m=({key:K})=>{};return(0,u.jsxs)("div",{className:"layout-entry",children:[(0,u.jsx)("div",{className:"entry-header",children:(0,u.jsxs)("div",{className:"entry-header-box",children:[(0,u.jsxs)("div",{className:"header-logo",children:[(0,u.jsx)("img",{className:"logo",src:B}),(0,u.jsx)("span",{children:"\u5546\u5BB6\u5165\u9A7B\u5E73\u53F0"})]}),(0,u.jsx)("div",{className:"header-item",children:(0,u.jsx)(r.Z,{menu:{items:N,onClick:m},children:(0,u.jsx)("span",{className:"username",children:"sobird"})})})]})}),(0,u.jsx)("div",{className:"entry-body",children:O})]})}},34642:(b,g,e)=>{e.r(g),e.d(g,{default:()=>Bu});var u=e(85893),r=e(67294),B=e(89250),n=e(48093),I=e(39929),O=e(39372),N=e(98616),m=e(95187),K=e(45360),V=e(6638),f=e(17476);const z={get(t){return f.ZP.get("/merchant/entry/enum",{entryTaskId:t})}};var W=e(25275),T=e(55247),Q=e(35137),J=e(55742),S=e(73610),x=e(18230),h=e(4107),D=e(38800),v=e(34041),j=e(99121),Y=e(49101),k=e(84391),q=e(27484),X=e.n(q);const{RangePicker:$}=T.default,H=({value:t=[!1],onChange:s,format:a="YYYY-MM-DD",rangePicker:A,...c})=>{const[o,...i]=t,[l,y]=(0,r.useState)(o),[P,w]=(0,r.useState)(i.map(E=>X()(E))),Z=E=>{const C=E.target.checked;y(C),t[0]=C,s?.([...t])},d=E=>{A||(E=[E]),w(E),E?.forEach((C,U)=>{t[U+1]=a?C?.format(a):C}),s?.(t)};return(0,u.jsxs)(u.Fragment,{children:[A?(0,u.jsx)($,{disabled:l,value:P,format:a,...c,onChange:d}):(0,u.jsx)(T.default,{disabled:l,format:a,...c,onChange:d}),(0,u.jsx)(S.Z,{checked:l,onChange:Z,style:{marginLeft:"10px"},children:"\u957F\u671F\u6709\u6548"})]})};var G=e(3685),_=e(53416);function M(){return f.ZP.get("/venus/sign")}async function uu(t,s){const{token:a,bucket:A}=await M(),c=`${A}${(0,_.x0)()}-${t.name}`,o=new FormData;return o.append("key",c),o.append("file",t),f.ZP.service({method:"post",url:"/venus/upload",headers:{Authorization:a},data:o,onUploadProgress(i){s?.(Math.floor(i.loaded/i.total*100))}}).then(i=>(s(100),i))}const eu={signature:M,upload:uu},su={get(t){return f.ZP.get("/ocr",t)}},nu=(0,u.jsxs)("div",{children:[(0,u.jsx)(Y.Z,{style:{fontSize:"30px"}}),(0,u.jsx)("div",{children:"\u70B9\u51FB\u4E0A\u4F20"})]}),tu=t=>new Promise((s,a)=>{const A=new FileReader;A.readAsDataURL(t),A.onload=()=>s(A.result),A.onerror=c=>a(c)}),au=({value:t,onChange:s,onUploadSuccess:a,type:A=0,children:c,...o})=>{const[i,l]=(0,r.useState)(!1),[y,P]=(0,r.useState)(""),[w,Z]=(0,r.useState)(""),[d,E]=(0,r.useState)([]),C=d.length===0&&t?[{url:t,uid:"-1",status:"done"}]:d,U=({fileList:F})=>{console.log("newFileList",F),E(F)},pu=async F=>{!F.url&&!F.preview&&(F.preview=await tu(F.originFileObj)),P(F.url||F.preview),l(!0),Z(F.name||F.url.substring(F.url.lastIndexOf("/")+1))};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(D.Z,{listType:"picture-card",fileList:C,onChange:U,onPreview:pu,onRemove:F=>{s("")},customRequest:({file:F,onProgress:mu,onSuccess:gu,onError:xu})=>{eu.upload(F,L=>{mu({percent:L})}).then(L=>{gu(L);const{url:R}=L;s(R),su.get({type:A,url:R}).then(Du=>{a?.(Du[A])})}).catch(xu)},...o,children:C?.length>0?null:c||nu}),(0,u.jsx)(G.Z,{open:i,title:w,footer:null,onCancel:()=>l(!1),children:(0,u.jsx)("img",{style:{width:"100%"},src:y})})]})},lu="data:image/png;base64,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",Au="data:image/png;base64,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",ru=e.p+"assets/42b794916ef1bdc228a7.png",iu=e.p+"assets/d524eacdd486c02199ef.png",Fu=e.p+"assets/d9be2f1258aafa17aa6f.png",du=e.p+"assets/f2f8feda15a982033af3.png",cu=({children:t})=>{const[s,a]=(0,r.useState)(!1);return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(m.ZP,{type:"link",style:{fontSize:"12px",padding:0},onClick:()=>a(!0),children:t}),(0,u.jsxs)(G.Z,{title:"\u8EAB\u4EFD\u8BC1\u4EF6\u4E0A\u4F20\u793A\u4F8B",centered:!0,open:s,onOk:()=>a(!1),onCancel:()=>a(!1),width:"auto",okText:"\u6211\u77E5\u9053\u4E86",transitionName:"",maskTransitionName:"",children:[(0,u.jsx)("p",{children:"1. \u8EAB\u4EFD\u8BC1\u4EF6\u6B63\u53CD\u9762\u590D\u5370\u4EF6\uFF0C\u52A0\u76D6\u5F00\u5E97\u516C\u53F8\u5370\u7AE0\uFF1A"}),(0,u.jsxs)(x.Z,{style:{marginBottom:"20px"},children:[(0,u.jsx)(j.Z,{src:ru,width:250,preview:!1}),(0,u.jsx)(j.Z,{src:iu,width:250,preview:!1})]}),(0,u.jsx)("p",{children:"2. \u624B\u6301\u8EAB\u4EFD\u8BC1\u4EF6\u7684\u6B63\u53CD\u9762\u7167\u7247\uFF1A"}),(0,u.jsxs)(x.Z,{style:{marginBottom:"10px"},children:[(0,u.jsx)(j.Z,{src:Fu,width:250,preview:!1}),(0,u.jsx)(j.Z,{src:du,width:250,preview:!1})]}),(0,u.jsxs)("p",{children:[(0,u.jsx)("span",{style:{color:"red"},children:"*"}),"\u6CE8\uFF1A\u8EAB\u4EFD\u4FE1\u606F\u8BF7\u52FF\u6253\u9A6C\u8D5B\u514B\uFF0C\u8BF7\u4FDD\u6301\u6240\u6709\u5B57\u8FF9\u6E05\u6670\u53EF\u89C1"]})]})]})},{RangePicker:ou}=T.default,p={labelCol:{span:5},wrapperCol:{span:12}},Eu=({option:t,form:s})=>{const[a,A]=(0,r.useState)(!1),c=(0,B.s0)(),o=l=>{console.log("values",l)},i=s.getFieldValue(["company","businessLicense","socialCreditCode"]);return(0,u.jsxs)(n.Z,{name:"basic",onFinish:o,labelCol:{span:4},wrapperCol:{span:20},size:"middle",form:s,children:[(0,u.jsxs)(Q.Z,{title:"\u4F01\u4E1A\u4E3B\u4F53\u4FE1\u606F",bordered:!1,children:[(0,u.jsx)(n.Z.Item,{label:"\u6D4B\u8BD5\u7EC4\u4EF6",name:"testName",children:(0,u.jsx)(H,{value:[!0,"2023-01-10","2023-01-11"],rangePicker:!0})}),(0,u.jsx)(n.Z.Item,{label:"\u516C\u53F8\u7C7B\u578B",name:["company","companyType"],rules:[{required:!0,message:"\u516C\u53F8\u7C7B\u578B\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(J.ZP.Group,{options:t?.companyTypeList.map(l=>({value:l.type,label:l.name}))})}),(0,u.jsx)(n.Z.Item,{label:"\u9500\u552E\u6E20\u9053",name:["company","distChannel"],children:(0,u.jsx)(S.Z.Group,{options:t?.distChannelList.map(l=>({value:l.type,label:l.name}))})}),(0,u.jsxs)(n.Z.Item,{label:"\u8425\u4E1A\u6267\u7167",name:"businessLicense",children:[(0,u.jsxs)(x.Z,{children:[(0,u.jsx)(n.Z.Item,{name:["company","businessLicense","url"],rules:[{required:!0,message:"\u8425\u4E1A\u6267\u7167\u4E0D\u80FD\u4E3A\u7A7A"}],noStyle:!0,children:(0,u.jsx)(au,{type:1,onUploadSuccess:l=>{s.setFieldValue(["company","businessLicense","socialCreditCode"],l.number),s.setFieldValue(["company","businessLicense","name"],l.name),s.setFieldValue(["company","businessLicense","address"],l.address),s.setFieldValue(["company","businessLicense","term"],l.term),s.setFieldValue(["company","businessLicense","capital"],l.capital),l.number&&A(!0)}})}),(0,u.jsxs)("div",{className:"form-prompt",children:[(0,u.jsx)("p",{children:"1.\u8BF7\u4E0A\u4F20\u6E05\u6670\u7684\u591A\u8BC1\u5408\u4E00\u8425\u4E1A\u6267\u7167\uFF08\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\uFF09"}),(0,u.jsx)("p",{children:"2.\u6587\u4EF6\u6700\u591A\u4E0A\u4F201\u5F20\uFF0C\u5927\u5C0F\u4E0D\u5F97\u8D85\u8FC720MB"}),(0,u.jsx)("p",{children:"3.\u6587\u4EF6\u683C\u5F0F\u652F\u6301\uFF1AJPG/JPEG/PNG/GIF/BPM"}),(0,u.jsxs)("p",{children:["4.\u4F01\u4E1A\u4E3B\u4F53\u9700\u6EE1\u8DB3\xA0",(0,u.jsx)("a",{className:"name-link",target:"_blank",href:"https://rules-center.meituan.com/rules-detail/602?commonType=2",children:"\u7F8E\u56E2\u7535\u5546\u5E73\u53F0\u5165\u9A7B\u6807\u51C6"}),"\xA0\u8981\u6C42"]})]})]}),(i||a)&&(0,u.jsxs)(Q.Z,{title:"\u8BF7\u6838\u5BF9\u8425\u4E1A\u6267\u7167\u4FE1\u606F\uFF0C\u82E5\u4FE1\u606F\u4E0D\u7B26\uFF0C\u8BF7\u624B\u52A8\u4FEE\u6539",className:"item-card",children:[(0,u.jsx)(n.Z.Item,{...p,label:"\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801",name:["company","businessLicense","socialCreditCode"],rules:[{required:!0,message:"\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u586B\u5199\u8425\u4E1A\u6267\u7167\u4E0A\u7684\u6CE8\u518C\u53F7"})}),(0,u.jsx)(n.Z.Item,{...p,label:"\u516C\u53F8\u540D\u79F0",name:["company","businessLicense","name"],rules:[{required:!0,message:"\u516C\u53F8\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u6309\u7167\u8425\u4E1A\u6267\u7167\uFF0C\u586B\u5199\u516C\u53F8\u540D\u79F0"})}),(0,u.jsx)(n.Z.Item,{...p,label:"\u7ECF\u8425\u5730\u5740",name:["company","businessLicense","address"],rules:[{required:!0,message:"\u7ECF\u8425\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u6309\u7167\u8425\u4E1A\u6267\u7167\uFF0C\u586B\u5199\u516C\u53F8\u5730\u5740"})}),(0,u.jsx)(n.Z.Item,{...p,name:["company","businessLicense","term"],label:"\u8425\u4E1A\u671F\u9650",wrapperCol:{span:16},rules:[{required:!0,message:"\u8425\u4E1A\u671F\u9650\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(H,{rangePicker:!0})}),(0,u.jsxs)(n.Z.Item,{...p,label:"\u6CE8\u518C\u8D44\u91D1",children:[(0,u.jsx)(n.Z.Item,{name:["company","businessLicense","capital"],noStyle:!0,rules:[{required:!0,message:"\u6CE8\u518C\u8D44\u91D1\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u8F93\u5165",suffix:"\u4E07\u5143"})}),(0,u.jsx)("span",{className:"input-help",children:"\u82E5\u6CE8\u518C\u8D44\u91D1\u5E01\u79CD\u4E0D\u662F\u4EBA\u6C11\u5E01\uFF0C\u53EF\u6309\u7167\u5F53\u524D\u6C47\u7387\u6362\u7B97\u6210\u4EBA\u6C11\u5E01\u540E\u8FDB\u884C\u586B\u5199"})]})]})]}),(0,u.jsx)(n.Z.Item,{label:"\u4E00\u822C\u7EB3\u7A0E\u4EBA\u8D44\u683C\u8BC1\u7535\u5B50\u7248",name:["company","certificateTaxpayer"],children:(0,u.jsxs)(x.Z,{children:[(0,u.jsx)(D.Z,{action:"/upload.do",listType:"picture-card",children:(0,u.jsxs)("div",{children:[(0,u.jsx)(Y.Z,{style:{fontSize:"30px"}}),(0,u.jsx)("div",{children:"\u70B9\u51FB\u4E0A\u4F20"})]})}),(0,u.jsxs)("div",{className:"form-prompt",children:[(0,u.jsx)("p",{children:"1.\u8BF7\u4E0A\u4F20\u6E05\u6670\u7684\u4E00\u822C\u7EB3\u7A0E\u4EBA\u8D44\u683C\u8BC1\uFF0C\u590D\u5370\u4EF6\u9700\u52A0\u76D6\u516C\u53F8\u5370\u7AE0"}),(0,u.jsx)("p",{children:"2.\u6587\u4EF6\u6700\u591A\u4E0A\u4F201\u5F20\uFF0C\u5927\u5C0F\u4E0D\u5F97\u8D85\u8FC720MB"}),(0,u.jsx)("p",{children:"3.\u6587\u4EF6\u683C\u5F0F\u652F\u6301\uFF1AJPG/JPEG/PNG/GIF/BPM"})]})]})}),(0,u.jsx)(n.Z.Item,{label:"\u94F6\u884C\u5F00\u6237\u8BC1\u660E",name:["company","certificateBankOpen"],rules:[{required:!0,message:"\u94F6\u884C\u5F00\u6237\u8BC1\u660E\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsxs)(x.Z,{children:[(0,u.jsx)(D.Z,{action:"/upload.do",listType:"picture-card",children:(0,u.jsxs)("div",{children:[(0,u.jsx)(Y.Z,{style:{fontSize:"30px"}}),(0,u.jsx)("div",{children:"\u70B9\u51FB\u4E0A\u4F20"})]})}),(0,u.jsxs)("div",{className:"form-prompt",children:[(0,u.jsx)("p",{children:"1.\u8BF7\u4E0A\u4F20\u6E05\u6670\u7684\u8BC1\u7167\uFF0C\u5982\u679C\u662F\u590D\u5370\u4EF6\u9700\u52A0\u76D6\u516C\u53F8\u5370\u7AE0"}),(0,u.jsx)("p",{children:"2.\u6587\u4EF6\u6700\u591A\u4E0A\u4F201\u5F20\uFF0C\u5927\u5C0F\u4E0D\u5F97\u8D85\u8FC720MB"}),(0,u.jsx)("p",{children:"3.\u6587\u4EF6\u683C\u5F0F\u652F\u6301\uFF1AJPG/JPEG/PNG/GIF/BPM"}),(0,u.jsx)("p",{children:"4.\u4E0A\u4F20\u94F6\u884C\u5F00\u6237\u8BB8\u53EF\u8BC1\u6216\u57FA\u672C\u5B58\u6B3E\u8D26\u6237\u4FE1\u606F\u626B\u63CF\u4EF6"})]})]})}),(0,u.jsx)(n.Z.Item,{label:"\u529E\u516C\u5730\u5740",name:["company","officeAddress"],wrapperCol:{span:12},rules:[{required:!0,message:"\u529E\u516C\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u586B\u5199\u771F\u5B9E\u7684\u529E\u516C\u5730\u5740"})}),(0,u.jsxs)(n.Z.Item,{label:"\u516C\u53F8\u7B80\u4ECB",wrapperCol:{span:12},children:[(0,u.jsx)(n.Z.Item,{name:["company","companyDesc"],noStyle:!0,rules:[{required:!0,message:"\u516C\u53F8\u7B80\u4ECB\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z.TextArea,{showCount:!0,maxLength:1e3,autoSize:{minRows:5},placeholder:"\u53EF\u4EE5\u4ECE\u54C1\u724C\u5B9A\u4F4D\u3001\u54C1\u724C\u4EA7\u54C1\u7EBF\u3001\u5E02\u573A\u5360\u6709\u7387\u6216\u5E74\u9500\u91CF\u3001\u54C1\u724C\u5F53\u4E0B\u5E03\u5C40\u3001\u54C1\u724C\u672A\u6765\u89C4\u5212\u7B49\u65B9\u9762\u4ECB\u7ECD\uFF0C\u6700\u591A\u4E0D\u5F97\u8D85\u8FC71000\u5B57"})}),(0,u.jsx)(n.Z.Item,{name:["company","companyFile"],noStyle:!0,children:(0,u.jsx)(D.Z,{action:"/upload.do",children:(0,u.jsx)(m.ZP,{type:"dashed",style:{marginTop:"20px",marginBottom:"10px"},icon:(0,u.jsx)(k.Z,{}),children:" \u4E0A\u4F20\u6587\u4EF6"})})}),(0,u.jsxs)("div",{className:"form-prompt",children:[(0,u.jsx)("p",{children:"1.\u652F\u6301\u4E0A\u4F20\u76F8\u5173\u516C\u53F8\u4ECB\u7ECD\u7B49\u76F8\u5173\u8D44\u6599\u9644\u4EF6"}),(0,u.jsx)("p",{children:"2.\u6587\u4EF6\u6700\u591A\u4E0A\u4F2010\u4E2A\uFF0C\u5355\u4E2A\u6587\u4EF6\u5927\u5C0F\u4E0D\u5F97\u8D85\u8FC750MB"}),(0,u.jsx)("p",{children:"3.\u6587\u4EF6\u683C\u5F0F\u652F\u6301\uFF1APDF/PPT/DOC/JPG/JPEG/PNG/GIF/BPM"})]})]})]}),(0,u.jsxs)(Q.Z,{title:"\u6CD5\u4EBA\u8BC1\u4EF6\u4FE1\u606F",bordered:!1,children:[(0,u.jsx)(n.Z.Item,{label:"\u8BC1\u4EF6\u7C7B\u578B",name:["company","legalPerson","idType"],wrapperCol:{span:12},rules:[{required:!0,message:"\u6CD5\u4EBA\u624B\u673A\u53F7\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsxs)(v.default,{defaultValue:1001,children:[(0,u.jsx)(v.default.Option,{value:1001,children:"\u4E2D\u56FD\u5927\u9646\u5C45\u6C11\u8EAB\u4EFD\u8BC1"}),(0,u.jsx)(v.default.Option,{value:1002,children:"\u6D77\u5916\u62A4\u7167"}),(0,u.jsx)(v.default.Option,{value:1003,children:"\u6E2F\u6FB3\u5C45\u6C11\u5F80\u6765\u5185\u5730\u901A\u884C\u8BC1"}),(0,u.jsx)(v.default.Option,{value:1003,children:"\u53F0\u6E7E\u5C45\u6C11\u5F80\u6765\u5927\u9646\u901A\u884C\u8BC1"})]})}),(0,u.jsxs)(n.Z.Item,{label:"\u7535\u5B50\u8BC1\u4EF6\u7167",name:"businessLicense",rules:[{required:!0,message:"\u8425\u4E1A\u6267\u7167\u4E0D\u80FD\u4E3A\u7A7A"}],children:[(0,u.jsxs)(x.Z,{style:{marginBottom:"10px"},children:[(0,u.jsx)(D.Z,{action:"/upload.do",children:(0,u.jsx)(j.Z,{preview:!1,src:lu,width:120,style:{cursor:"pointer"}})}),(0,u.jsx)(D.Z,{action:"/upload.do",children:(0,u.jsx)(j.Z,{preview:!1,src:Au,width:120,style:{cursor:"pointer"}})})]}),(0,u.jsxs)("div",{className:"input-help",children:["\u8BF7\u4E0A\u4F20\u624B\u6301\u8BC1\u4EF6\u6B63\u53CD\u9762\u7167\uFF0C\u6216\u8EAB\u4EFD\u8BC1\u4EF6\u7684\u6B63\u53CD\u9762\u5F69\u8272\u626B\u63CF\u7167\u7247\uFF0C\u6216\u6B63\u53CD\u9762\u590D\u5370\u4EF6\u52A0\u76D6\u5165\u9A7B\u4E3B\u4F53\u9C9C\u7AE0\uFF0C",(0,u.jsx)(cu,{children:"\u67E5\u770B\u793A\u4F8B"})]}),(0,u.jsxs)(Q.Z,{title:"\u8BF7\u6838\u5BF9\u8EAB\u4EFD\u4FE1\u606F\uFF0C\u82E5\u4FE1\u606F\u4E0D\u7B26\u5408\uFF0C\u53EF\u624B\u52A8\u4FEE\u6539",className:"item-card",children:[(0,u.jsx)(n.Z.Item,{...p,label:"\u59D3\u540D",name:["company","legalPerson","name"],rules:[{required:!0,message:"\u6CD5\u4EBA\u59D3\u540D\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u4FDD\u6301\u4E0E\u8EAB\u4EFD\u8BC1\u4EF6\u4E0A\u7684\u59D3\u540D\u4E00\u81F4"})}),(0,u.jsx)(n.Z.Item,{...p,label:"\u8BC1\u4EF6\u53F7\u7801",name:["company","legalPerson","idNum"],rules:[{required:!0,message:"\u8BC1\u4EF6\u53F7\u7801\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u4FDD\u6301\u4E0E\u8EAB\u4EFD\u8BC1\u4EF6\u4E0A\u7684\u8BC1\u4EF6\u53F7\u4E00\u81F4"})}),(0,u.jsx)(n.Z.Item,{...p,label:"\u6709\u6548\u622A\u6B62\u65E5",name:"cardValidateType",rules:[{required:!0,message:"\u7ECF\u8425\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(ou,{})})]})]}),(0,u.jsx)(n.Z.Item,{label:"\u6CD5\u4EBA\u624B\u673A\u53F7",name:["company","legalPerson","mobile"],wrapperCol:{span:12},rules:[{required:!0,message:"\u6CD5\u4EBA\u624B\u673A\u53F7\u4E0D\u80FD\u4E3A\u7A7A"}],children:(0,u.jsx)(h.Z,{placeholder:"\u8BF7\u586B\u5199\u771F\u5B9E\u7684\u529E\u516C\u5730\u5740",showCount:!0,maxLength:11})})]})]})},Cu=()=>(0,u.jsx)(I.ZP,{status:"warning",title:"\u6682\u65E0\u5185\u5BB9"});function hu(){const t=(0,B.s0)(),[s]=n.Z.useForm(),[a,A]=(0,r.useState)(0),[c,o]=(0,r.useState)(),i=[{title:"\u586B\u5199\u4E3B\u4F53\u4FE1\u606F",content:(0,u.jsx)(Eu,{option:c,form:s})},{title:"\u586B\u5199\u516C\u53F8\u6982\u51B5",content:(0,u.jsx)(Cu,{})},{title:"\u586B\u5199\u8D44\u8D28\u4FE1\u606F",content:(0,u.jsx)(I.ZP,{status:"warning",title:"\u586B\u5199\u8D44\u8D28\u4FE1\u606F"})},{title:"\u586B\u5199\u5E97\u94FA\u4FE1\u606F",content:(0,u.jsx)(I.ZP,{status:"warning",title:"\u586B\u5199\u5E97\u94FA\u4FE1\u606F"})}];(0,r.useEffect)(()=>{z.get().then(d=>{console.log("res",d),o(d)}),W.Z.get().then(({company:d})=>{s.setFieldValue("company",d)})},[]);const{token:l}=O.Z.useToken(),y=()=>{A(a+1),s.submit()},P=()=>{if(a===0){t("/settleinjx/shop");return}console.log("current",a),A(a-1)},w=i.map(d=>({key:d.title,title:d.title})),Z={borderTop:`1px dashed ${l.colorBorder}`,padding:"10px 20px"};return(0,u.jsx)(V.Z,{children:(0,u.jsxs)("div",{className:"entry-company",children:[(0,u.jsx)(N.Z,{size:"small",className:"company-steps",current:a,items:w}),(0,u.jsx)("div",{style:Z,children:i[a].content}),(0,u.jsxs)("div",{className:"entry-footer",children:[(0,u.jsx)(m.ZP,{style:{margin:"0 20px"},onClick:()=>P(),children:"\u4E0A\u4E00\u6B65"}),a<i.length-1&&(0,u.jsx)(m.ZP,{type:"primary",onClick:()=>y(),children:"\u4E0B\u4E00\u6B65"}),a===i.length-1&&(0,u.jsx)(m.ZP,{type:"primary",onClick:()=>K.ZP.success("Processing complete!"),children:"\u5B8C\u6210"})]})]})})}const Bu=hu},25275:(b,g,e)=>{e.d(g,{Z:()=>r});var u=e(17476);const r={get(B){return u.ZP.get("/merchant/entry",{entryTaskId:B})},patch(B){return u.ZP.patch("/merchant/entry",B)}}}}]);
