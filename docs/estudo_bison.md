# Estudo Dirigido: Bison Aplicado ao Projeto JavaScript → Python

**Disciplina:** Compiladores 1

**Contexto:** Material de estudo do grupo para a etapa de análise sintática do compilador JS → Python

---

## Sumário

1. [O que é o Bison](#1-o-que-é-o-bison)
2. [Bison no Pipeline do Projeto](#2-bison-no-pipeline-do-projeto)
3. [Conceitos Fundamentais](#3-conceitos-fundamentais)
4. [Estrutura de um Arquivo .y](#4-estrutura-de-um-arquivo-y)
5. [Integração com o Flex](#5-integração-com-o-flex)
6. [Gramática Subconjunto de JavaScript](#6-definindo-a-gramática-do-nosso-subconjunto-de-javascript)
7. [Construindo a AST durante o Parsing](#7-construindo-a-ast-durante-o-parsing)
8. [Precedência e Associatividade de Operadores](#8-precedência-e-associatividade-de-operadores)
9. [Tratamento de Ambiguidades e Conflitos](#9-tratamento-de-ambiguidades-e-conflitos)

---

## 1. O que é o Bison

**Bison** é um gerador de analisadores sintáticos (*parser generator*). A partir de uma gramática livre de contexto (GLC) escrita pelo desenvolvedor, o Bison produz automaticamente código C que implementa um parser capaz de reconhecer se uma sequência de tokens é válida segundo essa gramática — e, no processo, executar ações associadas a cada regra (como construir uma árvore sintática).

Ele é o sucessor direto do **Yacc** ("Yet Another Compiler Compiler") e mantém compatibilidade com ele, sendo amplamente usado no ensino de compiladores por sua integração natural com o Flex.

**Por que o Bison é relevante para o nosso projeto:** depois que o Flex converte o código JavaScript em uma sequência de tokens, é o Bison quem verifica se essa sequência forma um programa JavaScript sintaticamente válido (dentro do nosso subconjunto) e organiza essa informação em uma estrutura de dados — a AST — que será usada nas etapas seguintes (análise semântica e geração de código Python).

---

## 2. Bison no Pipeline do Projeto

```
Código-fonte JS
      │
      ▼
  [ FLEX ]  →  fluxo de tokens (IDENTIFIER, NUMBER, IF,...)
      │
      ▼
  [ BISON ] →  valida a gramática + monta a AST
      │
      ▼
Análise Semântica → Geração de código Python
```

O Bison **não lê o código-fonte diretamente**. Ele consome os tokens que o Flex produz, um a um, chamando repetidamente a função de análise léxica (`yylex()`) sempre que precisa do próximo token.

---

## 3. Conceitos Fundamentais

| Conceito | Definição | Relação com o projeto |
|---|---|---|
| **Gramática livre de contexto (GLC)** | Conjunto de regras de produção que definem como símbolos podem ser combinados | Vamos definir a gramática do nosso subconjunto de JS |
| **Símbolo terminal** | Um token vindo do Flex (ex: `IF`, `NUMBER`, `PLUS`) | Definidos em conjunto com o dicionário de tokens do Flex |
| **Símbolo não-terminal** | Uma regra da gramática, construída a partir de outros símbolos (ex: `expressao`, `comando`) | Representam construções da linguagem, como `if`, laços, expressões |
| **Regra de produção** | Define como um não-terminal pode ser formado (ex: `comando : IF '(' expressao ')' bloco`) | Cada construção sintática de JS vira uma ou mais regras |
| **Símbolo inicial (start symbol)** | O não-terminal que representa um programa completo | No nosso caso, algo como `programa` |
| **Parser LALR(1)** | Algoritmo usado pelo Bison: lê a entrada da esquerda para a direita, produz derivação mais à direita, com 1 token de lookahead | Explica por que certas construções geram conflitos |
| **Ação semântica** | Código C executado quando uma regra é reconhecida | Construção de nós da AST |

---

## 4. Estrutura de um Arquivo .y

Um arquivo de gramática do Bison (extensão `.y`) segue a estrutura:

```c
%{
/* Seção de código C: includes, protótipos, includes da AST */
#include <stdio.h>
#include "ast.h"

int yylex(void);
void yyerror(const char *s);
%}

/* Declarações do Bison: tipos, tokens, precedência */
%union {
    int num;
    char *str;
    NoAST *no;
}

%token <num> NUMBER
%token <str> IDENTIFIER
%token IF ELSE WHILE FOR FUNCTION VAR LET CONST RETURN
%token PLUS MINUS TIMES DIVIDE ASSIGN
%token LBRACE RBRACE LPAREN RPAREN SEMICOLON

%type <no> expressao comando bloco programa

%left PLUS MINUS
%left TIMES DIVIDE

%%

/* Seção de regras gramaticais */
programa:
    comandos { $$ = $1; raiz = $$; }
    ;

comandos:
    comandos comando { $$ = adicionarComando($1, $2); }
    | /* vazio */     { $$ = criarListaComandos(); }
    ;

comando:
    IF LPAREN expressao RPAREN bloco { $$ = criarNoIf($3, $5, NULL); }
    | expressao SEMICOLON            { $$ = $1; }
    ;

expressao:
    expressao PLUS expressao  { $$ = criarNoBinario('+', $1, $3); }
    | NUMBER                  { $$ = criarNoNumero($1); }
    | IDENTIFIER               { $$ = criarNoIdentificador($1); }
    ;

%%

/* Seção de código C adicional: main, yyerror, etc. */
void yyerror(const char *s) {
    fprintf(stderr, "Erro sintático: %s\n", s);
}
```

**As três seções são separadas por `%%`:**

1. **Definições** (antes do primeiro `%%`): includes, `%union`, declarações de tokens (`%token`), tipos (`%type`), precedência.
2. **Regras** (entre os dois `%%`): a gramática propriamente dita, com ações semânticas em C entre chaves `{ }`.
3. **Código do usuário** (após o segundo `%%`): funções auxiliares, `main()`, `yyerror()`.

---

## 5. Integração com o Flex

O Flex e o Bison se comunicam por meio de convenções compartilhadas:

- O Flex retorna códigos de token (definidos automaticamente pelo Bison em `y.tab.h` ou `parser.tab.h`, gerado a partir das declarações `%token`).
- Quando o token carrega um valor semântico (como o número de um `NUMBER` ou o texto de um `IDENTIFIER`), esse valor é passado através da variável global `yylval`, que tem o tipo definido pela `%union`.

**Fluxo típico:**

```c
/* No arquivo .l (Flex) */
[0-9]+ {
    yylval.num = atoi(yytext);
    return NUMBER;
}

[a-zA-Z_][a-zA-Z0-9_]* {
    yylval.str = strdup(yytext);
    return IDENTIFIER;
}
```

```c
/* No arquivo .y (Bison), já declarado: */
%union {
    int num;
    char *str;
}
%token <num> NUMBER
%token <str> IDENTIFIER
```
---

## 6. Gramática Subconjunto de JavaScript

Com base no escopo definido no documento inicial do projeto, um exemplo de gramática:

| Construção JS | Esboço de regra Bison |
|---|---|
| Declaração de variável | `VAR IDENTIFIER ASSIGN expressao SEMICOLON` |
| Estrutura condicional | `IF LPAREN expressao RPAREN bloco (ELSE bloco)?` |
| Laço `while` | `WHILE LPAREN expressao RPAREN bloco` |
| Laço `for` | `FOR LPAREN comando expressao SEMICOLON expressao RPAREN bloco` |
| Declaração de função | `FUNCTION IDENTIFIER LPAREN parametros RPAREN bloco` |
| Chamada de função | `IDENTIFIER LPAREN argumentos RPAREN` |
| Expressões aritméticas/lógicas | Regras recursivas com precedência (ver seção 8) |
| Bloco de comandos | `LBRACE comandos RBRACE` |

---

## 7. Construindo a AST durante o Parsing

A cada regra reconhecida, a ação semântica correspondente deve montar um nó da árvore sintática abstrata, geralmente definida separadamente em C (ex: `ast.h` / `ast.c`).

**Exemplo de estrutura de nó:**

```c
typedef enum {
    NO_NUMERO,
    NO_IDENTIFICADOR,
    NO_BINARIO,
    NO_IF,
    NO_ATRIBUICAO,
    NO_BLOCO
} TipoNo;

typedef struct NoAST {
    TipoNo tipo;
    union {
        int valorNumero;
        char *nomeIdentificador;
        struct { char operador; struct NoAST *esq, *dir; } binario;
        struct { struct NoAST *condicao, *entao, *senao; } noIf;
    } dados;
} NoAST;
```

---

## 8. Precedência e Associatividade de Operadores

Um dos pontos mais importantes ao traduzir expressões é garantir que `2 + 3 * 4` seja interpretado como `2 + (3 * 4)`, e não `(2 + 3) * 4`. Isso é resolvido no Bison por meio das declarações de precedência, na seção de definições:

```c
%left PLUS MINUS      /* menor precedência */
%left TIMES DIVIDE
%right ASSIGN         /* associatividade à direita */
%nonassoc EQ NEQ LT GT /* operadores relacionais não associam entre si */
```

- **`%left`**: o operador é associativo à esquerda (`a - b - c` = `(a - b) - c`).
- **`%right`**: associativo à direita (útil para atribuição: `a = b = c` = `a = (b = c)`).
- **`%nonassoc`**: o operador não pode ser encadeado (`a < b < c` gera erro).
- A **ordem das linhas** define a precedência: linhas mais abaixo têm precedência maior.

Tem relevância no projeto porque JavaScript e Python compartilham, em grande parte, as mesmas regras de precedência aritmética — mas vale checar operadores específicos (como `**` de potência em Python, que tem tratamento próprio).

---

## 9. Tratamento de Ambiguidades e Conflitos

Ao rodar o Bison, é comum receber avisos como:

```
conflicts: 3 shift/reduce, 1 reduce/reduce
```

**Shift/Reduce:** ocorre quando o parser não sabe se deve "empilhar" o próximo token (*shift*) ou "fechar" uma regra já reconhecida (*reduce*). O exemplo clássico é o **dangling else**:

```
if (a) if (b) c(); else d();
```

Não fica claro, sem uma regra explícita, a qual `if` o `else` pertence. O Bison, por padrão, resolve isso preferindo o *shift* (associando o `else` ao `if` mais próximo), o que coincide com o comportamento padrão de JavaScript — então normalmente não é necessário nenhum tratamento adicional.

**Reduce/Reduce:** geralmente indica um problema mais sério na gramática (duas regras diferentes podem reduzir a mesma sequência de símbolos) e costuma exigir reestruturação das regras.


---
