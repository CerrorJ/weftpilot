# 可复用界面组件

原型使用原生 HTML 与函数模板，未引入框架。下面为当前实际组件源代码。

```js
const badge=s=>`<span class="status ${s}">${icon(statusMap[s][1])}${statusMap[s][0]}</span>`;
const avatar=r=>`<span class="avatar ${r.color||''}">${esc(r.avatar||r.name.slice(0,1))}</span>`;
const prog=t=>`<div class="progress-line"><div class="progress-track ${t.status}"><span style="width:${pct(t)}%"></span></div><span>${t.done}/${t.steps.length}</span></div>`;
const footer=()=>'<div class="demo-footer"><span>WEFTPILOT / PRODUCT PROTOTYPE V2</span><span>演示数据 · 本机浏览器保存 · 可在设置重置</span></div>';
const notice=(txt)=>`<div class="notice">${icon('shield')}<span>${txt}</span></div>`;
function heading(title,sub,action,eye='WORKSPACE'){return`<div class="page-head"><div><div class="eyebrow">${eye}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div>${action||''}</div>`;}
function closeModal(){document.getElementById('modal-root').innerHTML='';if(typeof persistDemo==='function')persistDemo();if(modalFocus?.isConnected)modalFocus.focus();}
function modal(title,body,actions,extra=''){modalFocus=document.activeElement;document.getElementById('modal-root').innerHTML=`<div class="overlay" data-overlay="true"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="关闭窗口">${icon('close')}</button></div>${extra}<div class="modal-body">${body}</div><div class="modal-footer">${actions||'<span class="spacer"></span><button class="btn" data-action="close-modal">关闭</button>'}</div></section></div>`;const focus=document.querySelector('.modal input:not([type=checkbox]),.modal select,.modal button');if(focus)focus.focus();}
const opts=(arr,value)=>arr.map(([id,name])=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(name)}</option>`).join('');
```
