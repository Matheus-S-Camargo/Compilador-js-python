%code requires{
    #include "ast.h"
}

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "ast.h"

int yylex(void);
extern int yylineno;
void yyerror(const char *s);

No *raiz = NULL;

static No *criar_binop(const char *op, No *esq, No *dir) {
    No *no = novo_ponteiro("binop", op, yylineno);
    adicionar_filho(no, esq);
    adicionar_filho(no, dir);
    return no;
}

static No *criar_atribuicao(const char *op, No *alvo, No *valor) {
    No *no = novo_ponteiro("atribuicao", op, yylineno);
    adicionar_filho(no, alvo);
    adicionar_filho(no, valor);
    return no;
}

static No *criar_unop(const char *op, No *filho) {
    No *no = novo_ponteiro("unop", op, yylineno);
    adicionar_filho(no, filho);
    return no;
}

static void anexar_argumentos(No *chamada, No *args) {
    if (!args) return;
    for (int i = 0; i < args->contador_filhos; i++) {
        adicionar_filho(chamada, args->filhos[i]);
    }
    free(args->filhos);
    free(args->tipo);
    free(args->valor);
    free(args);
}
%}

%union {
    char *str;
    No *no;
}

/* ===== Palavras reservadas ===== */
%token LET CONST VAR FUNCTION
%token TRUE FALSE VAZIO
%token IF ELSE WHILE FOR RETORNO

/* ===== Delimitadores ===== */
%token ABRE_PARENTESES FECHA_PARENTESES
%token ABRE_CHAVES FECHA_CHAVES
%token ABRE_COLCHETES FECHA_COLCHETES
%token PONTO_VIRGULA VIRGULA PONTO DOIS_PONTOS INTERROGACAO

/* ===== Operadores aritméticos ===== */
%token ADICAO SUBTRACAO MULTIPLICACAO DIVISAO RESTO_DIVISAO
%token INCREMENTO DECREMENTO

/* ===== Atribuição ===== */
%token ATRIBUICAO MAIS_IGUAL MENOS_IGUAL
%token MULTIPLICACAO_IGUAL DIVISAO_IGUAL RESTO_IGUAL

/* ===== Relacionais ===== */
%token IGUALDADE DIFERENTE IGUALDADE_ESTRITA DIFERENCA_ESTRITA
%token MENOR MAIOR MENOR_IGUAL MAIOR_IGUAL

/* ===== Lógicos ===== */
%token AND OR NEGACAO

/* ===== Literais e identificadores ===== */
%token <str> IDENTIFICADOR NUMERO STRING

/* ===== Tipos dos não-terminais ===== */
%type <no> programa lista_statements statement bloco
%type <no> declaracao_var expressao_statement statement_if statement_while
%type <no> statement_for for_init statement_return declaracao_function
%type <no> lista_parametros lista_argumentos expressao
%type <no> parametros_nao_vazios argumentos_nao_vazios
%type <str> tipo_var

/* Liberar valores descartados pelo parser em erros.
   tipo_var usa literais; programa entrega sua arvore a raiz. */
%destructor { free($$); } IDENTIFICADOR NUMERO STRING
%destructor { if ($$) liberar_ast($$); } <no>
%destructor { } programa

/* ===== Precedência e associatividade (da menor para a maior) ===== */
%precedence IF_SEM_ELSE
%precedence ELSE
%right ATRIBUICAO MAIS_IGUAL MENOS_IGUAL MULTIPLICACAO_IGUAL DIVISAO_IGUAL RESTO_IGUAL
%right INTERROGACAO DOIS_PONTOS
%left OR
%left AND
%left IGUALDADE DIFERENTE IGUALDADE_ESTRITA DIFERENCA_ESTRITA
%left MENOR MAIOR MENOR_IGUAL MAIOR_IGUAL
%left ADICAO SUBTRACAO
%left MULTIPLICACAO DIVISAO RESTO_DIVISAO
%right NEGACAO
%right INCREMENTO DECREMENTO
%left ABRE_PARENTESES ABRE_COLCHETES PONTO

%%

/* ===== Estrutura geral ===== */
programa
    : lista_statements {
        raiz = $1;
        $$ = $1;
    }
    ;

lista_statements
    : /* vazio */ {
        $$ = novo_ponteiro("lista_statements", NULL, yylineno);
    }
    | lista_statements statement {
        if ($2 != NULL) {
            adicionar_filho($1, $2);
        }
        $$ = $1;
    }
    ;

statement
    : declaracao_var      { $$ = $1; }
    | expressao_statement { $$ = $1; }
    | statement_if        { $$ = $1; }
    | statement_while     { $$ = $1; }
    | statement_for       { $$ = $1; }
    | statement_return    { $$ = $1; }
    | declaracao_function { $$ = $1; }
    | bloco               { $$ = $1; }
    ;

