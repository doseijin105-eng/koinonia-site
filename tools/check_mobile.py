import sys, json, asyncio
from playwright.async_api import async_playwright
JS = r"""
(() => {
 const out=[]; const sel='button,a[href],input,select,summary,[role=button],[onclick]';
 for (const e of document.querySelectorAll(sel)) {
  const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
  if (r.width<1||r.height<1||cs.visibility==='hidden'||cs.display==='none') continue;
  if (r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth) continue;
  if (e.closest('[hidden]')) continue;
  const label=(e.getAttribute('aria-label')||e.innerText||e.value||e.title||e.id||e.tagName).trim().slice(0,30);
  const small = (r.width<44||r.height<44);
  // occlusion: sample 5 points
  const pts=[[.5,.5],[.15,.5],[.85,.5],[.5,.2],[.5,.8]]; let occ=[];
  for (const [fx,fy] of pts){ const x=r.left+r.width*fx, y=r.top+r.height*fy; if(x<0||y<0||x>=innerWidth||y>=innerHeight) continue;
    const t=document.elementFromPoint(x,y); if(t && t!==e && !e.contains(t) && !t.contains(e)) { const tl=(t.closest('button,input,[role=button],a,aside,div')||t); occ.push((tl.id||tl.className||tl.tagName).toString().slice(0,30)); } }
  if (small||occ.length) out.push({label, w:Math.round(r.width), h:Math.round(r.height), small, occ:[...new Set(occ)]});
 }
 return out;
})()
"""
async def main(url, steps):
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx=await b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
    pg=await ctx.new_page()
    await pg.route('**/api/**', lambda r: r.fulfill(status=200, content_type='application/json', body='[]'))
    errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(url); await pg.wait_for_timeout(800)
    for st in steps:
      if st.startswith('js:'): await pg.evaluate(st[3:])
      elif st.startswith('click:'): await pg.click(st[6:])
      elif st.startswith('shot:'):
        await pg.wait_for_timeout(500)
        res=await pg.evaluate(JS)
        print('##',st[5:]); [print('  ',r) for r in res]
        await pg.screenshot(path=f'/tmp/{st[5:]}.png')
      elif st.startswith('scroll:'): await pg.evaluate(f'scrollTo(0,{st[7:]})')
      await pg.wait_for_timeout(300)
    print('errors:',errs[:5])
    await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2:]))
