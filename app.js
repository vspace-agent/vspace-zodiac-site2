(() => {
  const book=window.VSPACE_BOOK;
  const canvas=document.querySelector('#canvasView'), frame=document.querySelector('#frameView');
  const sleepers=document.querySelector('#sleepers'), controller=document.querySelector('#controller');
  const choices=document.querySelector('#chapterChoices'), hint=document.querySelector('#hint');
  const frameStage=document.querySelector('#frameStage'), frameFront=document.querySelector('#frameFront');
  const center=document.querySelector('#center'), orbit=document.querySelector('#orbit'), growth=document.querySelector('#growthLines');
  const back=document.querySelector('#back'), frameHint=document.querySelector('#frameHint');
  const detailChapter=document.querySelector('#detailChapter'), detailTitle=document.querySelector('#detailTitle'), detailText=document.querySelector('#detailText'), closeDetail=document.querySelector('#closeDetail'), printBook=document.querySelector('#printBook');
  const bookIntro=document.querySelector('#bookIntro');
  const introQuote=book.introQuote||'';
  bookIntro.innerHTML=`<h1>${escapeHTML(book.title)}</h1><em>${escapeHTML(book.subtitle||'')}</em><blockquote>${escapeHTML(introQuote)}</blockquote>`;

  const pts=[[193,116],[500,176],[563,146],[1150,154],[1096,606],[1187,638],[1213,187],[683,284],[457,28],[999,53],[1075,73],[1073,697]].map(([x,y])=>[x/1254*100,y/1254*100]);
  const chapterSpots=[[18,42],[38,52],[58,42],[29,72],[53,70],[72,62],[16,84],[47,87],[76,82],[65,28],[34,30],[79,48]];
  let exposed=false,busy=false,currentChapter=null,nodes=[],angleOffset=0,raf=null,lastT=0,interactive=false,selectedNode=null;

  const chapterParts=book.chapters.map(ch=>splitChapter(ch.title));
  book.chapters.forEach((ch,i)=>{
    const b=document.createElement('div');b.className='sleeper';b.style.left=pts[i][0]+'%';b.style.top=pts[i][1]+'%';
    b.innerHTML=`<span class="star">✦</span><span class="label">${escapeHTML(chapterParts[i].title)}</span>`;sleepers.appendChild(b);
  });
  const sleeperEls=[...document.querySelectorAll('.sleeper')];

  controller.addEventListener('click',async()=>{
    if(exposed||busy)return;busy=true;bookIntro.classList.add('departing');await wait(850);bookIntro.hidden=true;hint.textContent='Chapters entering the field';
    for(let i=0;i<book.chapters.length;i++){
      sleeperEls[i].classList.add('glow');
      const spot=chapterSpots[i];await meteorFrom(sleeperEls[i],spot);
      await establishChapter(i,spot);sleeperEls[i].classList.remove('glow');sleeperEls[i].classList.add('spent');
      await wait(620);
    }
    exposed=true;busy=false;controller.classList.add('done');choices.classList.add('interactive');hint.textContent='Choose a chapter';
  });

  async function establishChapter(i,spot){
    const p=chapterParts[i],b=document.createElement('button');b.className='chapter-choice landing';b.style.left=spot[0]+'%';b.style.top=spot[1]+'%';b.dataset.i=i;
    b.innerHTML=`<strong>${escapeHTML(p.title)}</strong><span>${escapeHTML(p.question)}</span>`;choices.appendChild(b);
    b.animate([
      {transform:'translate(-50%,-50%) scale(.06)',opacity:0,filter:'blur(7px) drop-shadow(0 0 18px #ffe09a)'},
      {transform:'translate(-50%,-50%) scale(1.06)',opacity:1,filter:'blur(0) drop-shadow(0 0 10px rgba(255,224,154,.7))',offset:.72},
      {transform:'translate(-50%,-50%) scale(1)',opacity:1,filter:'blur(0)'}
    ],{duration:1250,easing:'cubic-bezier(.18,.72,.18,1)',fill:'forwards'});
    b.classList.add('established');
    await wait(3000);
    b.classList.add('settling');
    b.classList.remove('landing');
    await wait(1400);
    b.classList.remove('settling');
  }
  choices.addEventListener('click',e=>{const b=e.target.closest('.chapter-choice');if(!b||!exposed)return;openChapter(+b.dataset.i)});

  function meteorFrom(el,spot){return new Promise(resolve=>{
    const a=el.getBoundingClientRect(),s=canvas.querySelector('.square-stage').getBoundingClientRect();
    const sx=a.left+a.width/2-s.left,sy=a.top+a.height/2-s.top,tx=s.width*(.0295+.8142*spot[0]/100),ty=s.height*(.2552+.7217*spot[1]/100);
    const m=document.createElement('div');m.className='meteor';m.style.left=sx+'px';m.style.top=sy+'px';canvas.querySelector('.square-stage').appendChild(m);
    const ang=Math.atan2(ty-sy,tx-sx)*180/Math.PI;m.style.transform=`rotate(${ang}deg)`;
    m.animate([{left:sx+'px',top:sy+'px',opacity:0},{opacity:1,offset:.12},{left:tx+'px',top:ty+'px',opacity:1}],{duration:900,easing:'cubic-bezier(.2,.72,.2,1)'}).onfinish=()=>{m.remove();resolve()};
  })}

  async function openChapter(i){
    if(busy)return;busy=true;currentChapter=book.chapters[i];resetFrame();
    frame.classList.add('active');canvas.classList.add('descending');await wait(80);canvas.classList.remove('active');
    const p=splitChapter(currentChapter.title);center.innerHTML=`<span class="chapter-word">${escapeHTML(p.title)}</span>`;center.classList.add('origin');center.onclick=buildSubunits;
    await wait(1250);busy=false;frameHint.textContent='Touch the chapter to unfold it';
  }
  function resetFrame(){cancelAnimationFrame(raf);orbit.innerHTML='';growth.innerHTML='';nodes=[];angleOffset=0;interactive=false;selectedNode=null;frameStage.classList.remove('flipped');center.className='center-text';center.style.display='block';center.onclick=null}

  async function buildSubunits(){
    if(busy||!currentChapter)return;busy=true;center.onclick=null;frameHint.textContent='';center.classList.add('quiet');
    const subs=currentChapter.subunits,total=subs.length;
    for(let i=0;i<total;i++){
      const pos=orbitPoint(i,total,0),path=makeGrowthPath(pos,i);growth.appendChild(path);
      const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
      path.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:1050,easing:'cubic-bezier(.22,.72,.2,1)',fill:'forwards'});
      await wait(620);
      const n=document.createElement('button');n.className='orbit-node';n.textContent=subs[i].title;n.dataset.i=i;orbit.appendChild(n);nodes.push(n);
      n.style.left=pos.x+'%';n.style.top=pos.y+'%';requestAnimationFrame(()=>n.classList.add('established'));
      await wait(360);
    }
    await wait(500);growth.classList.add('dissolve');center.classList.remove('quiet');center.innerHTML=`<span class="chapter-word">${escapeHTML(splitChapter(currentChapter.title).title)}</span>`;
    busy=false;interactive=true;nodes.forEach(n=>n.classList.add('clickable'));frameHint.textContent='The constellation is awake';startOrbit();
  }

  function makeGrowthPath(pos,i){
    const NS='http://www.w3.org/2000/svg',p=document.createElementNS(NS,'path');
    const x=pos.x/100*1254,y=pos.y/100*1254,cx=627,cy=627,dx=x-cx,dy=y-cy,lean=(i%2?1:-1)*(22+(i%3)*10);
    const c1x=cx+dx*.30+lean,c1y=cy+dy*.30,c2x=cx+dx*.72-lean*.3,c2y=cy+dy*.72;
    p.setAttribute('d',`M ${cx} ${cy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`);p.classList.add('growth-path');return p;
  }
  function orbitPoint(i,total,offset){const a=Math.PI*2*i/total-Math.PI/2+offset;return{x:50+Math.cos(a)*34,y:50+Math.sin(a)*34}}
  function placeNode(n,i,total,offset){const p=orbitPoint(i,total,offset);n.style.left=p.x+'%';n.style.top=p.y+'%'}
  function startOrbit(){lastT=performance.now();const tick=t=>{const dt=Math.min(40,t-lastT);lastT=t;angleOffset+=dt*.000045;nodes.forEach((n,i)=>placeNode(n,i,nodes.length,angleOffset));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}

  orbit.addEventListener('click',e=>{
    const n=e.target.closest('.orbit-node');if(!n||!interactive||busy)return;
    nodes.forEach(x=>x.classList.remove('selected'));n.classList.add('selected');selectedNode=n;
    const s=currentChapter.subunits[+n.dataset.i];center.classList.add('brief-mode');center.innerHTML=`<span class="brief-title">${escapeHTML(s.title)}</span><span class="brief-copy">${escapeHTML(cleanBrief(s.brief))}</span>`;
    center.onclick=()=>flipToDetail(+n.dataset.i);frameHint.textContent='Touch the words to turn the page';
  });

  function flipToDetail(i){
    if(!interactive)return;cancelAnimationFrame(raf);const s=currentChapter.subunits[i],p=splitChapter(currentChapter.title);
    detailChapter.textContent=p.title;detailTitle.textContent=s.title;detailText.textContent=s.detailed;frameStage.classList.add('flipped');frameHint.textContent='';
  }
  closeDetail.addEventListener('click',()=>{frameStage.classList.remove('flipped');if(selectedNode){selectedNode.classList.remove('selected');selectedNode=null}center.classList.remove('brief-mode');center.innerHTML=`<span class="chapter-word">${escapeHTML(splitChapter(currentChapter.title).title)}</span>`;center.onclick=null;frameHint.textContent='The constellation is awake';startOrbit()});
  back.addEventListener('click',()=>{resetFrame();frame.classList.remove('active');canvas.classList.remove('descending');canvas.classList.add('active');hint.textContent='Choose a chapter';busy=false});
  printBook.addEventListener('click',printWholeBook);

  function printWholeBook(){
    const w=window.open('','vspace-zodiac-print');if(!w)return;
    const canvasSrc=new URL('assets/canvas.png',location.href).href,frameSrc=new URL('assets/frame.png',location.href).href;
    let pages=`<section class="visualPage introPage"><img class="pageArt" src="${canvasSrc}" alt=""><div class="intro"><h1>${escapeHTML(book.title)}</h1><em>${escapeHTML(book.subtitle||'')}</em><blockquote>${escapeHTML(introQuote)}</blockquote></div></section>`;
    book.chapters.forEach(ch=>{const cp=splitChapter(ch.title);pages+=`<section class="visualPage chapter"><img class="pageArt" src="${frameSrc}" alt=""><div class="chapterIntro"><h1>${escapeHTML(cp.title)}</h1><p>${escapeHTML(cp.question)}</p></div></section>`;ch.subunits.forEach(s=>{pages+=`<section class="page"><div class="chapterName">${escapeHTML(cp.title)}</div><h1>${escapeHTML(s.title)}</h1><h2>BRIEF</h2><div class="brief">${escapeHTML(cleanBrief(s.brief))}</div><h2>DETAILED</h2><div class="body">${escapeHTML(s.detailed)}</div></section>`})});
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(book.title)}</title><style>@page{size:210mm 210mm;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#ddd;color:#172238;font-family:Georgia,serif}.visualPage,.page{width:210mm;height:210mm;break-after:page;page-break-after:always;overflow:hidden;position:relative}.visualPage{color:#f6dfaa}.pageArt{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}.intro,.chapterIntro{position:absolute;text-align:center;text-shadow:0 2mm 5mm #07101d}.intro{left:15%;right:15%;top:37%}.intro h1{font-size:34pt;font-weight:400;margin:0 0 5mm}.intro em{display:block;font-size:13pt;line-height:1.5}.intro blockquote{font-size:15pt;line-height:1.55;margin:10mm auto 0;max-width:145mm}.chapterIntro{inset:0;display:grid;place-content:center;padding:25mm}.chapterIntro h1{font-size:46pt;font-weight:400;margin:0 0 8mm}.chapterIntro p{font-size:19pt;font-style:italic;margin:0}.page{background:#f3efe4;padding:20mm 23mm}.chapterName{font:10pt Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;opacity:.55}.page h1{font-size:29pt;font-weight:400;margin:6mm 0 9mm}.page h2{font:700 8pt Arial,sans-serif;letter-spacing:.18em;margin:7mm 0 3mm;opacity:.48}.brief{font-size:12.5pt;font-style:italic;line-height:1.48;margin-bottom:7mm}.body{font-size:11.2pt;line-height:1.58}@media screen{.visualPage,.page{margin:10mm auto;box-shadow:0 2mm 8mm #999}}@media print{html,body{background:none}.visualPage,.page{margin:0}}</style></head><body>${pages}<script>window.addEventListener('load',async()=>{const imgs=[...document.images];await Promise.all(imgs.map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=img.onerror=r})));setTimeout(()=>window.print(),350)});<\/script></body></html>`);w.document.close();
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(frameStage.classList.contains('flipped'))closeDetail.click();else if(frame.classList.contains('active'))back.click()}});
  function splitChapter(s=''){const a=s.split(/\s+[—-]{1,3}\s+/);return{title:(a.shift()||'').trim(),question:a.join(' — ').trim()}}
  function cleanBrief(s=''){return s.replace(/^\*\s*/, '').replace(/\s*\*\s*-+\s*/, ' — ').replace(/\s+/g,' ').trim()}
  function wait(ms){return new Promise(r=>setTimeout(r,ms))}
  function escapeHTML(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();
