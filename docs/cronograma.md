# Cronograma — Compilador JavaScript → Python

Período: 15/set a 16/nov de 2026 (9 semanas)
Equipe: Matheus (líder), Israel, Jorge, Ruan, Lucas
Pontos de controle: **P1 em 23/09** · **P2 em 04/11** · entrega final 15 dias antes da entrevista

---

## Papéis fixos até o fim do projeto

| Pessoa | Papel | Arquivos que são dele |
|---|---|---|
| **Matheus** | Líder técnico — núcleo da AST, build, integração, apresentações | `src/ast.c`, `src/ast.h`, `Makefile`, `src/main.c` |
| **Israel** | Parser — ações semânticas que montam a AST (dupla com Matheus) | `src/grammar.y`, `src/lexico.l` |
| **Jorge** | Semântica — tabela de símbolos e verificações | `src/tabela.c`, `src/tabela.h`, `src/semantica.c`, `src/semantica.h` |
| **Ruan** | Gerador de código Python — expressões e comandos (dupla com Lucas) | `src/gerador.c`, `src/gerador.h` |
| **Lucas** | Gerador — funções e mapeamento da biblioteca + suíte de testes (dupla com Ruan) | `src/gerador.c`, `tests/` |

Regra de ouro: **cada arquivo tem um dono**. Se você precisa mexer em arquivo de outro, pede no grupo antes. Isso elimina 90% dos conflitos de merge.

`src/gerador.c` tem dois donos (Ruan e Lucas) — por isso eles dividem por **função dentro do arquivo**, e cada um só edita as suas funções. As funções estão nomeadas nas semanas abaixo.

---

# SEMANA 1 — 15 a 21 de setembro
**Objetivo da semana: destravar valores de tokens e criar o esqueleto da AST.**

Esta é a semana mais importante das nove. Sem ela, ninguém consegue trabalhar depois. Ninguém depende de ninguém aqui — as quatro frentes são independentes de propósito.

### Matheus — núcleo da AST + build

1. Crie `src/ast.h` com uma estrutura **genérica** (um único tipo de nó serve para tudo, é muito mais fácil de 5 pessoas usarem em paralelo):

```c
#ifndef AST_H
#define AST_H

typedef struct No {
    char *tipo;          /* "programa", "decl_var", "if", "binop", "num", "id"... */
    char *valor;         /* texto associado: nome da variável, operador, literal */
    struct No **filhos;
    int n_filhos;
    int linha;
} No;

No  *novo_no(const char *tipo, const char *valor, int linha);
void add_filho(No *pai, No *filho);
void imprimir_ast(No *raiz, int nivel);
void liberar_ast(No *raiz);

#endif
```

2. Implemente os quatro em `src/ast.c`. `novo_no` usa `malloc` + `strdup`; `add_filho` usa `realloc` para crescer o vetor; `imprimir_ast` imprime com indentação de 2 espaços por nível, no formato `tipo: valor (linha N)`; `liberar_ast` percorre recursivamente e dá `free`.
3. Tire o `main()` de dentro do `grammar.y` e crie `src/main.c` que chama `yyparse()`, e, se der certo, chama `imprimir_ast(raiz, 0)`. Declare `extern No *raiz;`.
4. Crie o `Makefile` na raiz:

```make
CC      = gcc
CFLAGS  = -Wall -g
BUILD   = build

all: compilador

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/grammar.tab.c $(BUILD)/grammar.tab.h: src/grammar.y | $(BUILD)
	bison -d -o $(BUILD)/grammar.tab.c src/grammar.y

$(BUILD)/lex.yy.c: src/lexico.l $(BUILD)/grammar.tab.h | $(BUILD)
	flex -o $(BUILD)/lex.yy.c src/lexico.l

compilador: $(BUILD)/grammar.tab.c $(BUILD)/lex.yy.c src/ast.c src/main.c
	$(CC) $(CFLAGS) -I$(BUILD) -Isrc -o compilador $^

clean:
	rm -rf $(BUILD) compilador
```

5. Peça ao Israel para adicionar `%option noyywrap` no topo do `lexico.l` (sem isso o `Makefile` acima precisa de `-lfl`).
6. Crie `.gitignore` com `build/`, `compilador`, `*.tab.c`, `*.tab.h`, `lex.yy.c`, `*.o`. Depois rode `git rm --cached src/lex.yy.c src/grammar.tab.c src/grammar.tab.h` — esses arquivos são gerados, não devem estar no repositório.

**Ainda nesta semana, o P1 (formulário vence 23/09):**

7. Commite este cronograma no repositório como `docs/sprints.md`. Ele é, literalmente, o item *"planejamento das sprints"* que o P1 pede. Adicione no topo uma linha dizendo o que já foi feito no primeiro mês (formação da equipe, escolha do projeto, ambiente configurado, análise léxica, gramática inicial).
8. Crie `docs/diario.md` com um cabeçalho e as entradas do primeiro mês que vocês lembrarem (a semana de refatoração que não rendeu já é uma entrada boa: *problema → tentativa → o que aprendemos*).
9. **Abra o formulário do P1 na sexta-feira, 18/09**, leia todas as perguntas e rascunhe as respostas num arquivo de texto. Não preencha ainda. Traga o rascunho para a daily de quarta 23/09 só se precisar de ajuste — o envio é na segunda, ver Semana 2.

**Pronto quando:** `make && ./compilador < src/1o_codigo.js` compila e roda sem erro (ainda sem imprimir árvore), e o rascunho do P1 está escrito.

