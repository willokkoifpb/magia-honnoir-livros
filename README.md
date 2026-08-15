# magia-honnoir-livros

Este repositório contém uma pequena biblioteca estática que exibe livros em formato `.txt` ou `.md`.

**Como funciona**
- **Fonte dos livros**: os arquivos de livro devem ser adicionados diretamente na pasta `books/` no repositório (cada livro fica em `books/<id>/`).
- **Manifesto**: o arquivo `books/books.json` lista os livros disponíveis. Cada entrada deve conter `id`, `title`, `subtitle` e `filename` (caminho relativo dentro de `books/`).

**Exemplo de entrada no manifesto**

```json
[{
	"id": "honnoir",
	"title": "História da Magia de Honnoir",
	"subtitle": "As Origens e Conflitos do Etmos",
	"filename": "honnoir/historia-da-magia-de-honnoir.txt"
}]
```

**Formato e formatação automática de `.md` / `.txt`**
- **Parágrafos**: separe parágrafos com uma linha em branco.
- **Capítulos / Títulos**:
	- Linhas que começam com `Capítulo` (ex.: `Capítulo I — Título`) ou `Chapter` são renderizadas como títulos (`h2`).
	- Cabeçalhos Markdown `#` e `##` também são reconhecidos: `#` vira `h2`, `##` vira `h3` no visualizador.
- **Epígrafe / Citação**: linhas iniciadas com `>` (blockquote Markdown) viram `.epigraph` centralizada.
- **Ornamentos**: linhas muito curtas contendo símbolos (ex.: `✵`, `***`) são renderizadas como ornamento decorativo.
- **Dropcap**: o primeiro parágrafo do livro recebe automaticamente uma letra capitular (dropcap).
- **Markdown inline suportado** (em `.md`):
	- `**negrito**` → negrito
	- `*itálico*` → itálico
	- `` `código` `` → trechos em `code`
- **Limitado / não suportado**: listas complexas, imagens e links têm suporte parcial ou não mapeado; posso estender o parser se desejar.

**Como adicionar um novo livro**
1. Crie uma pasta para o livro em `books/<id>/` (por exemplo `books/meu-livro/`).
2. Coloque o arquivo principal (`.md` ou `.txt`) dentro dessa pasta, por exemplo `books/meu-livro/indice.md`.
3. Atualize `books/books.json` adicionando uma entrada com o `filename` apontando para `meu-livro/indice.md`.

**Servir localmente (recomendado para desenvolvimento)**
Abra um terminal na raiz do projeto e execute:

```bash
python -m http.server 8000
```

Então abra `http://localhost:8000/index.html` no navegador.

**Observações**
- Certifique-se de que `books/books.json` aponta para os caminhos corretos dentro da pasta `books/`.
- Após adicionar novos arquivos via GitHub, o site carregará os livros listados no manifesto — pode ser necessário limpar cache do navegador para ver mudanças.

Se quiser, posso gerar um pequeno script (Node.js ou Python) que escaneie `books/` e atualize automaticamente `books/books.json` com entradas padrão.