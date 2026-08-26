#include <stdio.h>
#include "grammar.tab.h"

extern int yylex(void);
extern char *yytext;

int main(void) {
    int token;
    while ((token = yylex()) != 0) {
        printf("TOKEN: %-15d LEXEMA: '%s'\n", token, yytext);
    }
    return 0;
}