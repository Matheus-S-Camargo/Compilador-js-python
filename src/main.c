#include <stdio.h>
#include <string.h>
#include "ast.h"
#include "gerador.h"
#include "semantica.h"

extern int yyparse(void);
extern No *raiz;
// isso tudo são só funções e arquivos que usamos em outros lugares

int main(int argc, char *argv[]) {
    int apenas_py = (argc > 1 && strcmp(argv[1], "--py") == 0);
    int apenas_ast = (argc > 1 && strcmp(argv[1], "--ast") == 0);

    if (argc > 2 || (argc == 2 && !apenas_py && !apenas_ast)) {
        fprintf(stderr, "Uso: %s [--py | --ast]\n", argv[0]);
        return 1;
    }

    int resultado = yyparse();

    if (resultado == 0 && raiz == NULL) {
        fprintf(stderr, "Erro: AST nao foi construida.\n");
        resultado = 1;
    }

    if (resultado == 0) {
        int erros = analisar(raiz);

        if (erros > 0) {
            fprintf(stderr, "%d erro(s) semantico(s) encontrado(s).\n", erros);
            resultado = 2;
        } else if (apenas_ast) {
            imprimir_ast(raiz, 0);
        } else {
            gerar_codigo(raiz, stdout);
        }
    }

    liberar_ast(raiz);
    return resultado;
}
