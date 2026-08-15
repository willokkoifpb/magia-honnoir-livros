const MANIFEST_URL = 'books/books.json';

const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

let manifest = [];

async function init() {
  await loadManifest();
  renderLibrary();
  setupHandlers();
}

async function loadManifest(){
  try{
    const res = await fetch(MANIFEST_URL);
    manifest = await res.json();
  }catch(e){
    console.warn('Não foi possível carregar manifest:', e);
    manifest = [];
  }
}

function renderLibrary(){
  const list = qs('#book-list');
  list.innerHTML = '';

  const all = [...manifest];
  if(all.length === 0){ list.textContent = 'Nenhum livro encontrado.'; return; }

  all.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    const h3 = document.createElement('h3'); h3.textContent = book.title;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = book.subtitle || '';
    card.appendChild(h3); card.appendChild(meta);
    card.addEventListener('click', ()=> openBook(book));
    list.appendChild(card);
  });
}

function setupHandlers(){
  qs('#back').addEventListener('click', ()=>{ qs('#reader-screen').classList.add('hidden'); qs('#library-screen').classList.remove('hidden'); });
}

// handleFiles removed; add books directly to `books/` and update manifest

async function openBook(book){
  qs('#library-screen').classList.add('hidden');
  qs('#reader-screen').classList.remove('hidden');
  const view = qs('#book-view');
  view.innerHTML = '';

  let text = '';
  try{
    const res = await fetch('books/' + book.filename);
    text = await res.text();
  }catch(e){ view.textContent = 'Erro ao carregar o livro.'; return; }

  const titlePage = createTitlePage(book.title, book.subtitle);
  view.appendChild(titlePage);

  const contentNodes = parseTextToNodes(text, book.filename);
  contentNodes.forEach(n => view.appendChild(n));
}

function createTitlePage(title, subtitle){
  const div = document.createElement('div'); div.className = 'title-page';
  const h1 = document.createElement('h1'); h1.innerHTML = title.replace(/\n/g,'<br>');
  div.appendChild(h1);
  if(subtitle){ const sub = document.createElement('div'); sub.className='subtitle'; sub.textContent = subtitle; div.appendChild(sub); }
  return div;
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function mdInlineToHtml(s){
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
  return out.replace(/<strong>([^<]+?)</g, '<strong>$1</strong>');
}

function parseTextToNodes(text, filename){
  const parts = text.split(/\r?\n\s*\r?\n/).map(s=>s.trim()).filter(Boolean);
  const nodes = [];
  let firstParagraphAppended = false;

  parts.forEach(para => {
    // Markdown heading detection (#, ##) or legacy 'Capítulo'
    const mdHeading = para.match(/^(#{1,6})\s+(.+)$/);
    if(mdHeading){
      const level = mdHeading[1].length;
      const h = document.createElement(level <= 2 ? 'h2' : 'h3');
      h.innerHTML = mdInlineToHtml(mdHeading[2]);
      nodes.push(h); firstParagraphAppended = false; return;
    }

    if(/^Cap[ií]tulo\b/i.test(para) || /^Chapter\b/i.test(para)){
      const h = document.createElement('h2'); h.textContent = para.replace(/\s+/g,' ');
      nodes.push(h);
      firstParagraphAppended = false;
      return;
    }

    // Epigraph (lines starting with >)
    if(para.startsWith('>')){
      const d = document.createElement('div'); d.className='epigraph'; d.textContent = para.replace(/^>\s*/,''); nodes.push(d); return;
    }

    // Ornament: very short non-alphanumeric content
    if(para.length <= 4 && /[^A-Za-z0-9\s]/.test(para)){
      const o = document.createElement('div'); o.className='ornament'; o.innerHTML = escapeHtml(para); nodes.push(o); return;
    }

    // Normal paragraph (supports inline markdown for .md files)
    const p = document.createElement('p');
    const isMd = filename && filename.toLowerCase().endsWith('.md');
    if(!firstParagraphAppended){
      // dropcap
      const firstChar = para.charAt(0);
      const rest = para.slice(1);
      const span = document.createElement('span'); span.className='dropcap'; span.textContent = firstChar;
      p.appendChild(span);
      if(isMd) p.innerHTML += mdInlineToHtml(rest);
      else p.appendChild(document.createTextNode(rest));
      firstParagraphAppended = true;
    } else {
      if(isMd) p.innerHTML = mdInlineToHtml(para);
      else p.textContent = para;
    }
    nodes.push(p);
  });

  return nodes;
}

window.addEventListener('DOMContentLoaded', init);
