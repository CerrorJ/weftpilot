import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assets=JSON.parse(await readFile(resolve(root,'.superdesign/brand-assets.json'),'utf8'));
const source=await readFile(resolve(root,'src/app.js'),'utf8');
const paths=Object.fromEntries([...source.split('const paths=')[1].split(';\nconst icon=')[0].matchAll(/(\w+):'([^']*)'/g)].map(m=>[m[1],m[2]]));
const names={home:'house',projects:'briefcase-business',tasks:'clipboard-list',requirements:'file-text',roles:'bot',teams:'users',skills:'puzzle',settings:'settings',plus:'plus',search:'search',arrow:'arrow-right',back:'chevron-left',down:'chevron-down',close:'x',check:'check',circle:'circle',running:'circle-play',clock:'clock-3',alert:'triangle-alert',stop:'square',checkCircle:'circle-check',branch:'git-branch',git:'git-fork',list:'list',board:'columns-2',bell:'bell',link:'link',external:'external-link',download:'download',terminal:'square-terminal',spark:'sparkles',copy:'copy',feishu:'send',shield:'shield-check',folder:'folder',edit:'pencil'};
const canonical=s=>s.replace(/<\/(?:path|rect|circle)>/g,'').replaceAll('/>','>').replace(/\s+/g,' ').trim();
const lookup=new Map(Object.entries(paths).map(([n,s])=>[canonical(s),names[n]]));
for(const name of process.argv.slice(2)){
  if(!/^[a-z][a-z-]+$/.test(name))throw Error('Invalid snapshot name');
  const input=JSON.parse(await readFile(resolve(root,`.superdesign/tmp/${name}.json`),'utf8'));
  let body=input.root.replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/g,(_,s)=>{
    const n=lookup.get(canonical(s));if(!n)throw Error('Unknown UI icon');
    return `<iconify-icon icon="lucide:${n}" aria-hidden="true"></iconify-icon>`;
  });
  for(const [path,asset] of Object.entries(assets))body=body.replaceAll(`src="${path}"`,`src="${asset.url}"`);
  if(/src="(?!https:\/\/|data:)/.test(body))throw Error('Local asset reference in snapshot');
  body=body.replace('class="app"','class="app flex h-screen overflow-hidden"').replace('class="board"','class="board relative"').replaceAll('V1 · 交互演示','V2 · 交互演示');
  if(body.includes('<div id="toast-root"'))body=body.split('<div id="toast-root"')[0]+'<div id="toast-root" aria-live="polite"></div></div>';
  const css=input.style.replaceAll('svg','iconify-icon')+'\niconify-icon{display:inline-flex;vertical-align:middle;flex-shrink:0;width:17px;height:17px;font-size:17px}.app h1{font-size:27px;line-height:1.4;font-weight:650;letter-spacing:-.7px}.app h2{font-size:18px;font-weight:600}.app h3{font-size:14px;font-weight:600}';
  const html='<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>纬舟 WeftPilot</title><script src="https://cdn.tailwindcss.com"></script><script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script><style>'+css+'</style></head><body>'+body+'</body></html>';
  await writeFile(resolve(root,`.superdesign/tmp/${name}.html`),html);
  console.log(`Prepared ${name}: public brand URLs, one screen, no runtime script.`);
}
