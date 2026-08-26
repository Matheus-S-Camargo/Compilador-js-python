%{
#include <stdio.h>
#include <stdlib.h>

int yylex(void);
extern int yylineno;
void yyerror(const char *s);
%}

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

/* ===== Relacionais ===== */
%token IGUALDADE DIFERENTE IGUALDADE_ESTRITA DIFERENCA_ESTRITA
%token MENOR MAIOR MENOR_IGUAL MAIOR_IGUAL

/* ===== Lógicos ===== */
%token AND OR NEGACAO

/* ===== Literais e identificadores ===== */
%token IDENTIFICADOR NUMERO STRING

/* ===== Precedência e associatividade (da menor para a maior) ===== */
%right ATRIBUICAO MAIS_IGUAL MENOS_IGUAL
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
    : lista_statements
    ;

lista_statements
    : /* vazio */
    | lista_statements statement
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
    : ABRE_CHAVES lista_statements FECHA_CHAVES
    ;

/* ===== Declaração de variáveis: let/const/var ID (= expr)? ; ===== */
declaracao_var
    : tipo_var IDENTIFICADOR PONTO_VIRGULA
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao PONTO_VIRGULA
    ;

tipo_var
    : LET
    | CONST
    | VAR
    ;

/* ===== Expressão como statement (ex: chamada de função, atribuição solta) ===== */
expressao_statement
    : expressao PONTO_VIRGULA
    ;

/* ===== if / else ===== */
statement_if
    : IF ABRE_PARENTESES expressao FECHA_PARENTESES statement
    | IF ABRE_PARENTESES expressao FECHA_PARENTESES statement ELSE statement
    ;

/* ===== while ===== */
statement_while
    : WHILE ABRE_PARENTESES expressao FECHA_PARENTESES statement
    ;

/* ===== for (init; condicao; incremento) statement ===== */
statement_for
    : FOR ABRE_PARENTESES for_init PONTO_VIRGULA expressao PONTO_VIRGULA expressao FECHA_PARENTESES statement
    ;

for_init
    : /* vazio */
    | tipo_var IDENTIFICADOR ATRIBUICAO expressao
    | expressao
    ;

/* ===== return ===== */
statement_return
    : RETORNO PONTO_VIRGULA
    | RETORNO expressao PONTO_VIRGULA
    ;

/* ===== function nome(parametros) { corpo } ===== */
declaracao_function
    : FUNCTION IDENTIFICADOR ABRE_PARENTESES lista_parametros FECHA_PARENTESES bloco
    ;

lista_parametros
    : /* vazio */
    | IDENTIFICADOR
    | lista_parametros VIRGULA IDENTIFICADOR
    ;

/* ===== Expressões ===== */
expressao
    : expressao ATRIBUICAO expressao
    | expressao MAIS_IGUAL expressao
    | expressao MENOS_IGUAL expressao
    | expressao OR expressao
    | expressao AND expressao
    | expressao IGUALDADE expressao
    | expressao DIFERENTE expressao
    | expressao IGUALDADE_ESTRITA expressao
    | expressao DIFERENCA_ESTRITA expressao
    | expressao MENOR expressao
    | expressao MAIOR expressao
    | expressao MENOR_IGUAL expressao
    | expressao MAIOR_IGUAL expressao
    | expressao ADICAO expressao
    | expressao SUBTRACAO expressao
    | expressao MULTIPLICACAO expressao
    | expressao DIVISAO expressao
    | expressao RESTO_DIVISAO expressao
    | NEGACAO expressao
    | SUBTRACAO expressao %prec NEGACAO
    | INCREMENTO expressao
    | DECREMENTO expressao
    | expressao INCREMENTO
    | expressao DECREMENTO
    | expressao PONTO IDENTIFICADOR
    | expressao PONTO IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES
    | IDENTIFICADOR ABRE_PARENTESES lista_argumentos FECHA_PARENTESES
    | expressao ABRE_COLCHETES expressao FECHA_COLCHETES
    | ABRE_PARENTESES expressao FECHA_PARENTESES
    | IDENTIFICADOR
    | NUMERO
    | STRING
    | TRUE
    | FALSE
    | VAZIO
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

int main(void) {
    int resultado = yyparse();
    if (resultado == 0) {
        printf("Analise sintatica concluida sem erros.\n");
    }
    return resultado;
}
