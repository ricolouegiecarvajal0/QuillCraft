/**
 * QuillCraft persistence layer.
 * Only this module reads/writes browser localStorage.
 * UI changes do not erase saved notes. Keep STORAGE_KEY stable across updates.
 * Browser storage is per-origin and per-browser (not synced across devices).
 */
const STORAGE_KEY = 'quillcraft.notes.v1';
const SCHEMA_VERSION = 1;
function readDatabase() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {version:SCHEMA_VERSION, notes:[]};
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.notes)) throw Error('Invalid saved data');
    return {version:SCHEMA_VERSION, notes:parsed.notes.filter(validNote)};
  } catch (err) {
    console.error('Could not read saved notes',err);
    throw new Error('Saved notes could not be read. No data was overwritten.');
  }
}
function validNote(n) {
  return n && typeof n.id==='string' && typeof n.title==='string' && typeof n.content==='string';
}
function writeDatabase(db) {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(db)); }
  catch(err) { console.error(err); throw new Error('Unable to save. Browser storage may be full or blocked. Export a backup.'); }
}
function uid(){ return (globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(36).slice(2)}`); }
export function getNotes(){return readDatabase().notes.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));}
export function getNote(id){return getNotes().find(n=>n.id===id)??null;}
export function createNote(title='Untitled Book') {
 const db=readDatabase(), now=new Date().toISOString();
 const note={id:uid(),title:title.trim()||'Untitled Book',content:'',createdAt:now,updatedAt:now};
 db.notes.push(note);writeDatabase(db);return note;
}
export function updateNote(id,changes){
 const db=readDatabase(),note=db.notes.find(n=>n.id===id);
 if(!note)return null;
 if(typeof changes.title==='string')note.title=changes.title.slice(0,100);
 if(typeof changes.content==='string')note.content=changes.content;
 note.updatedAt=new Date().toISOString();writeDatabase(db);return note;
}
export function deleteNote(id){const db=readDatabase();db.notes=db.notes.filter(n=>n.id!==id);writeDatabase(db);}
export function duplicateNote(id){
 const source=getNote(id);if(!source)return null;
 const note=createNote(`${source.title} (copy)`);return updateNote(note.id,{content:source.content});
}
export function exportNotes(){
 return JSON.stringify({app:'QuillCraft',version:SCHEMA_VERSION,exportedAt:new Date().toISOString(),notes:getNotes()},null,2);
}
export function importNotes(json){
 let parsed;
 try{parsed=JSON.parse(json);}catch{throw Error('This is not valid JSON.');}
 if(!parsed || parsed.app!=='QuillCraft' || !Array.isArray(parsed.notes) || !parsed.notes.every(validNote))
  throw Error('Not a valid QuillCraft backup.');
 const db=readDatabase(),ids=new Set(db.notes.map(n=>n.id));
 let count=0;
 for(const n of parsed.notes){
  const id=ids.has(n.id)?uid():n.id;ids.add(id);
  db.notes.push({id,title:n.title.slice(0,100),content:n.content,createdAt:n.createdAt||new Date().toISOString(),updatedAt:n.updatedAt||new Date().toISOString()});
  count++;
 }
 writeDatabase(db);return count;
}
