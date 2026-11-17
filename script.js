const MANIFEST_URL = 'books/books.json';
const qs = (selector) => document.querySelector(selector);
let manifest = [];
let loadError = false;
let openingSequence = 0;
let returnFocus = null;
let catalogScroll = 0;

async function init() {
  setupHandlers();
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Manifesto: ${response.status}`);
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error('Catálogo inválido');
    manifest = entries;
    const subjects = [...new Set(manifest.map(book => book.subject).filter(Boolean))];
    subjects.sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      qs('#subject-filter').appendChild(option);
    });
  } catch (error) {
    loadError = true;
    console.warn('Não foi possível carregar o catálogo:', error);
  }
  renderLibrary();
}

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function renderLibrary() {
  const list = qs('#book-list');
  const status = qs('#catalog-status');
  list.replaceChildren();
  if (loadError) {
    status.textContent = 'Não foi possível carregar a biblioteca. Tente recarregar a página.';
    return;
  }
  const query = normalize(qs('#book-search').value.trim());
  const subject = qs('#subject-filter').value;
  const books = manifest.filter(book => (!subject || book.subject === subject) &&
    normalize([book.title, book.subtitle, book.author, book.subject].filter(Boolean).join(' ')).includes(query));
  status.textContent = `${books.length} ${books.length === 1 ? 'livro disponível' : 'livros disponíveis'}`;
  if (books.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'catalog-empty';
    empty.textContent = 'Nenhum livro corresponde à busca. Experimente outro termo ou matéria.';
    list.appendChild(empty);
    return;
  }
  books.forEach(book => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'book-card';
    card.setAttribute('aria-label', `Ler ${book.title}`);
    if (book.subject) card.appendChild(textElement('span', 'book-subject', book.subject));
    card.appendChild(textElement('span', 'book-title', book.title));
    if (book.subtitle) card.appendChild(textElement('span', 'meta', book.subtitle));
    if (book.author) card.appendChild(textElement('span', 'book-author', book.author));
    card.appendChild(textElement('span', 'read-label', 'Abrir livro →'));
    card.addEventListener('click', () => {
      returnFocus = card;
      catalogScroll = window.scrollY;
      openBook(book);
    });
    list.appendChild(card);
  });
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function setupHandlers() {
  qs('#book-search').addEventListener('input', renderLibrary);
  qs('#subject-filter').addEventListener('change', renderLibrary);
  qs('#back').addEventListener('click', () => {
    openingSequence++;
    qs('#reader-screen').classList.add('hidden');
    qs('#library-screen').classList.remove('hidden');
    document.title = 'Biblioteca - Magia de Honnoir';
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    window.scrollTo(0, catalogScroll);
  });
}

async function openBook(book) {
  const sequence = ++openingSequence;
  qs('#library-screen').classList.add('hidden');
  qs('#reader-screen').classList.remove('hidden');
  const view = qs('#book-view');
  view.textContent = 'Carregando o livro…';
  qs('#back').focus({ preventScroll: true });
  window.scrollTo(0, 0);
  try {
    const response = await fetch('books/' + book.filename, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Livro: ${response.status}`);
    const text = await response.text();
    if (sequence !== openingSequence) return;
    view.replaceChildren(createTitlePage(book));
    parseTextToNodes(text, book.filename).forEach(node => view.appendChild(node));
    document.title = `${book.title} - Honnoir`;
  } catch (error) {
    if (sequence !== openingSequence) return;
    view.textContent = 'Não foi possível carregar este livro. Volte à biblioteca e tente novamente.';
    console.warn('Erro na leitura:', error);
  }
}

function createTitlePage(book) {
  const page = document.createElement('header');
  page.className = 'title-page';
  const title = textElement('h1', '', book.title);
  title.tabIndex = -1;
  page.appendChild(title);
  if (book.subtitle) page.appendChild(textElement('div', 'subtitle', book.subtitle));
  if (book.author) page.appendChild(textElement('div', 'title-author', book.author));
  return page;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mdInlineToHtml(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g, (_, code, strong, emphasis) => {
      if (code !== undefined) return `<code>${code}</code>`;
      if (strong !== undefined) return `<strong>${strong}</strong>`;
      return `<em>${emphasis}</em>`;
    });
}

function parseTextToNodes(text, filename) {
  const parts = text.split(/\r?\n\s*\r?\n/).map(part => part.trim()).filter(Boolean);
  const nodes = [];
  let firstParagraph = true;
  const isMarkdown = filename && filename.toLowerCase().endsWith('.md');
  parts.forEach(paragraph => {
    const heading = paragraph.match(/^(#{1,6})\s+(.+)$/);
    if (heading || /^Cap[ií]tulo\b/i.test(paragraph) || /^Chapter\b/i.test(paragraph)) {
      const title = document.createElement(heading && heading[1].length > 2 ? 'h3' : 'h2');
      if (heading) title.innerHTML = mdInlineToHtml(heading[2]);
      else title.textContent = paragraph.replace(/\s+/g, ' ');
      nodes.push(title);
      firstParagraph = true;
      return;
    }
    if (paragraph.startsWith('>')) {
      nodes.push(textElement('div', 'epigraph', paragraph.replace(/^>\s*/, '')));
      return;
    }
    if (paragraph.length <= 4 && /[^\p{L}\p{N}\s]/u.test(paragraph)) {
      nodes.push(textElement('div', 'ornament', paragraph));
      return;
    }
    const node = document.createElement('p');
    if (isMarkdown) node.innerHTML = mdInlineToHtml(paragraph);
    else node.textContent = paragraph;
    if (firstParagraph) node.className = 'chapter-opening';
    firstParagraph = false;
    nodes.push(node);
  });
  return nodes;
}

window.addEventListener('DOMContentLoaded', init);
