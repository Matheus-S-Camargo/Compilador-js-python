#include "grammar.tab.h"
#include <stdio.h>


extern int yylex(void);
extern char *yytext;

int yywrap(void) {
  return 1; // 1 indica que o arquivo terminou e a leitura deve parar
}

int main(void) {
  int token;
  while ((token = yylex()) != 0) {
    printf("TOKEN: %-15d LEXEMA: '%s'\n", token, yytext);
  }
  return 0;
}
