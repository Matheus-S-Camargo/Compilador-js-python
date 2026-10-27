#include "grammar.tab.h"
#include <stdio.h>

extern int yylex(void);
extern char *yytext;

int yywrap() { return 1; }

int main() {
  int token;
  while ((token = yylex()) != 0) {
    printf("TOKEN: %-15d LEXEMA: '%s'\n", token, yytext);
  }
  return 0;
}
