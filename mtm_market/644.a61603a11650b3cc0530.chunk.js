"use strict";(window.webpackJsonp_mtm_market=window.webpackJsonp_mtm_market||[]).push([[644],{24644:(c,F,n)=>{n.r(F),n.d(F,{default:()=>_});var e=n(85893),l=n(67294),r=n(78256),s=n(36214),i=n(95187),E=n(57564),d=n(52655);const{Column:t,ColumnGroup:u}=r.default,_=()=>{const[D,B]=(0,l.useState)();return(0,l.useEffect)(()=>{d.ZP.list().then(a=>{B(a)})},[]),(0,e.jsx)("div",{className:"page-coupons",children:(0,e.jsxs)(r.default,{dataSource:D?.list,rowKey:"id",pagination:{total:D?.total,current:2,pageSize:10},children:[(0,e.jsx)(t,{title:"\u4F18\u60E0\u5238\u7F16\u7801",dataIndex:"id"}),(0,e.jsx)(t,{title:"\u4F18\u60E0\u5238\u540D\u79F0",dataIndex:"name"}),(0,e.jsx)(t,{title:"\u4F18\u60E0\u7C7B\u578B",dataIndex:"type",render:a=>d.rg[a]}),(0,e.jsx)(t,{title:"\u5238\u7C7B\u578B",dataIndex:"target",render:a=>d.z2[a]}),(0,e.jsx)(t,{title:"\u53D1\u653E\u65F6\u95F4",dataIndex:"stime"}),(0,e.jsx)(t,{title:"\u4F7F\u7528\u65F6\u95F4",dataIndex:"validDays"}),(0,e.jsx)(t,{title:"\u53D1\u653E\u6570\u91CF",dataIndex:"sendCount"}),(0,e.jsx)(t,{title:"\u5F53\u524D\u4F59\u91CF",dataIndex:"leftCount"}),(0,e.jsx)(t,{title:"\u521B\u5EFA\u65F6\u95F4",dataIndex:"ctime"}),(0,e.jsx)(t,{title:"\u72B6\u6001",dataIndex:"status",render:a=>(0,e.jsx)(s.Z,{color:d.QO[a],children:d.ui[a]})}),(0,e.jsx)(t,{title:"\u64CD\u4F5C",dataIndex:"status",render:(a,P)=>(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)(i.ZP,{type:"link",size:"small",children:"\u67E5\u770B"}),a<2&&(0,e.jsx)(i.ZP,{type:"link",size:"small",children:"\u7F16\u8F91"}),a<2&&(0,e.jsx)(E.Z,{title:"\u60A8\u786E\u5B9A\u8981\u4E0B\u7EBF\u8BE5\u4F18\u60E0\u5238\u5417\uFF1F",onConfirm:()=>{d.ZP.delete(P.id)},okText:"\u786E\u5B9A",cancelText:"\u53D6\u6D88",children:(0,e.jsx)(i.ZP,{type:"link",size:"small",children:"\u4E0B\u7EBF"})})]})})]})})}},52655:(c,F,n)=>{n.d(F,{QO:()=>E,ZP:()=>t,rg:()=>l,ui:()=>s,z2:()=>r});var e=n(82123),l=(u=>(u[u.\u6EE1\u51CF\u5238=0]="\u6EE1\u51CF\u5238",u[u.\u6298\u6263\u5238=1]="\u6298\u6263\u5238",u))(l||{}),r=(u=>(u[u.\u5E97\u94FA\u901A\u7528\u5238=11]="\u5E97\u94FA\u901A\u7528\u5238",u[u.\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238=12]="\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238",u))(r||{}),s=(u=>(u[u.\u5168\u90E8=-1]="\u5168\u90E8",u[u.\u672A\u5F00\u59CB=0]="\u672A\u5F00\u59CB",u[u.\u8FDB\u884C\u4E2D=1]="\u8FDB\u884C\u4E2D",u[u.\u5DF2\u7ED3\u675F=2]="\u5DF2\u7ED3\u675F",u[u.\u5DF2\u4E0B\u7EBF=6]="\u5DF2\u4E0B\u7EBF",u))(s||{});const i=[{value:-1,label:"\u5168\u90E8"},{value:0,label:"\u672A\u5F00\u59CB"},{value:1,label:"\u8FDB\u884C\u4E2D"},{value:2,label:"\u5DF2\u7ED3\u675F"},{value:6,label:"\u5DF2\u4E0B\u7EBF"}];var E=(u=>(u[u.gray=0]="gray",u[u.green=1]="green",u[u.blue=2]="blue",u[u.red=6]="red",u))(E||{});const t={list(u){return e.ZP.get("/merchant/coupons",u)},detail(u){return e.ZP.get("/merchant/coupons",{id:u})},delete(u){return e.ZP.delete("/merchant/coupons",{id:u})},create(u){return e.ZP.post("/merchant/coupons",u)},update(u){return e.ZP.patch("/merchant/coupons",u)}}}}]);

//# sourceMappingURL=/644.a61603a11650b3cc0530.chunk.js.map