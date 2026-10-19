# BISON

Flex quebra o texto em tokens, Bison decide se a sequência forma uma "frase"
válida — ou seja, gramática / sintaxe.

Ele é o `.y`.

## Estrutura do arquivo

Também tem três seções, mas separadas por **dois** `%%` (não um pra cada item da
lista — os includes e as declarações ficam juntos na primeira seção):

```
%{
    includes do C que serão usados
%}

seção de declarações
(lista de tokens que vêm do flex — ponto de encontro dos dois arquivos,
via parser.tab.h)

%%
regras da gramática
%%
código C auxiliar
```

> ⚠️ Pequeno ajuste: são 3 seções, mas só 2 `%%` no arquivo. O bloco de includes
> (`%{ %}`) e a seção de declarações (`%token`, `%left`...) ficam **juntos**,
> antes do primeiro `%%` — não são duas seções separadas por `%%`.

**Esquema de como Flex e Bison se conectam:**

```
 lexico.l                          parser.y
┌─────────────────┐   gera    ┌──────────────────┐
│ #include         │◄──────── │ %token LET ...    │
│ "parser.tab.h"   │           │ %token NUMERO ... │
│                  │           └──────────────────┘
│ "let" { return LET; }               │
│ [0-9]+ { return NUMERO; }           │ bison -d parser.y
└─────────────────┘                   ▼
                              parser.tab.h + parser.tab.c
                              (números de cada token)
```

Bison gera dois arquivos: o parser propriamente dito (`parser.tab.c`) e o header
`parser.tab.h`, com os números de cada token. O Flex só precisa incluir o header
pra saber qual número retornar em cada `return`.

Basicamente, o header existe pra fazer a comunicação: ele diz pro Flex qual
número retornar pra cada token, e quem gera esse header é o Bison.

## Primeiro exemplo

```c
declaracao_variavel:                              /* isso é um não-terminal */
    LET IDENTIFICADOR ATRIBUICAO NUMERO PONTO_VIRGULA
    ;                                    /* sintaxe pra dizer: acabou a regra */
```

Só que isso só funciona caso **não** seja outra variável e **não** seja uma
expressão numérica — ou seja, só cobre atribuir um número fixo (`let x = 10;`).
Não cobre `let x = y;` nem `let r = 10 + 5;`.

## Terminal x Não-terminal

- **Terminal** — token que vem direto do Flex, não dá pra "quebrar" mais.
- **Não-terminal** — regra que eu defino na gramática, feita a partir desses
  e/ou de outros não-terminais.

Pra generalizar a `declaracao_variavel`, criamos um não-terminal `expressao` que
descreve tudo que poderia vir depois do igual:

```c
expressao:
      NUMERO
    | IDENTIFICADOR
    | expressao ADICAO expressao
    | expressao SUBTRACAO expressao
    | expressao MULTIPLICACAO expressao
    | expressao DIVISAO expressao
    ;
```

No caso, a expressão tem que ser número ou identificador; o resto está só
falando que pode ter no meio adição, subtração, multiplicação e divisão.

## Prioridade de operadores

E quanto à prioridade — multiplicação > adição, por exemplo? Fica na seção de
declarações, junto com os tokens:

```c
%left ADICAO SUBTRACAO
%left MULTIPLICACAO DIVISAO
```

**Quanto mais depois, mais prioridade.**

`%left` significa "associativo à esquerda", resolve empates entre operadores de
mesma prioridade (ex: `10 - 5 - 2` vira `(10 - 5) - 2`).

**Esquema — como `10 + 5 * 2` fica com a precedência aplicada:**

```
        +
       / \
     10   *
         / \
        5   2
```
(o `*` "gruda" primeiro no 5 e no 2, porque tem prioridade maior que o `+`
pendente — por isso o resultado é `10 + (5*2)`, não `(10+5) * 2`)

## Ações semânticas

Cada regra do Bison pode ter um código em C que roda quando a regra é
reconhecida.

- `$$` → o valor do não-terminal que está sendo construído (lado esquerdo da
  regra)
- `$1`, `$2`, `$3`... → o valor de cada símbolo do lado direito da regra, na
  ordem em que aparecem

> ⚠️ Correção: a posição **começa do 1**, não do zero. `$1` é o primeiro símbolo
> do lado direito, `$2` o segundo, e assim por diante — não existe `$0` nesse
> sentido de posição.

```c
expressao:
      NUMERO                              { $$ = $1; }
    | expressao ADICAO expressao          { $$ = $1 + $3; }
    | expressao SUBTRACAO expressao       { $$ = $1 - $3; }
    | expressao MULTIPLICACAO expressao   { $$ = $1 * $3; }
    | expressao DIVISAO expressao         { $$ = $1 / $3; }
    ;
```

O `+` conta como símbolo (seria o `$2`), mas não carrega valor, por isso não
usamos ele.

**Esquema — de onde vem cada `$N` na regra `expressao ADICAO expressao`:**

```
expressao   ADICAO   expressao
    │           │         │
   $1          $2        $3     ($2 existe mas não é usado)
```

## Union e tipos

Mas e pra ele saber se é realmente `int` ou `float`, e não `string` ou `struct`?
Na seção de declarações, `%union` e `%type`:

```c
%union {
    int ival;
}                          /* valores possíveis que um token/regra pode carregar */

%token <ival> NUMERO       /* o token NUMERO carrega um valor ival (int) */
%type <ival> expressao     /* diz que expressao produz um ival */
```

E o Flex precisa preencher esse valor — o token `NUMERO` chega como texto "10"
(`yytext`). Pra virar realmente o int dentro do `$1`, o `.l` precisa converter e
guardar numa variável especial chamada `yylval`:

```c
[0-9]+ { yylval.ival = atoi(yytext); return NUMERO; }
                                     /* converte string pra int */
```

## Árvore Sintática Abstrata (AST)

Pra traduzir uma expressão numérica de JS pra Python, não queremos **calcular**
a expressão — queremos **guardar** ela pra depois gerar o código Python
equivalente.

Em vez de cada regra devolver um `int`, ela devolve um ponteiro pra um "nó" que
representa aquele pedaço de código:

```c
%union {
    int ival;
    No* no;
}

%token <ival> NUMERO
%type <no> expressao

%%

expressao:
      NUMERO                          { $$ = cria_no_numero($1); }
    | expressao ADICAO expressao      { $$ = cria_no_soma($1, $3); }
    ;
```

Trocamos "calcular soma" por "criar nó que represente a soma".

**Esquema — `10 + 5 * 2` como árvore (nenhuma conta é feita ainda nesse ponto):**

```
              SOMA
             /    \
       NUMERO(10)  MULTIPLICACAO
                     /          \
               NUMERO(5)      NUMERO(2)
```

Essa árvore é o que sobra depois do parsing. Uma função separada percorre ela
depois (fora da gramática) pra gerar o texto Python equivalente — essa é a fase
de geração de código, que roda depois que o Bison termina de montar tudo.