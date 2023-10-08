"use strict";(window.webpackJsonp_mtm_market=window.webpackJsonp_mtm_market||[]).push([[741],{3343:(I,A,e)=>{e.d(A,{Z:()=>t});var u=e(5893),s=e(599),_=e.n(s),a=e(4047),T=e.n(a),P=e(7484),O=e.n(P);const{RangePicker:g}=a.DatePicker,t=({text:C,mode:l,fieldProps:x,render:j,renderFormItem:E})=>{const{value:D=[],onChange:v,defaultValue:h}=x,p=[...D],[W,L]=p;L&&(p[1]=L?.map(r=>O()(r)));const[V,N]=(0,s.useState)(D[1]?2:1),[n,o]=(0,s.useState)(p);if(l==="read"){const r=(0,u.jsx)("span",{children:L?p[1].map(c=>c.format()).join(" \u5230 "):`\u9886\u53D6\u540E ${W||"-"} \u5929`});return j?j(C,{mode:l,...x},r):r}if(l==="edit"||l==="update"){const r=m=>{N(m.target.value),c(m.target.value,n)},c=(m,B)=>{const i=[...B||[]],[,M]=i;M&&(i[1]=M?.map(K=>K.format("YYYY-MM-DD"))),m===1?i[1]=void 0:i[0]=void 0,v?.(i)},d=(m,B)=>{const i=[...n||[]];i[m]=B===null?void 0:B,o(i),c(V,i)},f=(0,u.jsx)(a.Radio.Group,{value:V,onChange:r,children:(0,u.jsxs)(a.Space,{direction:"vertical",children:[(0,u.jsx)(a.Radio,{value:1,children:(0,u.jsxs)(a.Space,{children:[(0,u.jsx)("span",{children:"\u9886\u53D6\u540E"}),(0,u.jsx)(a.InputNumber,{addonAfter:"\u5929",min:1,max:30,value:n?.[0],defaultValue:h?.[0],onChange:m=>d(0,m)})]})}),(0,u.jsx)(a.Radio,{value:2,children:(0,u.jsxs)(a.Space,{children:[(0,u.jsx)("span",{children:"\u81EA\u5B9A\u4E49"}),(0,u.jsx)(g,{value:n?.[1],defaultValue:h?.[1],onChange:m=>d(1,m)})]})})]})});return E?E(C,{mode:l,...x},f):f}}},1849:(I,A,e)=>{e.d(A,{Z:()=>C});var u=e(5893),s=e(2975),_=e.n(s),a=e(4047),T=e.n(a),P=e(2979),O=e.n(P);const g=(0,s.createHashRouter)([{}]);function R(l,x,j,E){var D;let v=l.path;const h=j.indexOf(l)===j.length-1;return h?(0,u.jsx)("span",{children:l.title}):l.href?(0,u.jsx)("a",{href:g.createHref({pathname:l.href}),onClick:p=>{p.preventDefault(),g.navigate(l.href)},children:l.title}):(((D=l.path)==null?void 0:D.indexOf("/"))!==0&&(v="/"+E.filter(p=>p).join("/")),console.log("paths",JSON.stringify(E),v),h?(0,u.jsx)("span",{children:l.title}):(0,u.jsx)(s.Link,{to:v,relative:"route",children:l.title}))}const C=({children:l,breadcrumb:x,title:j,icon:E,description:D,extra:v,...h})=>(0,u.jsxs)("div",{className:"micro-page-container",...h,children:[(0,u.jsxs)("div",{className:"micro-page-header",children:[(0,u.jsx)(a.Breadcrumb,{className:"micro-breadcrumb",separator:(0,u.jsx)(P.RightOutlined,{}),itemRender:R,...x}),(0,u.jsxs)(a.Row,{className:"micro-page-header-heading",align:"middle",children:[(0,u.jsx)(a.Col,{flex:1,children:(0,u.jsxs)("h2",{children:[typeof E=="string"?(0,u.jsx)("i",{className:`iconfont icon-${E}`}):E,j]})}),(0,u.jsx)(a.Col,{children:(0,u.jsx)(a.Space,{children:v})})]}),D&&(0,u.jsx)("div",{className:"micro-page-header-description",children:D})]}),(0,u.jsx)("div",{className:"micor-page-content",children:l})]})},6785:(I,A,e)=>{e.d(A,{Z:()=>N});var u=e(5893),s=e(4047),_=e(9018),a=e(6502);const T=(n,o)=>({fieldProps:c,proFieldProps:d,...f})=>(0,u.jsx)(a.Z,{valueType:o,render:(m,B,i)=>{const{mode:M}=B;return(0,u.jsx)(n,{text:m,mode:M,fieldProps:B})},renderFormItem:(m,B,i)=>{const{mode:M}=B;return(0,u.jsx)(n,{text:m,mode:M,fieldProps:B})},fieldProps:c,proFieldProps:d,...f});var P=e(599),O=e.n(P),g=e(869),R=e(2077),t=e.n(R);const C={delimiters:{thousands:",",decimal:"."},abbreviations:{thousand:"\u5343",million:"\u767E\u4E07",billion:"\u5341\u4EBF",trillion:"\u5146"},ordinal(){return"."},currency:{symbol:"\xA5"}};t().register("locale","zh",C),t().locale("zh"),t().nullFormat(""),t().fn.round=function(n=2){return Math.round(Math.pow(10,n)*this.value())/Math.pow(10,n)},t().fn.isFloat=function(){const n=this.value();return parseInt(n,10)<parseFloat(n)},t().register("format","custom formats",{regexps:{format:/(&)/,unformat:/(&)/},format(n,o,r){const c=t()._.includes(o," %")?" ":"";let d;return n*=100,o=o.replace(/\s?%/,""),d=t()._.numberToFormat(n,o,r),t()._.includes(d,")")?(d=d.split(""),d.splice(-1,0,`${c}%`),d=d.join("")):d=`${d}${c}%`,d},unformat(n){return t()._.stringToNumber(n)*.01}});const l=null,x=({text:n,mode:o,render:r,placeholder:c,renderFormItem:d,fieldProps:f},m)=>{const{value:B,defaultValue:i,onChange:M,id:K,validator:z=[]}=f,[Y,Q]=(0,P.useState)([]),[U,Z]=(0,g.Z)(()=>i,{value:B,onChange:M});if(o==="read"){const S=(0,u.jsxs)("span",{ref:m,children:["\u6EE1 ",n[0]||"-","\u5143 \u51CF ",n[1]||"-","\u5143"]});return r?r(n,{mode:o,...f},S):S}if(o==="edit"||o==="update"){const S=()=>{if(Array.isArray(U)){const[F,y]=U;typeof F=="number"&&typeof y=="number"&&F>y?Z([y,F]):F===void 0&&y===void 0&&Z(void 0)}},b=(F,y)=>{var w;const $=[...U||[]];$[F]=y===null?void 0:y,Z($),Y[F]={...(w=z[F])==null?void 0:w.call(z,$)},Q(Y)},X=f?.placeholder||c||["\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB","\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D"],J=F=>Array.isArray(X)?X[F]:X,{className:k,...G}=f,H=(0,u.jsxs)(s.Space,{size:10,className:k,children:[(0,u.jsx)(s.InputNumber,{style:{width:"100%"},addonBefore:"\u6EE1",addonAfter:C.currency.symbol,min:0,max:5e3,...G,placeholder:J(0),id:`${K}-0`,value:U?.[0],defaultValue:i?.[0],onChange:F=>b(0,F)}),(0,u.jsx)(s.InputNumber,{style:{width:"100%"},addonBefore:"\u51CF",addonAfter:C.currency.symbol,min:0,max:5e3,...G,placeholder:J(1),id:`${K}-1`,value:U?.[1],defaultValue:i?.[1],onChange:F=>b(1,F)})]});return d?d(n,{mode:o,...f},H):H}return null},j=async(n,o)=>{const[r,c]=o;if(!r&&r!==0)throw new Error("\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB");if(!c&&c!==0)throw new Error("\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D")},E=[n=>{const[o,r]=n;if(!o&&o!==0)return{status:"error",help:"\u8BF7\u8F93\u5165\u6EE1\u51CF\u95E8\u69DB"}},n=>{const[o,r]=n;if(!r&&r!==0)return{status:"error",help:"\u8BF7\u8F93\u5165\u4F18\u60E0\u91D1\u989D"};if(r<.01)return{status:"error",help:"\u9762\u989D\u6700\u5C0F\u503C\u662F0.01\u5143"};if(o===0){if(r>500)return{status:"error",help:"\u95E8\u69DB\u4E3A0\u65F6\uFF0C\u9762\u989D\u9700\u5C0F\u4E8E\u7B49\u4E8E500\u5143"};r>10}}],D=O().forwardRef(x),v=T(D,"AmountRule");var h=e(3343);const p=T(h.Z,"UseTerm");var W=e(2655);const L={labelCol:{flex:"0 0 110px"}},N=({children:n,...o})=>(0,u.jsxs)(_.ProForm,{layout:"horizontal",...L,submitter:{render:(r,c)=>(0,u.jsx)(s.Space,{style:{marginLeft:110},children:c})},...o,children:[(0,u.jsx)(_.ProFormText,{readonly:!0,getValueProps:r=>({value:W.Xx[r]}),width:"md",name:"target",label:"\u4F18\u60E0\u5238\u7C7B\u578B"}),(0,u.jsx)(_.ProFormText,{width:"lg",name:"name",label:"\u4F18\u60E0\u5238\u540D\u79F0",placeholder:"\u8BF7\u586B\u5199\u4F18\u60E0\u5238\u540D\u79F0",rules:[{required:!0,message:"\u8BF7\u586B\u5199\u4F18\u60E0\u5238\u540D\u79F0"},{max:10,message:"\u4F18\u60E0\u5238\u540D\u79F0\u6700\u591A\u586B\u519910\u4E2A\u5B57"}]}),(0,u.jsx)(_.ProFormText,{readonly:!0,width:"md",name:"displayName",label:"\u4F18\u60E0\u5238\u6587\u6848"}),(0,u.jsx)(_.ProFormDateTimeRangePicker,{required:!0,width:"lg",name:"putTerm",label:"\u53D1\u653E\u65F6\u95F4",rules:[{required:!0,message:"\u8BF7\u9009\u62E9\u53D1\u653E\u65F6\u95F4"}]}),(0,u.jsx)(_.ProFormDigit,{label:"\u53D1\u653E\u5F20\u6570",name:"stock",placeholder:"\u8BF7\u8F93\u51651-1,000,000\u7684\u6B63\u6574\u6570",width:"sm",min:1,max:1e6,rules:[{required:!0,message:"\u8BF7\u586B\u5199\u53D1\u653E\u5F20\u6570"}]}),(0,u.jsx)(v,{fieldProps:{validator:E},placeholder:["\u8BF7\u8F93\u5165\u95E8\u69DB","\u8BF7\u8F93\u5165\u9762\u989D"],name:"rule",label:"\u95E8\u69DB\u53CA\u9762\u989D",width:"lg",rules:[{required:!0,message:"\u8BF7\u586B\u5199\u95E8\u69DB\u53CA\u9762\u989D"}]}),(0,u.jsx)(_.ProFormSelect,{name:"limit",label:"\u6BCF\u4EBA\u9650\u9886\u5F20\u6570",valueEnum:W.U8,placeholder:"\u8BF7\u9009\u62E9",width:"sm",rules:[{required:!0,message:"\u8BF7\u9009\u62E9\u6BCF\u4EBA\u9650\u9886\u5F20\u6570"}]}),(0,u.jsx)(p,{name:"useTerm",label:"\u4F7F\u7528\u65F6\u95F4",width:"lg",required:!0}),n]})},8741:(I,A,e)=>{e.r(A),e.d(A,{default:()=>C});var u=e(5893),s=e(2975),_=e.n(s),a=e(4047),T=e.n(a),P=e(1849),O=e(6785),g=e(2655);const R=[{title:"\u9996\u9875",href:"/"},{title:"\u8425\u9500\u4E2D\u5FC3",path:"/"},{title:"\u4F18\u60E0\u5238",path:"coupons"},{title:"\u521B\u5EFA\u4F18\u60E0\u5238",path:"create"}],C=()=>{const[l]=a.Form.useForm(),x=(0,s.useNavigate)(),[j]=(0,s.useSearchParams)(),E=j.get("target"),D={target:E,displayName:"xx "+g.Xx[E]},v=async h=>{console.log("values",h)};return(0,u.jsx)(P.Z,{breadcrumb:{items:R},title:"\u521B\u5EFA\u4F18\u60E0\u5238",extra:[(0,u.jsx)(a.Button,{onClick:()=>x(-1),children:"\u8FD4\u56DE"})],children:(0,u.jsx)("div",{className:"coupon-create-page",children:(0,u.jsx)(O.Z,{form:l,initialValues:D,onFinish:v})})})}},2655:(I,A,e)=>{e.d(A,{Ry:()=>P,U8:()=>O,Wb:()=>s,Xx:()=>_,ZP:()=>R,jS:()=>T,mu:()=>a});var u=e(8892);const s=new Map([[0,"\u6EE1\u51CF\u5238"],[1,"\u6298\u6263\u5238"]]);var _=(t=>(t[t.\u5E97\u94FA\u5546\u54C1\u5238=1]="\u5E97\u94FA\u5546\u54C1\u5238",t[t.\u5E97\u94FA\u901A\u7528\u5238=2]="\u5E97\u94FA\u901A\u7528\u5238",t[t.\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238=3]="\u5E97\u94FA\u5BA2\u670D\u4F53\u9A8C\u5238",t))(_||{}),a=(t=>(t[t.\u5168\u90E8=-1]="\u5168\u90E8",t[t.\u672A\u5F00\u59CB=0]="\u672A\u5F00\u59CB",t[t.\u8FDB\u884C\u4E2D=1]="\u8FDB\u884C\u4E2D",t[t.\u5DF2\u7ED3\u675F=2]="\u5DF2\u7ED3\u675F",t[t.\u5DF2\u4E0B\u7EBF=6]="\u5DF2\u4E0B\u7EBF",t))(a||{});const T=new Map([[-1,"\u5168\u90E8"],[0,"\u672A\u5F00\u59CB"],[1,"\u8FDB\u884C\u4E2D"],[2,"\u5DF2\u7ED3\u675F"],[6,"\u5DF2\u4E0B\u7EBF"]]),P=new Map([[-1,""],[0,"gray"],[1,"green"],[2,"blue"],[6,"red"]]),O=new Map([[1,"1\u5F20"],[2,"2\u5F20"],[3,"3\u5F20"],[4,"\u4E0D\u9650"]]),R={async list(t){return u.ZP.get("/merchant/coupons",t)},detail(t){return u.ZP.get("/merchant/coupons",{id:t})},delete(t){return u.ZP.delete("/merchant/coupons",{id:t})},create(t){return u.ZP.post("/merchant/coupons",t)},update(t){return u.ZP.patch("/merchant/coupons",t)}}}}]);