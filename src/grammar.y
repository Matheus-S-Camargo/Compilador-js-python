%code requires{
    #include "ast.h"
}

%{
#include <stdio.h>
#include <stdlib.h>
#include "ast.h"

int yylex(void);
extern int yylineno;
void yyerror(const char *s);

No *raiz = NULL;

static No *no0(const char *tipo, const char *valor) {
    return novo_ponteiro(tipo, valor, yylineno);
}
static No *no1(const char *tipo, const char *valor, No *a) {
    No *n = no0(tipo, valor);
    adicionar_filho(n, a);
    return n;
}
static No *no2(const char *tipo, const char *valor, No *a, No *b) {
    No *n = no1(tipo, valor, a);
    adicionar_filho(n, b);
    return n;
}
%}

%union{
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

/* ===== Precedência e associatividade (da menor para a maior) ===== */
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

/* Nao terminais: quase todos produzem um no da AST */
%type <no> programa lista_statements statement declaracao_var expressao_statement bloco
%type <no> statement_if statement_while statement_for statement_return declaracao_function expressao
%type <str> tipo_var

%%

/* ===== Estrutura geral ===== */
programa
    : lista_statements { raiz = $1; }
    |                  { raiz = novo_ponteiro("PROGRAMA", NULL, yylineno); }
    ;

lista_statements
    : statement { $$ = novo_ponteiro("PROGRAMA", NULL, yylineno);
          adicionar_filho($$, $1); }
    | lista_statements statement {adicionar_filho($1, $2); $$ = $1; }
    ;

statement
    : declaracao_var
    | expressao_statement
    | statement_if
    | statement_while
    | statement_for
    | statement_return
    | declaracao_function
    | bloco
    ;

bloco
    : ABRE_CHAVES lista_statements FECHA_CHAVES { $$ = NULL; /* TODO */ }
    ;

/* ===== Declaração de variáveis: let/const/var ID (= expr)? ; ===== */
declaracao_var
    : tipo_var IDENTIFICADOR PONTO_VIRGULA { $$ = novo_ponteiro("DECL_VAR", $1, yylineno);
          adicionar_filho($$, novo_ponteiro("IDENT", $2, yylineno));
          free($2); }
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao PONTO_VIRGULA { $$ = novo_ponteiro("DECL_VAR", $1, yylineno);
          adicionar_filho($$, novo_ponteiro("IDENT", $2, yylineno));
          adicionar_filho($$, $4);
          free($2); }
    ;

tipo_var
    : LET { $$ = "let"; }
    | CONST { $$ = "const"; }
    | VAR { $$ = "var"; }
    ;

/* ===== Expressão como statement (ex: chamada de função, atribuição solta) ===== */
expressao_statement
    : expressao PONTO_VIRGULA
    ;

/* ===== if / else ===== */
statement_if
    : IF ABRE_PARENTESES expressao FECHA_PARENTESES statement { $$ = NULL;}
    | IF ABRE_PARENTESES expressao FECHA_PARENTESES statement ELSE statement { $$ = NULL;}
    ;

/* ===== while ===== */
statement_while
    : WHILE ABRE_PARENTESES expressao FECHA_PARENTESES statement { $$ = NULL;}
    ;

/* ===== for (init; condicao; incremento) statement ===== */
statement_for
    : FOR ABRE_PARENTESES for_init PONTO_VIRGULA expressao PONTO_VIRGULA expressao FECHA_PARENTESES statement { $$ = NULL;}
    ;

for_init
    : /* vazio */
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao
    | expressao
    ;

/* ===== return ===== */
statement_return
    : RETORNO PONTO_VIRGULA { $$ = NULL;}
    | RETORNO expressao PONTO_VIRGULA { $$ = NULL;}
    ;

/* ===== function nome(parametros) { corpo } ===== */
declaracao_function
    : FUNCTION IDENTIFICADOR ABRE_PARENTESES lista_parametros FECHA_PARENTESES bloco { $$ = NULL;}
    ;

lista_parametros
    : /* vazio */
    | IDENTIFICADOR {free($1);}
    | lista_parametros VIRGULA IDENTIFICADOR {free($3);}
    ;

/* ===== Expressões ===== */
expressao
    : expressao ATRIBUICAO expressao            { $$ = no2("ATRIBUICAO", "=",  $1, $3); }
    | expressao MAIS_IGUAL expressao            { $$ = no2("ATRIBUICAO", "+=", $1, $3); }
    | expressao MENOS_IGUAL expressao           { $$ = no2("ATRIBUICAO", "-=", $1, $3); }
    | expressao MULTIPLICACAO_IGUAL expressao   { $$ = no2("ATRIBUICAO", "*=", $1, $3); }
    | expressao DIVISAO_IGUAL expressao         { $$ = no2("ATRIBUICAO", "/=", $1, $3); }
    | expressao RESTO_IGUAL expressao           { $$ = no2("ATRIBUICAO", "%=", $1, $3); }
    | expressao OR expressao                    { $$ = no2("BINARIO", "||",  $1, $3); }
    | expressao AND expressao                   { $$ = no2("BINARIO", "&&",  $1, $3); }
    | expressao IGUALDADE expressao             { $$ = no2("BINARIO", "==",  $1, $3); }
    | expressao DIFERENTE expressao             { $$ = no2("BINARIO", "!=",  $1, $3); }
    | expressao IGUALDADE_ESTRITA expressao     { $$ = no2("BINARIO", "===", $1, $3); }
    | expressao DIFERENCA_ESTRITA expressao     { $$ = no2("BINARIO", "!==", $1, $3); }
    | expressao MENOR expressao                 { $$ = no2("BINARIO", "<",   $1, $3); }
    | expressao MAIOR expressao                 { $$ = no2("BINARIO", ">",   $1, $3); }
    | expressao MENOR_IGUAL expressao           { $$ = no2("BINARIO", "<=",  $1, $3); }
    | expressao MAIOR_IGUAL expressao           { $$ = no2("BINARIO", ">=",  $1, $3); }
    | expressao ADICAO expressao                { $$ = no2("BINARIO", "+",   $1, $3); }
    | expressao SUBTRACAO expressao             { $$ = no2("BINARIO", "-",   $1, $3); }
    | expressao MULTIPLICACAO expressao         { $$ = no2("BINARIO", "*",   $1, $3); }
    | expressao DIVISAO expressao               { $$ = no2("BINARIO", "/",   $1, $3); }
    | expressao RESTO_DIVISAO expressao         { $$ = no2("BINARIO", "%",   $1, $3); }
    | expressao INTERROGACAO expressao DOIS_PONTOS expressao   { $$ = NULL; /* TODO: ternario */ }
    | NEGACAO expressao                         { $$ = NULL; /* TODO */ }
    | SUBTRACAO expressao %prec NEGACAO         { $$ = NULL; /* TODO */ }
    | INCREMENTO expressao                      { $$ = NULL; /* TODO */ }
    | DECREMENTO expressao                      { $$ = NULL; /* TODO */ }
    | expressao INCREMENTO                      { $$ = NULL; /* TODO */ }
    | expressao DECREMENTO                      { $$ = NULL; /* TODO */ }
    | expressao PONTO IDENTIFICADOR             { $$ = NULL; free($3); /* TODO: acesso a membro */ }
    | expressao PONTO IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES
                                                { $$ = NULL; free($3); /* TODO: chamada de metodo */ }
    | IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES
                                                { $$ = NULL; free($1); /* TODO: chamada de funcao */ }
    | expressao ABRE_COLCHETES expressao FECHA_COLCHETES   { $$ = NULL; /* TODO: indexacao */ }
    | ABRE_PARENTESES expressao FECHA_PARENTESES           { $$ = $2; }
    | IDENTIFICADOR     { $$ = no0("IDENT",  $1); free($1); }
    | NUMERO            { $$ = no0("NUMERO", $1); free($1); }
    | STRING            { $$ = no0("STRING", $1); free($1); }
    | TRUE              { $$ = no0("BOOL", "true"); }
    | FALSE             { $$ = no0("BOOL", "false"); }
    | VAZIO             { $$ = no0("NULO", "null"); }
    ;

lista_argumentos
    : /* vazio */
    | expressao
    | lista_argumentos VIRGULA expressao
    ;

%%

void yyerror(const char *s) {
    fprintf(stderr, "Erro sintatico na linha %d: %s\n", yylineno, s);
}