### Israel — valores nos tokens

1. No `grammar.y`, logo depois do bloco `%{ ... %}`, adicione:

```c
%union {
    char  *str;
    double num;
    struct No *no;
}
```

2. Adicione `#include "ast.h"` dentro do bloco `%{ ... %}` (precisa vir antes do `%union`).
3. Troque as declarações dos três tokens que carregam valor:

```c
%token <str> IDENTIFICADOR STRING
%token <num> NUMERO
```

Os outros `%token` continuam iguais.

4. No `lexico.l`, adicione `%option noyywrap`, inclua `<string.h>` e `<stdlib.h>`, e mude três regras:

```c
[a-zA-Z_][a-zA-Z0-9_]*  { yylval.str = strdup(yytext); return IDENTIFICADOR; }
[0-9]+                  { yylval.num = atof(yytext);   return NUMERO; }
\"[^\"]*\"              { yylval.str = strdup(yytext); return STRING; }
'[^']*'                 { yylval.str = strdup(yytext); return STRING; }
```

5. Teste isolado: no `main.c` provisório, coloque um `printf` dentro de uma ação do Bison para conferir que o nome da variável chega certo. Exemplo, na regra `declaracao_var`, adicione temporariamente `{ printf("declarei: %s\n", $2); }` e rode com `1o_codigo.js`.
6. Remova os `printf` de teste antes do PR.

**Pronto quando:** rodando `1o_codigo.js`, o compilador imprime o nome de cada variável declarada.

### Jorge — ternário + documento da linguagem

1. Abra `src/grammar.y` e adicione **uma** linha na regra `expressao`, logo depois de `| expressao RESTO_DIVISAO expressao`:

```c
    | expressao INTERROGACAO expressao DOIS_PONTOS expressao
```

A precedência `%right INTERROGACAO DOIS_PONTOS` já existe no arquivo, então não precisa mexer em mais nada.

2. Rode `bison -d src/grammar.y -o /tmp/g.c` e confirme que continua aparecendo **apenas 1 conflito shift/reduce** (o do `else`). Se aparecerem mais, avise o grupo antes de continuar.
3. Teste com `3o_codigo.js` — ele deve passar a compilar inteiro, sem o erro da linha 52.
4. Escreva `docs/linguagem.md` (hoje está vazio, e é entregável da Sprint 1 do professor). Estrutura:
   - **Seção 1 — Tokens:** tabela com as três colunas *nome do token*, *expressão regular*, *exemplo*. Copie do `lexico.l`, um token por linha.
   - **Seção 2 — Gramática:** copie as produções do `grammar.y` em formato BNF limpo (sem os `%prec`, sem código C).
   - **Seção 3 — Escopo:** cole as duas listas de escopo (dentro e fora) que te passei na conversa.
   - **Seção 4 — Exemplos:** três blocos de código JS aceitos, tirados dos arquivos em `src/`.

**Pronto quando:** `3o_codigo.js` passa e `docs/linguagem.md` tem as 4 seções.

### Ruan + Lucas — especificação da tradução e infra de teste

Vocês dois vão escrever o **contrato** que o gerador de código vai implementar depois. Escrever isso agora, com calma, faz o código das semanas 5 a 7 sair em metade do tempo.

**Ruan:** crie `docs/traducao.md` com uma tabela de três colunas — *construção JS*, *saída Python*, *observação*. Preencha, no mínimo:

| JS | Python | Observação |
|---|---|---|
| `let x = 5;` | `x = 5` | `let`, `const` e `var` viram a mesma coisa |
| `true` / `false` / `null` | `True` / `False` / `None` | |
| `a === b` / `a !== b` | `a == b` / `a != b` | |
| `a && b` / `a \|\| b` / `!a` | `a and b` / `a or b` / `not a` | |
| `if (c) { }` | `if c:` | corpo vazio vira `pass` |
| `while (c) { }` | `while c:` | |
| `for (let i=0; i<n; i++) { B }` | `i = 0` + `while i < n:` + `B` + `i += 1` | tradução geral, funciona para qualquer `for` |
| `function f(a,b) { }` | `def f(a, b):` | |
| `i++;` (statement) | `i += 1` | |
| `console.log(x)` | `print(x)` | |
| `x.length` | `len(x)` | |
| `x.push(v)` | `x.append(v)` | |
| `"a" + b` | `"a" + str(b)` | decidir na semana 6 |

**Lucas:** monte a suíte de testes.
1. Crie `tests/casos/` e dentro dela pares de arquivos: `01_variaveis.js` + `01_variaveis.py.esperado`, `02_if.js` + `02_if.py.esperado`, e assim por diante. Comece com 6 casos bem pequenos (5 a 10 linhas cada), um por tema: variáveis, expressões, if/else, while, for, função.
2. Escreva você mesmo o `.py.esperado` na mão, seguindo a tabela do Ruan. É esse arquivo que define o certo.
3. Crie `tests/rodar.sh`:

```bash
#!/bin/bash
falhas=0
for js in tests/casos/*.js; do
    esperado="${js%.js}.py.esperado"
    ./compilador < "$js" > /tmp/saida.py 2>/dev/null
    if diff -q /tmp/saida.py "$esperado" > /dev/null; then
        echo "OK   $(basename $js)"
    else
        echo "FALHA $(basename $js)"
        falhas=$((falhas+1))
    fi
done
echo "--- $falhas falha(s)"
exit $falhas
```

