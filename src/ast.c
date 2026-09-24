#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include "ast.h"

No *novo_ponteiro(const char *tipo, const char *valor, int linha){
    No *tamanho = malloc(sizeof(No));
    tamanho -> tipo = strdup(tipo);
    if (valor != NULL){
        tamanho -> valor = strdup(valor);
    } else {
        tamanho -> valor = NULL;
    }
    tamanho -> filhos = NULL;
    tamanho -> contador_filhos = 0;
    tamanho -> linha = linha; 
    return tamanho;
}

void adicionar_filho(No *pai, No *filho){
    pai -> contador_filhos++;
    pai->filhos = realloc(pai->filhos, pai->contador_filhos * sizeof(No *));    
    pai->filhos[pai->contador_filhos - 1] = filho;
}

void imprimir_ast(No *raiz, int nivel){
    if (raiz == NULL){
        return;
    }

    for (int i = 0; i < nivel; i++){
        printf("  ");
    }

    printf("%s: %s (linha %d)\n", raiz->tipo, raiz->valor ? raiz->valor : "", raiz->linha);

    for (int i = 0; i < raiz->contador_filhos;i++){
        imprimir_ast(raiz->filhos[i], nivel + 1);
    }
}


void liberar_ast(No *raiz) {
    if (raiz == NULL){
        return;
    }
    for (int i = 0; i < raiz->contador_filhos; i++) {
        liberar_ast(raiz->filhos[i]);
    }
    free(raiz->filhos);
    free(raiz->tipo);
    free(raiz->valor);        
    free(raiz);
}

