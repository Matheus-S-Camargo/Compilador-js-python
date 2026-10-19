#include <stdio.h>
#include <string.h>
#include "gerador.h"

void gerar_codigo(const No *raiz, FILE *saida) {
    if (raiz == NULL) {
        return;
    }

    if (saida == NULL) {
        saida = stdout;
    }

    if (raiz->tipo == NULL || raiz->valor == NULL) {
        return;
    }

    if (strcmp(raiz->tipo, "num") == 0 || strcmp(raiz->tipo, "NUMERO") == 0) {
        fprintf(saida, "%s", raiz->valor);
    } else if (strcmp(raiz->tipo, "id") == 0 || 
               strcmp(raiz->tipo, "identificador") == 0 || 
               strcmp(raiz->tipo, "IDENTIFICADOR") == 0) {
        fprintf(saida, "%s", raiz->valor);
    }
}