4. Rode `chmod +x tests/rodar.sh`. Nesta semana ele vai falhar em tudo — está certo, é o alvo das próximas semanas.

**Pronto quando:** `docs/traducao.md` tem a tabela completa e `tests/casos/` tem 6 pares de arquivos.

---

# SEMANA 2 — 22 a 28 de setembro
**Objetivo: a AST nasce. Ao fim da semana o compilador imprime a árvore de qualquer programa do escopo.**

> ## 🔴 P1 — formulário vence quarta, 23/09, 23h59
>
> **Matheus, terça-feira 22/09:** envie o formulário (https://forms.office.com/r/MyKh4HiAAu) a partir do rascunho da Semana 1. Um dia inteiro de folga antes do prazo, de propósito — formulário do Office tem histórico de cair na última hora. Cole o link do repositório e o link direto do `docs/sprints.md` nas respostas.
>
> **O que responder, item por item:**
> - *Definição do projeto*: compilador de um subconjunto de JavaScript para Python 3, escrito em C com Flex e Bison. Cite que a saída é código Python executável, não assembly.
> - *Linguagem escolhida*: C, com Flex (léxico) e Bison (sintático). Justifique em uma frase: é a ferramenta trabalhada na disciplina e dá controle explícito sobre cada fase.
> - *Planejamento das sprints*: aponte para `docs/sprints.md` e resuma em 3 linhas (front-end até a AST → semântica → geração de Python → otimização e testes).
> - *O que foi implementado*: analisador léxico completo (lista os tokens), gramática cobrindo declarações, expressões com precedência, `if/else`, `while`, `for`, funções e chamadas; parser que valida os três programas de teste; AST em construção. **Seja específico e honesto** — o professor avalia consistência entre o que foi escrito e o que a equipe responde na hora.
>
> **Todos, segunda 21/09 ou terça 22/09 — briefing de 30 minutos.** Pode ser entrevista com **membros sorteados**, então os cinco precisam saber responder. Matheus lê o formulário preenchido em voz alta para o grupo e cada um tem que conseguir responder, sem consultar: o que o compilador faz, quais fases já existem, o que a nossa parte faz, e o que vem na próxima sprint. Quem não souber, estuda antes da quarta.
>
> **Depois de enviado, não mexam mais.** O professor avisa que não aceita ajuste de última hora.

### Matheus + Israel (dupla, trabalhem juntos)

A divisão: **Israel escreve as ações no `grammar.y`**, **Matheus ajusta `ast.c` conforme aparecer necessidade** e revisa. Façam pelo menos uma sessão de 2 horas lado a lado no começo da semana, porque as 5 primeiras regras definem o padrão de todas as outras.

Israel, o padrão de ação é sempre este:

```c
declaracao_var
    : tipo_var IDENTIFICADOR PONTO_VIRGULA
      {
        $$ = novo_no("decl_var", $2, yylineno);
      }
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao PONTO_VIRGULA
      {
        $$ = novo_no("decl_var", $2, yylineno);
        add_filho($$, $4);
      }
    ;
```

Ordem de ataque, uma por vez, testando a impressão da árvore a cada passo:

1. Declare os `%type <no>` de tudo que devolve nó: `programa lista_statements statement bloco declaracao_var expressao_statement statement_if statement_while statement_for statement_return declaracao_function lista_parametros lista_argumentos for_init expressao`.
2. `expressao` — os literais primeiro: `NUMERO` vira `novo_no("num", ...)`, `IDENTIFICADOR` vira `novo_no("id", $1, ...)`, `STRING`, `TRUE`, `FALSE`, `VAZIO`.
3. `expressao` — os binários. Todos seguem o mesmo molde: `$$ = novo_no("binop", "+", yylineno); add_filho($$, $1); add_filho($$, $3);` — só muda a string do operador.
4. `expressao` — unários (`!`, `-` unário, `++`/`--`), ternário, chamada de função, acesso a membro, índice, parênteses (aqui basta `$$ = $2;`).
5. `declaracao_var`, `expressao_statement`.
6. `statement_if`, `statement_while`, `statement_for`, `statement_return`.
7. `declaracao_function`, `lista_parametros`, `lista_argumentos`.
8. `bloco`, `lista_statements`, `programa`. Em `programa`, guarde em uma global: `raiz = $1;`.

Convenção de nomes de nó que **todos vão usar** — fixem isso num comentário no topo do `ast.h`:

```
programa, bloco, decl_var, expr_stmt, if, while, for, return,
funcao, params, args, chamada, membro, indice,
binop, unop, atribuicao, ternario, num, str, id, bool, null
```

Para `NUMERO`, converta o `double` para texto com `snprintf` antes de guardar no `valor`.

**Pronto quando:** `./compilador < src/3o_codigo.js` imprime a árvore inteira, e ela bate visualmente com o código.

### Jorge — tabela de símbolos (esqueleto, ainda sem usar)

Você não precisa esperar a AST. A tabela é independente.

1. Crie `src/tabela.h`:

```c
typedef struct Simbolo {
    char *nome;
    char *categoria;   /* "variavel" ou "funcao" */
    char *tipo;        /* "num", "str", "bool", "null", "desconhecido" */
    int   constante;   /* 1 se declarado com const */
    int   n_params;    /* só para funcao */
    int   linha;
    struct Simbolo *prox;
} Simbolo;

void      abrir_escopo(void);
void      fechar_escopo(void);
void      inserir(const char *nome, const char *categoria, const char *tipo, int constante, int linha);
Simbolo  *buscar(const char *nome);           /* procura em todos os escopos abertos */
Simbolo  *buscar_escopo_atual(const char *nome);
void      imprimir_tabela(void);
```

2. Implemente em `src/tabela.c` como **pilha de listas encadeadas**: um vetor `Simbolo *escopos[64]` e um `int topo`. `abrir_escopo` faz `topo++`; `fechar_escopo` libera a lista do topo e faz `topo--`; `buscar` varre do topo até o 0; `buscar_escopo_atual` varre só o topo.
3. Escreva `tests/teste_tabela.c` com um `main` que abre 2 escopos, insere símbolos, busca, fecha e imprime. Compile à mão com `gcc src/tabela.c tests/teste_tabela.c -o teste_tabela`.

**Pronto quando:** `./teste_tabela` mostra o comportamento correto de sombreamento (variável do escopo interno esconde a do externo).

### Ruan — esqueleto do gerador

1. Crie `src/gerador.h`:

```c
#include "ast.h"
void gerar_codigo(No *raiz, FILE *saida);
```

2. Em `src/gerador.c`, escreva só a espinha dorsal:

```c
static void indentar(FILE *f, int nivel) {
    for (int i = 0; i < nivel; i++) fprintf(f, "    ");
}

static void gerar_stmt(No *n, FILE *f, int nivel);
static void gerar_expr(No *n, FILE *f);

void gerar_codigo(No *raiz, FILE *f) {
    for (int i = 0; i < raiz->n_filhos; i++)
        gerar_stmt(raiz->filhos[i], f, 0);
}
```

3. Deixe `gerar_stmt` e `gerar_expr` com um `switch`/cadeia de `strcmp` que, por enquanto, só imprime `# TODO: <tipo>` para cada tipo de nó. O objetivo desta semana é o arcabouço, não a tradução.

**Pronto quando:** o gerador compila junto com o resto e imprime uma linha `# TODO` por statement.

### Lucas — completar a suíte e o modo de saída

1. Suba os casos de teste de 6 para 12, cobrindo também: ternário, chamada de função com argumentos, `else if` encadeado, `for` com corpo de várias linhas, string com aspas simples, expressão aritmética com precedência misturada.
2. Combine com o Matheus a interface de linha de comando e documente no `README.md`:
   `./compilador entrada.js -o saida.py`, com `--ast` para imprimir a árvore e `--tokens` para listar tokens.
3. Reescreva o `README.md` (hoje tem 2 linhas) com: o que o projeto faz, como instalar Flex/Bison, `make`, como rodar, como rodar os testes, e os 5 integrantes.

**Pronto quando:** `README.md` está completo e há 12 casos em `tests/casos/`.

---

# SEMANA 3 — 29 de setembro a 5 de outubro
**Objetivo: análise semântica funcionando + primeiras linhas de Python saindo.**

### Jorge — percurso semântico

Agora a AST existe, então a tabela ganha uso.

1. Crie `src/semantica.c` / `.h` com `int analisar(No *raiz);` (devolve número de erros).
2. Escreva a função recursiva `visitar(No *n)` que percorre a árvore. O esqueleto: trate o tipo do nó, depois desça nos filhos.
3. Implemente as verificações **nesta ordem**, uma por dia, testando cada uma antes da próxima:
   - **(a) Variável não declarada:** ao visitar um nó `id` em posição de uso, se `buscar(nome)` devolver `NULL`, reporte `Erro semantico (linha N): variavel 'x' nao declarada`.
   - **(b) Redeclaração:** ao visitar `decl_var`, se `buscar_escopo_atual(nome)` não for `NULL`, reporte erro.
   - **(c) Escopos:** ao entrar num nó `bloco` ou `funcao`, chame `abrir_escopo()`; ao sair, `fechar_escopo()`.
   - **(d) Atribuição a `const`:** guarde a flag na tabela na declaração e verifique em nós `atribuicao`.
   - **(e) Função não declarada e aridade:** em nós `chamada`, confira se existe e se o número de argumentos bate. Exceção: `console.log` é sempre válido.
4. Para (a) funcionar, o Israel precisa que `decl_var` guarde o nome — já guarda. Se faltar alguma informação na árvore, **peça ao Israel em vez de mexer no `grammar.y` você mesmo**.
5. Formato de erro padronizado para todo o grupo: `Erro semantico (linha N): mensagem`. Escreva tudo em `stderr`.

**Pronto quando:** um arquivo de teste com 5 erros propositais (`tests/casos/erros_semanticos.js`) produz exatamente 5 mensagens, nas linhas certas.

### Ruan — expressões em Python

1. Implemente `gerar_expr` de verdade, nesta ordem: `num`, `str`, `id`, `bool`, `null`, `binop`, `unop`, `ternario`, `indice`, `membro`, `chamada`.
2. `binop`: gere `(esquerda OP direita)` com parênteses sempre. É feio, mas é correto e evita erro de precedência. Depois dá para melhorar.
3. Tabela de tradução de operadores (uma função `const char *op_py(const char *op)`): `===` → `==`, `!==` → `!=`, `&&` → `and`, `||` → `or`, `!` → `not `, o resto sai igual.
4. `bool`: `true` → `True`, `false` → `False`. `null` → `None`.
5. `num`: se o valor for inteiro, imprima sem `.0` (senão o Python fica cheio de `5.0`).

**Pronto quando:** um arquivo só com `console.log(...)` de expressões variadas gera Python que roda no `python3` e dá os valores certos.

### Lucas — statements simples em Python

Vocês dois no mesmo arquivo — divida por função. Ruan é dono de `gerar_expr` e suas auxiliares; Lucas é dono de `gerar_stmt` e suas auxiliares. Não editem a função do outro.

1. Em `gerar_stmt`, implemente: `decl_var`, `expr_stmt`, `atribuicao`.
2. `decl_var` com inicialização vira `nome = <expr>`. Sem inicialização, vire `nome = None`.
3. `expr_stmt` imprime a expressão sozinha na linha, com indentação.
4. Tratamento especial de `i++;` e `i--;` como statement: vire `i += 1` / `i -= 1`.
5. Faça `tests/rodar.sh` passar nos casos `01_variaveis` e `02_expressoes`.

**Pronto quando:** 2 dos 12 casos de teste passam de ponta a ponta.

### Matheus — integração e ligação dos módulos

1. Ligue tudo no `main.c`, nesta ordem exata: `yyparse()` → se houve erro sintático, pare → `analisar(raiz)` → se houve erro semântico, pare com código de saída 1 → `gerar_codigo(raiz, saida)`.
2. Implemente as flags de linha de comando combinadas na semana 2 (`-o`, `--ast`, `--tokens`).
3. Adicione ao `Makefile` os novos fontes e um alvo `test:` que roda `tests/rodar.sh`.
4. Revise e faça merge dos PRs da semana. **Na quarta, rode `make clean && make && make test` antes de qualquer merge.**

**Pronto quando:** `make test` roda e mostra o placar de aprovados.

### Israel — ajustes de gramática sob demanda

Esta semana você é o "plantão". Não abra frente nova.

1. Atenda os pedidos de Jorge e Ruan que exigirem informação nova na árvore (ex.: guardar se a declaração era `const`, guardar o nome da função no nó `chamada`).
2. Cada pedido vira um commit pequeno e isolado.
3. Se não houver pedido em algum dia, faça isto: escreva `docs/gramatica_comentada.md` explicando, em português e sem jargão, o que cada regra do `grammar.y` aceita, com um exemplo de código JS por regra. Isso vai salvar o grupo na entrevista final com o professor.

**Pronto quando:** nenhum pedido dos colegas está pendente e o documento avançou.

---

# SEMANA 4 — 6 a 12 de outubro
**Objetivo: controle de fluxo traduzido. Aqui o compilador começa a parecer um compilador.**

> Metade do caminho. O P2 só vem em 04/11, então esta semana é de código puro — mas é aqui que vocês constroem o que vai ser demonstrado lá.

### Lucas — blocos e indentação

Esta é a parte mais delicada do gerador para Python, porque indentação é sintaxe.

1. Escreva a função auxiliar `gerar_bloco(No *n, FILE *f, int nivel)`:
   - se o nó for `bloco`, gere cada filho com `gerar_stmt(filho, f, nivel)`;
   - se o nó **não** for `bloco` (caso do `if (x) y = 1;` sem chaves), gere esse único statement com `nivel`;
   - se o bloco estiver vazio, imprima `pass` com indentação — senão o Python quebra.
2. Implemente `if`: `if <cond>:` + bloco no nível+1. Com `else`, emita `else:` + bloco.
3. Trate `else if`: no seu nó, o `else` cujo filho é outro `if` deve virar `elif <cond>:` no **mesmo nível**, não `else:` seguido de `if` aninhado. Recursivo.
4. Implemente `while`: `while <cond>:` + bloco.

**Pronto quando:** os casos `03_if`, `04_else_if` e `05_while` passam.

### Ruan — o `for`

1. Implemente a tradução geral (a que está no `docs/traducao.md`), que funciona para qualquer `for`:
   ```
   <init>
   while <cond>:
       <corpo>
       <incremento>
   ```
2. Cuidado com dois detalhes: o `<incremento>` entra **no fim do corpo**, no nível de dentro; e o `<init>` sai **antes** do `while`, no nível de fora.
3. Se o `for` tiver `init` vazio ou `cond` vazia, gere `while True:`.
4. Teste com `for` aninhado — é o caso que costuma quebrar a indentação.

**Pronto quando:** o caso `06_for` passa, inclusive com um `for` dentro de outro.

### Jorge — inferência de tipos básica

1. Adicione ao `semantica.c` a função `char *tipo_de(No *expr)` que devolve `"num"`, `"str"`, `"bool"` ou `"desconhecido"`.
2. Regras: literais devolvem seu tipo; `id` consulta a tabela; comparações e lógicos devolvem `"bool"`; aritméticos devolvem `"num"`, **exceto** `+` com algum lado `"str"`, que devolve `"str"`.
3. Ao visitar `decl_var` com inicialização, grave o tipo inferido na tabela.
4. Adicione **um aviso** (não erro): `Aviso (linha N): operacao '-' entre string e numero` para `- * / %` com operando `"str"`.
5. Marque no nó, via um campo novo que você combina com o Matheus, se um `binop` `+` é concatenação de string — o Ruan vai precisar disso na semana 6.

**Pronto quando:** `tipo_de` acerta em um arquivo de teste com 10 expressões de tipos variados.

### Matheus — integração e registro do processo

1. Integração de quarta, como sempre: `make clean && make && make test` antes de qualquer merge.
2. Atualize `docs/sprints.md` marcando o que saiu do planejado nas Semanas 1 a 4. O P2 pede explicitamente *"ajustes no planejamento"* — se você anotar semana a semana, essa resposta já vai estar escrita em novembro. Se deixar para lembrar depois, vai inventar.
3. Revise o `docs/diario.md` do Lucas e complete os problemas de integração que só você viu.
4. Comece o `docs/decisoes.md`: uma seção por escolha técnica, com o formato *decisão → alternativas consideradas → por que essa*. Comece por estas quatro, que são as que o professor mais provavelmente vai questionar: por que C com Flex/Bison; por que AST com nó genérico em vez de nós tipados; por que Python como alvo em vez de assembly; por que o `for` do JS vira `while` no Python.

**Pronto quando:** `docs/decisoes.md` tem as 4 primeiras decisões escritas e a suíte está verde.

### Israel — plantão + `console.log` e `.length`

1. Continue atendendo pedidos de gramática.
2. Implemente no gerador (combine com Ruan, é função nova, sem conflito) o mapeamento de biblioteca: nó `chamada` cujo alvo é `console.log` vira `print`; nó `membro` com nome `length` vira `len(<objeto>)`; `push` vira `append`.
3. Deixe isso numa função separada `int traduzir_builtin(No *n, FILE *f)` que devolve 1 se tratou o caso e 0 se não é builtin — assim o Ruan só chama ela no início de `gerar_expr`.

**Pronto quando:** `console.log("oi")` gera `print("oi")` e passa no teste.

---

# SEMANA 5 — 13 a 19 de outubro
**Objetivo: funções. Fim do gerador na parte principal.**

### Ruan + Lucas — funções

**Ruan:** nó `funcao` → `def nome(p1, p2):` + corpo no nível+1, com `pass` se vazio. Nó `return` → `return <expr>` ou `return` puro.
**Lucas:** nó `chamada` de função do usuário → `nome(arg1, arg2)`. Confira que uma função definida depois de ser chamada ainda funciona em Python (funciona, desde que a chamada esteja dentro de outra função ou depois da definição no nível global — documente essa limitação no `docs/traducao.md`).
**Os dois juntos:** linha em branco antes de cada `def` na saída, para o Python ficar legível.

**Pronto quando:** o caso `07_funcoes` passa e o `.py` gerado roda no `python3` sem erro.

### Jorge — escopo de função e `return`

1. Ao entrar num nó `funcao`: `abrir_escopo()`, inserir os parâmetros como variáveis, visitar o corpo, `fechar_escopo()`.
2. Insira a função na tabela **antes** de abrir o escopo dela (permite recursão).
3. Novo erro: `return` fora de função. Use um contador `profundidade_funcao`.
4. Rode a semântica em todos os 12 casos de teste e conserte falsos positivos. Falso positivo é pior que erro não detectado, porque bloqueia código válido.

**Pronto quando:** os 12 casos passam pela semântica sem nenhum erro falso.

### Matheus — relatório de erros decente

1. Unifique o formato de mensagens (léxico, sintático, semântico) em `src/erros.c`: `void reportar(const char *fase, int linha, const char *fmt, ...)`.
2. Faça o compilador imprimir, no fim, um resumo: `N erros, M avisos`.
3. Implemente a flag `--tabela` que imprime a tabela de símbolos ao fim da análise (o professor costuma pedir isso na entrevista).
4. Integração de quarta.

### Israel — recuperação de erro sintático

1. Adicione regras de erro no `grammar.y` para o parser não morrer no primeiro problema:

```c
statement
    : ...
    | error PONTO_VIRGULA   { $$ = novo_no("erro", NULL, yylineno); yyerrok; }
    ;
```

2. Teste com um arquivo que tenha 3 erros de sintaxe em linhas diferentes: o compilador deve reportar os 3, não só o primeiro.
3. Cuidado: se aparecerem conflitos novos no Bison depois disso, reverta e avise. Não vale a pena quebrar a gramática por isso.

**Pronto quando:** 3 erros de sintaxe geram 3 mensagens.

---

# SEMANA 6 — 20 a 26 de outubro
**Objetivo: fechar as arestas do gerador. A partir daqui é polimento.**

### Ruan — concatenação de string e números

1. Use a marcação que o Jorge criou na semana 4: `binop` `+` marcado como concatenação gera `str(esquerda) + str(direita)` quando um dos lados não é `"str"`.
2. Se o tipo for `"desconhecido"`, envolva em `str()` mesmo assim — é mais seguro.
3. Ajuste a impressão de números: inteiro sai como `5`, fracionário como `5.5`.

### Lucas — todos os 12 casos passando

1. Rode `tests/rodar.sh` e ataque as falhas restantes, uma por uma, da mais simples para a mais complexa.
2. Para cada caso que falhar, decida se o errado é o gerador ou o seu `.py.esperado` — às vezes o esperado é que está errado.
3. Adicione um segundo modo ao `rodar.sh`: além de comparar com o esperado, **executar** a saída com `python3` e conferir que não dá erro em tempo de execução.

**Pronto quando:** 12 de 12 casos passam nos dois modos.

### Jorge — relatório de análise semântica

1. Escreva `docs/semantica.md`: cada verificação implementada, exemplo de código que dispara, e mensagem produzida.
2. Crie `tests/casos/erros/` com um arquivo por tipo de erro (6 arquivos pequenos) e a mensagem esperada ao lado.
3. Estenda o `rodar.sh` (peça ao Lucas) para rodar também esses casos de erro.

### Matheus + Israel — programas de demonstração

1. Escrevam **3 programas JS completos e realistas** que exercitem tudo dentro do escopo: um com laços e matemática (ex.: tabela de multiplicação, Fibonacci), um com funções e recursão (fatorial), um com strings e condicionais.
2. Rodem o compilador neles, rodem o Python gerado, e comparem com a saída do `node` no original. **Os dois têm que imprimir a mesma coisa.**
3. Guardem em `tests/demos/` com o `.js`, o `.py` gerado e a saída esperada.
4. Esses 3 programas são a sua demonstração da entrega final e da entrevista. Tratem com carinho.

**Pronto quando:** os 3 demos produzem saída idêntica em `node` e em `python3`.

---

# SEMANA 7 — 27 de outubro a 2 de novembro
**Objetivo: otimização (o passo opcional do professor) + documentação final + rascunho do P2.**

> O formulário do P2 vence **quarta, 04/11**, que é a primeira semana cheia de novembro. Tudo que for demonstrado lá precisa estar funcionando **até domingo, 01/11**. Esta é a última semana de código novo antes do ponto de controle.

O professor marca otimização como opcional. Vale fazer **duas** otimizações simples e bem documentadas — rende nota e é fácil de explicar na entrevista. Não façam mais que duas.

### Jorge — constant folding

1. Crie `src/otimizador.c` com `No *otimizar(No *n)`, que roda sobre a AST **entre** a semântica e o gerador.
2. Regra: nó `binop` cujos dois filhos são `num` vira um único nó `num` com o resultado calculado. Aplique recursivamente, de baixo para cima (otimize os filhos primeiro).
3. Faça o mesmo para comparações entre dois literais (`2 < 3` vira `bool true`).
4. Conte quantas substituições fez e imprima com a flag `--otimizar -v`.

### Ruan — eliminação de código morto

1. No mesmo `otimizador.c` (funções separadas, você e o Jorge não editam a função do outro): `if (false) { A }` remove o bloco; `if (true) { A }` substitui pelo bloco `A`; `while (false) { A }` remove tudo.
2. Só faça isso **depois** do constant folding rodar, porque `if (2 > 3)` só vira `if false` depois da dobra.
3. Cuidado: se o `if` removido tinha `else`, o `else` vira o corpo.

### Lucas — testes de otimização e regressão

1. Crie 4 casos em `tests/casos/otim/` com o `.py.esperado` já otimizado.
2. Rode a suíte inteira **com e sem** a flag `--otimizar` — os dois modos devem produzir Python que roda e dá o mesmo resultado, apenas com código diferente.
3. Trave isso no `rodar.sh` para rodar automático.

### Matheus — documentação final, parte 1

1. `README.md` definitivo: descrição, dependências, `make`, uso, exemplos de entrada/saída lado a lado, limitações conhecidas, integrantes.
2. `docs/arquitetura.md`: diagrama das fases, qual arquivo faz o quê, e como o dado flui (tokens → AST → tabela → AST otimizada → Python).
3. Confirme que o professor (`sergioaafreitas` / `sergiofreitas@unb.br`) está como colaborador no repositório. Se ainda não estiver, adicione hoje.
4. **Rascunhe o formulário do P2 até domingo 01/11** (https://forms.office.com/r/gNG6Eb7e71), com os três itens que ele pede:
   - *Funcionalidades principais desenvolvidas*: liste as fases completas — léxico, sintático com recuperação de erro, AST, tabela de símbolos com escopos, 6 verificações semânticas, inferência básica de tipos, gerador de Python, 2 otimizações. Cite números concretos: quantos tokens, quantas produções, quantos casos de teste passando.
   - *Melhorias desde o P1*: em setembro o compilador só validava sintaxe; agora traduz JavaScript para Python executável de ponta a ponta. Esse é o seu argumento mais forte — deixe explícito.
   - *Ajustes no planejamento*: tire de `docs/sprints.md` o que mudou de rota e por quê. Ajuste admitido e justificado conta a favor; planejamento que "deu tudo certo" soa falso.
5. Grave o vídeo da demo (os 3 programas da Semana 6: `.js` entra, AST aparece, `.py` sai e roda no `python3`). Demo ao vivo que falha é a forma mais comum de perder nota em ponto de controle.

### Israel — documentação final, parte 2

1. Termine `docs/gramatica_comentada.md`.
2. Escreva `docs/limitacoes.md`: tudo que está fora do escopo (a lista que te passei na conversa) com uma linha explicando por quê. Demonstra decisão consciente, não esquecimento — isso conta ponto na entrevista.

---

# SEMANA 8 — 3 a 9 de novembro
**Objetivo: P2 e congelamento de funcionalidades.**

> ## 🔴 P2 — formulário vence quarta, 04/11, 23h59
>
> **Matheus, terça-feira 03/11:** envie o formulário (https://forms.office.com/r/gNG6Eb7e71) a partir do rascunho de domingo. De novo, um dia de folga antes do prazo.
>
> **Todos, segunda 02/11 — briefing de 45 minutos.** Igual ao do P1, e de novo porque pode cair entrevista com membros sorteados. Matheus lê as respostas enviadas e cada um precisa conseguir responder, sem consultar:
> - o que o compilador faz hoje, de ponta a ponta, em 3 frases;
> - quais fases existem e em que arquivo cada uma vive;
> - o que a **sua** parte faz e uma decisão técnica que você tomou nela;
> - o que mudou desde setembro;
> - qual é a maior limitação e por que ela foi aceita.
>
> Nesse briefing, rodem a demo uma vez inteira na frente do grupo. Se quebrar, vocês descobrem na segunda e não na quarta.
>
> **Depois de enviado, não mexam mais no formulário.**

### Segunda-feira, todos juntos — congelamento
1. **Segunda 02/11 é o congelamento de funcionalidades.** Daqui até o fim, só correção de bug e documentação. Nada de ideia nova.
2. Rodem `make clean && make && make test` do zero, se possível numa máquina que não seja a do Matheus.
3. Listem todos os bugs abertos numa issue única do GitHub, ordenados por gravidade.
4. Distribuam: cada um pega os bugs da sua área.

### Quinta a domingo — caça a bugs por área

**Matheus** — fecha os merges, mantém a `main` verde, atualiza `docs/sprints.md` com o resultado real das Semanas 5 a 8.
**Israel** — bugs de gramática e de construção da AST; confere se `docs/gramatica_comentada.md` bate com o `grammar.y` final.
**Jorge** — bugs de semântica e de otimização; garante que **nenhum programa válido é rejeitado** (falso positivo é o pior defeito que vocês podem levar para a entrevista).
**Ruan** — bugs do gerador; roda todo Python gerado no `python3` de novo, um por um.
**Lucas** — suíte 100% verde a partir de um `git clone` limpo; `tests/rodar.sh` funcionando sem depender de nada da máquina de ninguém.

**Pronto quando:** formulário enviado, P2 apresentado, e clone limpo → `make` → `make test` → tudo verde.

---

# SEMANA 9 — 10 a 16 de novembro
**Objetivo: entrega final no GitHub + preparação para a entrevista.**

> ## 🔴 Entrega final — a regra dos 15 dias
>
> O professor declara que **só abre o repositório na entrega final, 15 dias antes da entrevista**. Duas consequências práticas:
>
> 1. **Contem para trás a partir da data da entrevista da sua equipe** (está no calendário da turma). Marquem esse dia no grupo agora, na Semana 1, e não na véspera. Se a entrevista for, por exemplo, no fim de novembro, a `main` precisa estar definitiva por volta de **13/11**.
> 2. **O que estiver na `main` naquele dia é a nota de código e de documentação.** Commit posterior não conta a favor e chama atenção para o contrário.
>
> **Matheus, na data de corte:** `git tag v1.0`, faz a entrega no Teams no formato que o professor pedir, e confirma que o repositório está acessível. Depois disso, PR só para bug crítico.
>
> **Checklist do que precisa estar na `main` nesse dia:** `README.md` completo · `docs/linguagem.md` · `docs/gramatica_comentada.md` · `docs/arquitetura.md` · `docs/decisoes.md` · `docs/sprints.md` · `docs/diario.md` · `docs/traducao.md` · `docs/semantica.md` · `docs/limitacoes.md` · `tests/` com a suíte verde · os 3 demos.

O professor pergunta detalhes específicos e **cada membro precisa saber explicar o projeto inteiro**, não só a parte dele. Essa é a semana em que isso se resolve.

### Segunda e terça — rodízio de explicações
Cada um apresenta a **parte de outro** para o grupo, por 10 minutos:
- Matheus explica a semântica (parte do Jorge)
- Israel explica o gerador (parte do Ruan)
- Jorge explica a AST e o parser (parte do Israel)
- Ruan explica a otimização (parte do Jorge)
- Lucas explica a arquitetura geral (parte do Matheus)

Quem for dono da parte corrige na hora. Esse exercício expõe exatamente os buracos que o professor vai encontrar.

### Quarta — simulado de entrevista
Matheus faz as perguntas difíceis para cada um:
- Por que vocês escolheram Flex e Bison?
- O que é o conflito shift/reduce que aparece e por que vocês o deixaram lá?
- Como a precedência de operadores está resolvida na gramática?
- Como vocês resolveram a indentação do Python, que é significativa?
- O que acontece se eu declarar a mesma variável duas vezes?
- Por que o `for` do JS virou `while` no Python?
- Qual a maior limitação do compilador de vocês e por quê?

Se alguém não souber responder alguma, essa pessoa escreve a resposta no `docs/faq.md` e apresenta na quinta.

### Quinta e sexta
Reserva. Ajustes finais de qualquer pendência apontada na entrevista.

---

## Resumo em uma linha por semana

| Semana | Foco | Marco |
|---|---|---|
| 1 (15–21/9) | Valores nos tokens, esqueleto da AST, Makefile, docs pendentes | `make` funciona · rascunho do P1 pronto |
| 2 (22–28/9) | Construção completa da AST + tabela de símbolos | **🔴 P1: formulário até 23/09** (enviar 22/09) · árvore imprime |
| 3 (29/9–5/10) | Semântica + primeiras linhas de Python | 2 testes passam |
| 4 (6–12/10) | `if`/`while`/`for` + indentação | 6 testes passam |
| 5 (13–19/10) | Funções, escopos, erros decentes | 9 testes passam |
| 6 (20–26/10) | Fechamento do gerador + 3 demos | 12/12 testes passam |
| 7 (27/10–2/11) | Otimização + documentação + rascunho do P2 | compilador completo em 01/11 |
| 8 (3–9/11) | P2, congelamento, caça a bugs | **🔴 P2: formulário até 04/11** (enviar 03/11) |
| 9 (10–16/11) | Entrega final no GitHub + preparação da entrevista | `v1.0` entregue, repositório congelado |


