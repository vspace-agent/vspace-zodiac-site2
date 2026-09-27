(() => {
  const fileInput=document.querySelector('#fileInput'), choose=document.querySelector('#chooseFile');
  const drop=document.querySelector('#dropZone'), pasteToggle=document.querySelector('#pasteInstead');
  const pastePanel=document.querySelector('#pastePanel'), pasteText=document.querySelector('#pasteText');
  const usePaste=document.querySelector('#usePaste'), error=document.querySelector('#loadError');
  const copyPrompt=document.querySelector('#copyPrompt'), copyStatus=document.querySelector('#copyStatus');
  const promptToggle=document.querySelector('#promptToggle'), promptPanel=document.querySelector('#promptPanel'), promptPreview=document.querySelector('#promptPreview');
  let formattingPrompt=window.VSPACE_FORMATTING_PROMPT_FALLBACK||'';
  promptPreview.textContent=formattingPrompt.slice(0,1100)+(formattingPrompt.length>1100?'\\n\\n…':'');
  if(location.protocol!=='file:')fetch('vspace_scrollytelling_content_formatting.md').then(r=>r.ok?r.text():Promise.reject()).then(t=>{formattingPrompt=t;promptPreview.textContent=t.slice(0,1100)+(t.length>1100?'\\n\\n…':'')}).catch(()=>{});

  choose.onclick=()=>fileInput.click();
  fileInput.onchange=()=>{const f=fileInput.files?.[0];if(f)readFile(f)};
  pasteToggle.onclick=()=>{pastePanel.hidden=!pastePanel.hidden;if(!pastePanel.hidden)pasteText.focus()};
  promptToggle.onclick=()=>{
    const opening=promptPanel.hidden;
    promptPanel.hidden=!opening;
    drop.classList.toggle('prompt-open',opening);
  };
  copyPrompt.onclick=async()=>{
    let ok=false;
    try{await navigator.clipboard.writeText(formattingPrompt);ok=true}catch(e){}
    if(!ok){
      const ta=document.createElement('textarea');ta.value=formattingPrompt;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();ok=document.execCommand('copy');ta.remove();
    }
    copyStatus.textContent=ok?'Copied':'Copy failed';
    if(ok)setTimeout(()=>copyStatus.textContent='',1800);
  };
  usePaste.onclick=()=>loadMarkdown(pasteText.value);
  ['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('dragging')}));
  ['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('dragging')}));
  drop.addEventListener('drop',e=>{const f=e.dataTransfer.files?.[0];if(f)readFile(f)});

  async function readFile(file){
    if(!/\.md$/i.test(file.name)){showError('Please choose a Markdown (.md) file.');return}
    try{loadMarkdown(await file.text())}catch(e){showError('The file could not be read.')}
  }
  function loadMarkdown(text){
    try{
      const book=parseMarkdown(text);validate(book);window.VSPACE_BOOK=book;
      error.textContent='';document.body.classList.remove('loading-mode');document.body.classList.add('experience-mode');
      const s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
    }catch(e){showError(e.message)}
  }
  function parseMarkdown(source){
    const lines=String(source||'').replace(/\r/g,'').split('\n');
    const book={title:'',subtitle:'',introQuote:'',chapters:[]};let chapter=null,sub=null,section=null;
    const intro=[];
    for(const raw of lines){
      const line=raw.trimEnd();let m;
      if((m=line.match(/^# (.+)$/))){book.title=m[1].trim();section=null;continue}
      if((m=line.match(/^## (.+)$/))){chapter={title:normalizeChapter(m[1]),subunits:[]};book.chapters.push(chapter);sub=null;section=null;continue}
      if((m=line.match(/^### (.+)$/))){if(!chapter)throw new Error('A ### sub-unit appears before its ## chapter.');sub={title:m[1].trim(),brief:'',detailed:''};chapter.subunits.push(sub);section=null;continue}
      if((m=line.match(/^####\s+(BRIEF|Brief)\s*$/))){if(!sub)throw new Error('BRIEF appears before a ### sub-unit.');section='brief';continue}
      if((m=line.match(/^####\s+(DETAILED|Detailed)\s*$/))){if(!sub)throw new Error('DETAILED appears before a ### sub-unit.');section='detailed';continue}
      if(section&&sub){sub[section]+=(sub[section]?'\n':'')+line;continue}
      if(!chapter&&line.trim())intro.push(line.trim())
    }
    const introText=intro.join('\n');
    const italic=introText.match(/^\s*\*([^*]+)\*\s*$/m);if(italic)book.subtitle=italic[1].trim();
    book.introQuote=intro.filter(x=>/^>/.test(x)).map(x=>x.replace(/^>\s?/, '').replace(/\\$/,'').trim()).join(' ').replace(/\s+/g,' ').trim();
    book.chapters.forEach(ch=>ch.subunits.forEach(s=>{s.brief=s.brief.trim();s.detailed=s.detailed.trim()}));
    return book;
  }
  function normalizeChapter(s){
    const m=s.trim().match(/^(.*?)\s+---\s+(.*)$/);return m?`${m[1].trim()} — ${m[2].trim()}`:s.trim();
  }
  function validate(book){
    if(!book.title)throw new Error('Missing # BOOK TITLE.');
    if(book.chapters.length<1||book.chapters.length>12)throw new Error(`Expected 1–12 ## chapters; found ${book.chapters.length}.`);
    book.chapters.forEach((ch,i)=>{
      if(!/\s[—-]\s/.test(ch.title))throw new Error(`Chapter ${i+1} needs a motive question: ## Title --- Question`);
      if(ch.subunits.length<1||ch.subunits.length>16)throw new Error(`“${ch.title}” needs 1–16 ### sub-units; found ${ch.subunits.length}.`);
      ch.subunits.forEach(s=>{if(!s.brief)throw new Error(`“${s.title}” is missing #### BRIEF.`);if(!s.detailed)throw new Error(`“${s.title}” is missing #### DETAILED.`)})
    })
  }
  function showError(msg){error.textContent=msg}
})();