bloco
    : ABRE_CHAVES lista_statements FECHA_CHAVES {
        free($2->tipo);
        $2->tipo = strdup("bloco");
        $$ = $2;
    }
    ;

/* ===== Declaração de variáveis: let/const/var ID (= expr)? ; ===== */
declaracao_var
    : tipo_var IDENTIFICADOR PONTO_VIRGULA {
        $$ = novo_ponteiro("decl_var", $2, yylineno);
        free($2);
    }
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao PONTO_VIRGULA {
        $$ = novo_ponteiro("decl_var", $2, yylineno);
        adicionar_filho($$, $4);
        free($2);
    }
    ;

tipo_var
    : LET   { $$ = "let"; }
    | CONST { $$ = "const"; }
    | VAR   { $$ = "var"; }
    ;

/* ===== Expressão como statement (ex: chamada de função, atribuição solta) ===== */
expressao_statement
    : expressao PONTO_VIRGULA {
        $$ = $1;
    }
    ;

/* ===== if / else ===== */
statement_if
    : IF ABRE_PARENTESES expressao FECHA_PARENTESES statement %prec IF_SEM_ELSE {
        $$ = novo_ponteiro("if", NULL, yylineno);
        adicionar_filho($$, $3);
        adicionar_filho($$, $5);
    }
    | IF ABRE_PARENTESES expressao FECHA_PARENTESES statement ELSE statement {
        $$ = novo_ponteiro("if", NULL, yylineno);
        adicionar_filho($$, $3);
        adicionar_filho($$, $5);
        adicionar_filho($$, $7);
    }
    ;

/* ===== while ===== */
statement_while
    : WHILE ABRE_PARENTESES expressao FECHA_PARENTESES statement {
        $$ = novo_ponteiro("while", NULL, yylineno);
        adicionar_filho($$, $3);
        adicionar_filho($$, $5);
    }
    ;

/* ===== for (init; condicao; incremento) statement ===== */
statement_for
    : FOR ABRE_PARENTESES for_init PONTO_VIRGULA expressao PONTO_VIRGULA expressao FECHA_PARENTESES statement {
        $$ = novo_ponteiro("for", NULL, yylineno);
        if ($3 != NULL) {
            adicionar_filho($$, $3);
        }
        adicionar_filho($$, $5);
        adicionar_filho($$, $7);
        adicionar_filho($$, $9);
    }
    ;

for_init
    : /* vazio */ {
        $$ = NULL;
    }
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao {
        $$ = novo_ponteiro("decl_var", $2, yylineno);
        adicionar_filho($$, $4);
        free($2);
    }
    | expressao {
        $$ = $1;
    }
    ;

/* ===== return ===== */
statement_return
    : RETORNO PONTO_VIRGULA {
        $$ = novo_ponteiro("return", NULL, yylineno);
    }
    | RETORNO expressao PONTO_VIRGULA {
        $$ = novo_ponteiro("return", NULL, yylineno);
        adicionar_filho($$, $2);
    }
    ;

/* ===== function nome(parametros) { corpo } ===== */
declaracao_function
    : FUNCTION IDENTIFICADOR ABRE_PARENTESES lista_parametros FECHA_PARENTESES bloco {
        $$ = novo_ponteiro("function", $2, yylineno);
        adicionar_filho($$, $4);
        adicionar_filho($$, $6);
        free($2);
    }
    ;

lista_parametros
    : /* vazio */ {
        $$ = novo_ponteiro("params", NULL, yylineno);
    }
    | parametros_nao_vazios { $$ = $1; }
    ;

parametros_nao_vazios
    : IDENTIFICADOR {
        $$ = novo_ponteiro("params", NULL, yylineno);
        adicionar_filho($$, novo_ponteiro("id", $1, yylineno));
        free($1);
    }
    | parametros_nao_vazios VIRGULA IDENTIFICADOR {
        adicionar_filho($1, novo_ponteiro("id", $3, yylineno));
        free($3);
        $$ = $1;
    }
    ;

