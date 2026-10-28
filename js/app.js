import * as store from './storage.js';
const $=id=>document.getElementById(id);
const PAGE_CHARS=520;
let activeId=null,spread=0,saveTimer=null,lastSaved={title:'',content:''},pages=[''];
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3300);}
function safeNotes(){try{return store.getNotes();}catch(e){toast(e.message);return [];}}
function splitPages(content){return content.match(/[\s\S]{1,520}/g)||[''];}
function escapeText(s){return s||'Untitled Book';}
function formatDate(s){return s?new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric'}):'';}
function renderList(){
 const all=safeNotes(),query=$('search').value.trim().toLowerCase();
 const filtered=all.filter(n=>(n.title+' '+n.content).toLowerCase().includes(query));
 $('noteCount').textContent=all.length;
 $('welcomeCount').textContent=`${all.length} book${all.length===1?'':'s'} in your library`;
 const shelf=$('notesList');shelf.replaceChildren();
 const groupCount=Math.max(1,Math.ceil(filtered.length/6));
 for(let groupIndex=0;groupIndex<groupCount;groupIndex++){
  const books=filtered.slice(groupIndex*6,groupIndex*6+6);
  const group=document.createElement('div');group.className='bookshelf-block';
  group.style.backgroundImage=`url("./assets/shelf-${books.length}.png")`;
  group.setAttribute('role','group');group.setAttribute('aria-label',`Bookshelf ${groupIndex+1}`);
  for(let slot=0;slot<6;slot++){
   const n=books[slot],cell=document.createElement(n?'button':'span');
   cell.className='book-hotspot'+(n?.id===activeId?' selected':'');
   if(n){
    cell.type='button';cell.title=n.title||'Untitled Book';
    cell.setAttribute('aria-label','Open '+escapeText(n.title));
    const tooltip=document.createElement('span');tooltip.className='book-tooltip';
    tooltip.textContent=escapeText(n.title);
    cell.append(tooltip);cell.addEventListener('click',()=>openNote(n.id));
   }else cell.setAttribute('aria-hidden','true');
   group.append(cell);
  }
  shelf.append(group);
 }
 if(query&&!filtered.length){const p=document.createElement('p');p.className='no-notes';p.textContent='No books match your search.';shelf.append(p);}
}
function showWelcome(){flushSave();activeId=null;$('editorView').hidden=true;$('emptyState').hidden=false;$('crumbTitle').textContent='WELCOME';renderList();}
function renderPages(){
 const left=spread*2,right=left+1;
 $('leftInput').value=pages[left]||'';$('rightInput').value=pages[right]||'';
 $('leftPageNumber').textContent=`Page ${left+1} of ${Math.max(2,pages.length)}`;
 $('rightPageNumber').textContent=`Page ${right+1} of ${Math.max(2,pages.length)}`;
 $('pageIndicator').textContent=`PAGES ${left+1}–${right+1}`;
 $('pageInfo').textContent=`${pages.length} written page${pages.length===1?'':'s'}`;
 $('wordCount').textContent=`${pages.join('').trim()?pages.join('').trim().split(/\s+/).length:0} words`;
 $('prevPage').disabled=spread===0;
 $('nextPage').disabled=right>=pages.length && !(pages[right]||'').trim();
}
function openNote(id){
 flushSave();let n;try{n=store.getNote(id);}catch(e){toast(e.message);return;}
 if(!n)return showWelcome();activeId=id;spread=0;pages=splitPages(n.content);
 lastSaved={title:n.title,content:n.content};$('titleInput').value=n.title;
 $('emptyState').hidden=true;$('editorView').hidden=false;$('crumbTitle').textContent=escapeText(n.title);
 $('saveState').textContent='All changes saved';$('editedAt').textContent='Last edited '+formatDate(n.updatedAt);
 renderPages();renderList();
}
function flushSave(){
 clearTimeout(saveTimer);if(!activeId)return;
 const changes={title:$('titleInput').value,content:pages.join('')};
 if(changes.title===lastSaved.title&&changes.content===lastSaved.content)return;
 try{const n=store.updateNote(activeId,changes);if(!n)return;lastSaved=changes;
 $('saveState').textContent='All changes saved';$('editedAt').textContent='Last edited '+formatDate(n.updatedAt);renderList();}
 catch(e){$('saveState').textContent='Save failed';toast(e.message);}
}
function scheduleSave(){clearTimeout(saveTimer);$('saveState').textContent='Saving…';$('crumbTitle').textContent=escapeText($('titleInput').value);saveTimer=setTimeout(flushSave,450);}
function editPage(index,element){
 // Keep every character: when a page grows beyond its target, overflow is moved to the following page.
 pages[index]=element.value;
 for(let i=index;i<pages.length;i++){
  if(pages[i].length>PAGE_CHARS){const overflow=pages[i].slice(PAGE_CHARS);pages[i]=pages[i].slice(0,PAGE_CHARS);pages[i+1]=overflow+(pages[i+1]||'');}
 }
 while(pages.length>1&&pages.at(-1)==='')pages.pop();
 // Do not redraw the textarea being typed into; it would disrupt the caret.
 const combined=pages.join('');$('wordCount').textContent=`${combined.trim()?combined.trim().split(/\s+/).length:0} words`;
 $('pageInfo').textContent=`${pages.length} written page${pages.length===1?'':'s'}`;
 $('nextPage').disabled=(spread*2+1)>=pages.length && !(pages[spread*2+1]||'').trim();
 scheduleSave();
}
function turn(delta){
 const target=spread+delta;if(target<0)return;
 if(delta>0&&target*2>pages.length)return;
 spread=target;
 const book=document.querySelector('.open-book');book.classList.remove('turning');void book.offsetWidth;book.classList.add('turning');
 renderPages();
}
function openCraft(){$('newTitle').value='';$('craftModal').hidden=false;$('craftModal').classList.remove('modal-enter');void $('craftModal').offsetWidth;$('craftModal').classList.add('modal-enter');$('newTitle').focus();}
function closeCraft(){$('craftModal').hidden=true;}
function craft(){try{flushSave();const n=store.createNote($('newTitle').value||'Untitled Book');closeCraft();openNote(n.id);$('leftInput').focus();toast('Book & Quill crafted!');}catch(e){toast(e.message);}}
$('newBtn').addEventListener('click',openCraft);$('emptyCreate').addEventListener('click',openCraft);
$('browseBtn').addEventListener('click',()=>{$('search').focus();toast('Select a book from your chiseled bookshelf.');});
$('homeBtn').addEventListener('click',showWelcome);
$('closeModal').addEventListener('click',closeCraft);$('cancelCraft').addEventListener('click',closeCraft);$('confirmCraft').addEventListener('click',craft);
$('newTitle').addEventListener('keydown',e=>{if(e.key==='Enter')craft();});
$('craftModal').addEventListener('click',e=>{if(e.target===$('craftModal'))closeCraft();});
$('titleInput').addEventListener('input',scheduleSave);
$('leftInput').addEventListener('input',e=>editPage(spread*2,e.target));
$('rightInput').addEventListener('input',e=>editPage(spread*2+1,e.target));
$('prevPage').addEventListener('click',()=>turn(-1));$('nextPage').addEventListener('click',()=>turn(1));
$('search').addEventListener('input',renderList);
$('deleteBtn').addEventListener('click',()=>{if(!activeId||!confirm('Delete this book permanently?'))return;const id=activeId;activeId=null;try{store.deleteNote(id);showWelcome();toast('Book deleted.');}catch(e){toast(e.message);}});
$('duplicateBtn').addEventListener('click',()=>{if(!activeId)return;try{flushSave();const n=store.duplicateNote(activeId);if(n)openNote(n.id);toast('Book duplicated.');}catch(e){toast(e.message);}});
$('exportBtn').addEventListener('click',()=>{try{flushSave();const blob=new Blob([store.exportNotes()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='quillcraft-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup downloaded.');}catch(e){toast(e.message);}});
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=await file.text(),parsed=JSON.parse(data);if(!Array.isArray(parsed.notes))throw Error('Invalid backup');if(!confirm(`Import ${parsed.notes.length} book(s)? Existing notes will be kept.`))return;flushSave();const count=store.importNotes(data);renderList();toast(`${count} books imported.`);}catch(err){toast(err.message||'Import failed.');}finally{e.target.value='';}});
function setTheme(theme){document.body.classList.toggle('light',theme==='day');$('themeBtn').textContent=theme==='day'?'☾ Night':'☀ Day';try{localStorage.setItem('quillcraft.theme.v1',theme);}catch{}}
$('themeBtn').addEventListener('click',()=>setTheme(document.body.classList.contains('light')?'night':'day'));
try{setTheme(localStorage.getItem('quillcraft.theme.v1')||'day');}catch{setTheme('day');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCraft();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();flushSave();toast('Saved.');}if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&$('craftModal').hidden){e.preventDefault();$('search').focus();}});
window.addEventListener('pagehide',flushSave);
try{renderList();showWelcome();}catch(e){toast(e.message);}
