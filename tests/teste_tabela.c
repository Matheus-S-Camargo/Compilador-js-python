#include <stdio.h>
#include "../src/tabela.h"

static void mostrar(const char *nome){
    Simbolo *s = buscar(nome);
    if (s != NULL){
        printf("buscar(\"%s\") -> tipo=%s, linha=%d\n", nome, s->tipo, s->linha);
    } else {
        printf("buscar(\"%s\") -> nao encontrado\n", nome);
    }
}

int main(void){
    /* escopo 0 (global) */
    abrir_escopo();
    inserir("x", "variavel", "num", 0, 1);
    inserir("PI", "variavel", "num", 1, 2);
    inserir("soma", "funcao", "num", 0, 3);

    /* escopo 1 (interno) */
    abrir_escopo();
    inserir("x", "variavel", "str", 0, 5);   /* sombreia o x global */
    inserir("y", "variavel", "bool", 0, 6);

    imprimir_tabela();

    printf("\n[Dentro do escopo interno]\n");
    mostrar("x");    /* deve achar o x do escopo 1 (str, linha 5) */
    mostrar("y");
    mostrar("PI");   /* vem do escopo global */
    printf("buscar_escopo_atual(\"PI\") -> %s\n",
           buscar_escopo_atual("PI") ? "encontrado" : "nao encontrado");

    fechar_escopo();

    printf("\n[Apos fechar o escopo interno]\n");
    mostrar("x");    /* deve voltar ao x global (num, linha 1) */
    mostrar("y");    /* nao existe mais */

    printf("\n");
    imprimir_tabela();

    fechar_escopo();
    return 0;
}