/* ===== Expressões ===== */
expressao
    : expressao ATRIBUICAO expressao          { $$ = criar_atribuicao("=", $1, $3); }
    | expressao MAIS_IGUAL expressao          { $$ = criar_atribuicao("+=", $1, $3); }
    | expressao MENOS_IGUAL expressao         { $$ = criar_atribuicao("-=", $1, $3); }
    | expressao MULTIPLICACAO_IGUAL expressao { $$ = criar_atribuicao("*=", $1, $3); }
    | expressao DIVISAO_IGUAL expressao       { $$ = criar_atribuicao("/=", $1, $3); }
    | expressao RESTO_IGUAL expressao         { $$ = criar_atribuicao("%=", $1, $3); }
    | expressao OR expressao                  { $$ = criar_binop("||", $1, $3); }
    | expressao AND expressao                 { $$ = criar_binop("&&", $1, $3); }
    | expressao IGUALDADE expressao           { $$ = criar_binop("==", $1, $3); }
    | expressao DIFERENTE expressao           { $$ = criar_binop("!=", $1, $3); }
    | expressao IGUALDADE_ESTRITA expressao   { $$ = criar_binop("===", $1, $3); }
    | expressao DIFERENCA_ESTRITA expressao   { $$ = criar_binop("!==", $1, $3); }
    | expressao MENOR expressao               { $$ = criar_binop("<", $1, $3); }
    | expressao MAIOR expressao               { $$ = criar_binop(">", $1, $3); }
    | expressao MENOR_IGUAL expressao         { $$ = criar_binop("<=", $1, $3); }
    | expressao MAIOR_IGUAL expressao         { $$ = criar_binop(">=", $1, $3); }
    | expressao ADICAO expressao              { $$ = criar_binop("+", $1, $3); }
    | expressao SUBTRACAO expressao           { $$ = criar_binop("-", $1, $3); }
    | expressao MULTIPLICACAO expressao       { $$ = criar_binop("*", $1, $3); }
    | expressao DIVISAO expressao             { $$ = criar_binop("/", $1, $3); }
    | expressao RESTO_DIVISAO expressao       { $$ = criar_binop("%", $1, $3); }
    | expressao INTERROGACAO expressao DOIS_PONTOS expressao {
        $$ = novo_ponteiro("ternario", NULL, yylineno);
        adicionar_filho($$, $1);
        adicionar_filho($$, $3);
        adicionar_filho($$, $5);
    }
    | NEGACAO expressao                  { $$ = criar_unop("!", $2); }
    | SUBTRACAO expressao %prec NEGACAO  { $$ = criar_unop("-", $2); }
    | INCREMENTO expressao               { $$ = criar_unop("++", $2); }
    | DECREMENTO expressao               { $$ = criar_unop("--", $2); }
    | expressao INCREMENTO               { $$ = criar_unop("++", $1); }
    | expressao DECREMENTO               { $$ = criar_unop("--", $1); }
    | expressao PONTO IDENTIFICADOR {
        char buf[256];
        snprintf(buf, sizeof(buf), "%s.%s", $1->valor ? $1->valor : "obj", $3);
        $$ = novo_ponteiro("membro", buf, yylineno);
        adicionar_filho($$, $1);
        free($3);
    }
    | expressao PONTO IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES {
        char buf[256];
        snprintf(buf, sizeof(buf), "%s.%s", $1->valor ? $1->valor : "obj", $3);
        $$ = novo_ponteiro("chamada", buf, yylineno);
        anexar_argumentos($$, $5);
        liberar_ast($1);
        free($3);
    }
    | IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES {
        $$ = novo_ponteiro("chamada", $1, yylineno);
        anexar_argumentos($$, $3);
        free($1);
    }
    | expressao ABRE_COLCHETES expressao FECHA_COLCHETES {
        $$ = novo_ponteiro("index", NULL, yylineno);
        adicionar_filho($$, $1);
        adicionar_filho($$, $3);
    }
    | ABRE_PARENTESES expressao FECHA_PARENTESES {
        $$ = $2;
    }
    | IDENTIFICADOR {
        $$ = novo_ponteiro("id", $1, yylineno);
        free($1);
    }
    | NUMERO {
        $$ = novo_ponteiro("num", $1, yylineno);
        free($1);
    }
    | STRING {
        $$ = novo_ponteiro("str", $1, yylineno);
        free($1);
    }
    | TRUE  { $$ = novo_ponteiro("bool", "true", yylineno); }
    | FALSE { $$ = novo_ponteiro("bool", "false", yylineno); }
    | VAZIO { $$ = novo_ponteiro("null", "null", yylineno); }
    ;

lista_argumentos
    : /* vazio */ {
        $$ = novo_ponteiro("args", NULL, yylineno);
    }
    | argumentos_nao_vazios { $$ = $1; }
    ;

argumentos_nao_vazios
    : expressao {
        $$ = novo_ponteiro("args", NULL, yylineno);
        adicionar_filho($$, $1);
    }
    | argumentos_nao_vazios VIRGULA expressao {
        adicionar_filho($1, $3);
        $$ = $1;
    }
    ;

%%

void yyerror(const char *s) {
    fprintf(stderr, "Erro sintatico na linha %d: %s\n", yylineno, s);
}
