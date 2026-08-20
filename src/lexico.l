%{
    #include <stdio.h>
    #include "parser.tab.h"
%}

%%

"let" { return LET; }
"const" { return CONST; }
"var" { return VAR; }
"function" { return FUNCTION; }
"(" { return ABRE_PARENTESES; }
")" { return FECHA_PARENTESES; }
"{" { return ABRE_CHAVES; }
"}" { return FECHA_CHAVES; }
"true" { return TRUE; }
"false" { return FALSE; }
"==" { return IGUALDADE; }
";" { return PONTO_VIRGULA;}
"return" { return RETORNO; }
"if" { return IF; }
"else" { return ELSE; }
"&&" { return AND; }
"||" { return OR; }
"++" { return INCREMENTO; }
"--" { return DECREMENTO; }
"+=" { return MAIS_IGUAL; }
"-=" { return MENOS_IGUAL; }
"<=" { return MENOR_IGUAL; }
">=" { return MAIOR_IGUAL; }
"+" { return ADICAO; }
"-" { return SUBTRACAO; }
"*" { return MULTIPLICACAO; }
"/" { return DIVISAO; }
"=" { return ATRIBUICAO; }
"<" { return MENOR; }
">" { return MAIOR;}
"for" { return FOR; }
"." { return PONTO; }
"," { return VIRGULA; }
"null" { return VAZIO; }
"while" { return WHILE; }

[a-zA-Z_][a-zA-Z0-9_]* { return IDENTIFICADOR; }
[0-9]+ { return NUMERO; }
\"[^\"]*\" { return STRING; }
[ \t \n]+ { /* ignora espaços */ }
. { printf("Erro léxico: caractere desconhecido")}


%%
