"use strict";(window.webpackJsonp_mtm_market=window.webpackJsonp_mtm_market||[]).push([[736],{42736:(X,V,l)=>{l.r(V),l.d(V,{default:()=>nu});var e=l(85893),P=l(71504),R=l(5966),y=l(70271),Y=l(78844),p=l(31199),$=l(19527);const b=(n,a)=>({fieldProps:d,proFieldProps:D,...i})=>(console.log(a,d,D,i),(0,e.jsx)($.Z,{valueType:a,render:(E,o)=>{const{mode:c}=o;return(0,e.jsx)(n,{text:E,mode:c,fieldProps:o})},renderFormItem:(E,o)=>{const{mode:c}=o;return(0,e.jsx)(n,{text:E,mode:c,fieldProps:o})},fieldProps:d,proFieldProps:D,...i}));var u=l(599),H=l.n(u),C=l(1127),z=l(64631),M=l(22382),S=l(60869);const k=({text:n,mode:a,render:t,placeholder:d,renderFormItem:D,fieldProps:i},E)=>{var o,c,U,g;const{value:w,defaultValue:B,onChange:f,id:Z,validator:v=[]}=i,[h,T]=(0,u.useState)([]),[F,r]=(0,S.Z)(()=>B,{value:w,onChange:f});if(a==="read"){const j=(0,e.jsxs)("span",{ref:E,children:["\u6EE1",n[0],"\u51CF",n[1]]});return t?t(n,{mode:a,...i},j):j}if(a==="edit"||a==="update"){const j=()=>{if(Array.isArray(F)){const[s,A]=F;typeof s=="number"&&typeof A=="number"&&s>A?r([A,s]):s===void 0&&A===void 0&&r(void 0)}},m=(s,A)=>{var Q;const W=[...F||[]];W[s]=A===null?void 0:A,r(W),h[s]={...(Q=v[s])==null?void 0:Q.call(v,W)},T(h)},x=i?.placeholder||d||["\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB","\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D"],I=s=>Array.isArray(x)?x[s]:x,{className:ru,...J}=i,K=(0,e.jsxs)(C.Z,{size:10,className:ru,children:[(0,e.jsx)(z.Z.Item,{label:"\u6EE1",htmlFor:`${Z}-0`,validateStatus:(o=h[0])==null?void 0:o.status,help:(c=h[0])==null?void 0:c.help,children:(0,e.jsx)(M.Z,{style:{width:"100%"},prefix:"\uFFE5",min:0,max:5e3,...J,placeholder:I(0),id:`${Z}-0`,value:F?.[0],defaultValue:B?.[0],onChange:s=>m(0,s)})}),(0,e.jsx)(z.Z.Item,{label:"\u51CF",htmlFor:`${Z}-1`,validateStatus:(U=h[1])==null?void 0:U.status,help:(g=h[1])==null?void 0:g.help,children:(0,e.jsx)(M.Z,{prefix:"\uFFE5",style:{width:"100%"},min:0,max:5e3,...J,placeholder:I(1),id:`${Z}-1`,value:F?.[1],defaultValue:B?.[1],onChange:s=>m(1,s)})})]});return D?D(n,{mode:a,...i},K):K}return null},su=async(n,a)=>{const[t,d]=a;if(!t&&t!==0)throw new Error("\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB");if(!d&&d!==0)throw new Error("\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D")},q=[n=>{const[a,t]=n;if(!a&&a!==0)return{status:"error",help:"\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB"}},n=>{const[a,t]=n;if(!t&&t!==0)return{status:"error",help:"\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D"};if(t<.01)return{status:"error",help:"\u9762\u989D\u6700\u5C0F\u503C\u662F0.01\u5143"};if(a===0){if(t>500)return{status:"error",help:"\u95E8\u69DB\u4E3A0\u65F6\uFF0C\u9762\u989D\u9700\u5C0F\u4E8E\u7B49\u4E8E500\u5143"};t>10}}],_=H().forwardRef(k),L=b(_,"AmountRule");var uu=l(57554),O=l(55742),eu=l(27484),lu=l.n(eu);const{RangePicker:au}=uu.default,N=b(({text:n,mode:a,fieldProps:t,render:d,renderFormItem:D})=>{const{value:i=[],onChange:E,defaultValue:o}=t,c=[...i],[U,g]=c;g&&(c[1]=g?.map(v=>lu()(v)));const[w,B]=(0,u.useState)(i[1]?2:1),[f,Z]=(0,u.useState)(c);if(a==="read"){const v=(0,e.jsx)("span",{children:g?g.join(" - "):U});return d?d(n,{mode:a,...t},v):v}if(a==="edit"||a==="update"){const v=r=>{B(r.target.value),h(r.target.value,f)},h=(r,j)=>{const m=[...j||[]],[,x]=m;x&&(m[1]=x?.map(I=>I.format("YYYY-MM-DD"))),r===1?m[1]=void 0:m[0]=void 0,E?.(m)},T=(r,j)=>{const m=[...f||[]];m[r]=j===null?void 0:j,Z(m),h(w,m)},F=(0,e.jsx)(O.ZP.Group,{value:w,onChange:v,children:(0,e.jsxs)(C.Z,{direction:"vertical",children:[(0,e.jsx)(O.ZP,{value:1,children:(0,e.jsxs)(C.Z,{children:[(0,e.jsx)("span",{children:"\u9886\u53D6\u540E"}),(0,e.jsx)(M.Z,{addonAfter:"\u5929",min:1,max:30,value:f?.[0],defaultValue:o?.[0],onChange:r=>T(0,r)})]})}),(0,e.jsx)(O.ZP,{value:2,children:(0,e.jsxs)(C.Z,{children:[(0,e.jsx)("span",{children:"\u81EA\u5B9A\u4E49"}),(0,e.jsx)(au,{value:f?.[1],defaultValue:o?.[1],onChange:r=>T(1,r)})]})})]})});return D?D(n,{mode:a,...t},F):F}},"UseTerm");var G=l(52655);const tu={labelCol:{span:4},wrapperCol:{span:14}},nu=()=>{const[n]=P.A.useForm(),a=(t,d)=>{n.validateFields(),console.log("values",t,d)};return(0,e.jsx)("div",{className:"page-coupon-detail",children:(0,e.jsxs)(P.A,{layout:"horizontal",...tu,form:n,request:()=>G.ZP.detail(123),onFinish:a,children:[(0,e.jsx)(R.Z,{readonly:!0,getValueProps:t=>({value:G.rg[t]}),width:"md",name:"type",label:"\u4F18\u60E0\u5238\u7C7B\u578B"}),(0,e.jsx)(R.Z,{width:"lg",name:"name",label:"\u4F18\u60E0\u5238\u540D\u79F0",placeholder:"\u8BF7\u586B\u5199\u4F18\u60E0\u5238\u540D\u79F0",rules:[{required:!0,message:"\u8BF7\u586B\u5199\u4F18\u60E0\u5238\u540D\u79F0"},{max:10,message:"\u4F18\u60E0\u5238\u540D\u79F0\u6700\u591A\u586B\u519910\u4E2A\u5B57"}]}),(0,e.jsx)(L,{placeholder:"test",readonly:!0,name:"test",label:"123456"}),(0,e.jsx)(L,{fieldProps:{validator:q},placeholder:"12",name:"test",label:"InputAmountRule",width:"lg"}),(0,e.jsx)(N,{readonly:!0,name:"useTerm",fieldProps:{b:"b"},label:"\u53EA\u8BFB\u6A21\u5F0F",width:"lg"}),(0,e.jsx)(N,{name:"useTerm",fieldProps:{b:"b"},label:"ProFormUseTerm",width:"lg"}),(0,e.jsx)(y.Z,{separatorWidth:40,name:"name2",label:"ProFormDigitRange",width:"lg",required:!0}),(0,e.jsx)(Y.Z,{required:!0,width:"lg",name:"dateRange",label:"\u53D1\u653E\u65F6\u95F4"}),(0,e.jsx)(p.Z,{label:"\u53D1\u653E\u5F20\u6570",name:"putCount",width:"lg",min:1,max:1e6})]})})}},52655:(X,V,l)=>{l.d(V,{QO:()=>p,ZP:()=>b,rg:()=>P,ui:()=>y,z2:()=>R});var e=l(37123),P=(u=>(u[u.\u6EE1\u51CF\u5238=0]="\u6EE1\u51CF\u5238",u[u.\u6298\u6263\u5238=1]="\u6298\u6263\u5238",u))(P||{}),R=(u=>(u[u.\u5E97\u94FA\u901A\u7528\u5238=11]="\u5E97\u94FA\u901A\u7528\u5238",u[u.\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238=12]="\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238",u))(R||{}),y=(u=>(u[u.\u5168\u90E8=-1]="\u5168\u90E8",u[u.\u672A\u5F00\u59CB=0]="\u672A\u5F00\u59CB",u[u.\u8FDB\u884C\u4E2D=1]="\u8FDB\u884C\u4E2D",u[u.\u5DF2\u7ED3\u675F=2]="\u5DF2\u7ED3\u675F",u[u.\u5DF2\u4E0B\u7EBF=6]="\u5DF2\u4E0B\u7EBF",u))(y||{});const Y=[{value:-1,label:"\u5168\u90E8"},{value:0,label:"\u672A\u5F00\u59CB"},{value:1,label:"\u8FDB\u884C\u4E2D"},{value:2,label:"\u5DF2\u7ED3\u675F"},{value:6,label:"\u5DF2\u4E0B\u7EBF"}];var p=(u=>(u[u.gray=0]="gray",u[u.green=1]="green",u[u.blue=2]="blue",u[u.red=6]="red",u))(p||{});const b={list(u){return e.ZP.get("/merchant/coupons",u)},detail(u){return e.ZP.get("/merchant/coupons",{id:u})},delete(u){return e.ZP.delete("/merchant/coupons",{id:u})},create(u){return e.ZP.post("/merchant/coupons",u)},update(u){return e.ZP.patch("/merchant/coupons",u)}}}}]);

//# sourceMappingURL=/736.273625604f25883f1c52.chunk.js.map