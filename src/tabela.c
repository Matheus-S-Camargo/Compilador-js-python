#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include "tabela.h"

#define MAX_ESCOPOS 64

static Simbolo *escopos[MAX_ESCOPOS];
static int topo = -1;   /* -1 = nenhum escopo aberto */

void abrir_escopo(void){
    if (topo + 1 >= MAX_ESCOPOS){
        fprintf(stderr, "Erro: limite de %d escopos atingido\n", MAX_ESCOPOS);
        exit(1);
    }
    topo++;
    escopos[topo] = NULL;
}

void fechar_escopo(void){
    if (topo < 0){
        fprintf(stderr, "Erro: nenhum escopo aberto para fechar\n");
        return;
    }
    Simbolo *atual = escopos[topo];
    while (atual != NULL){
        Simbolo *prox = atual->prox;
        free(atual->nome);
        free(atual->categoria);
        free(atual->tipo);
        free(atual);
        atual = prox;
    }
    escopos[topo] = NULL;
    topo--;
}

void inserir(const char *nome, const char *categoria, const char *tipo, int constante, int linha){
    if (topo < 0){
        fprintf(stderr, "Erro: inserir '%s' sem escopo aberto\n", nome);
        return;
    }
    Simbolo *s = malloc(sizeof(Simbolo));
    s->nome = strdup(nome);
    s->categoria = strdup(categoria);
    s->tipo = strdup(tipo);
    s->constante = constante;
    s->n_params = 0;
    s->linha = linha;
    /* insere no início da lista do escopo atual */
    s->prox = escopos[topo];
    escopos[topo] = s;
}

Simbolo *buscar_escopo_atual(const char *nome){
    if (topo < 0){
        return NULL;
    }
    for (Simbolo *s = escopos[topo]; s != NULL; s = s->prox){
        if (strcmp(s->nome, nome) == 0){
            return s;
        }
    }
    return NULL;
}

Simbolo *buscar(const char *nome){
    for (int i = topo; i >= 0; i--){
        for (Simbolo *s = escopos[i]; s != NULL; s = s->prox){
            if (strcmp(s->nome, nome) == 0){
                return s;
            }
        }
    }
    return NULL;
}

void imprimir_tabela(void){
    printf("===== Tabela de simbolos (%d escopo(s) aberto(s)) =====\n", topo + 1);
    for (int i = topo; i >= 0; i--){
        printf("-- Escopo %d --\n", i);
        if (escopos[i] == NULL){
            printf("  (vazio)\n");
        }
        for (Simbolo *s = escopos[i]; s != NULL; s = s->prox){
            printf("  %-12s categoria=%-9s tipo=%-12s const=%d params=%d linha=%d\n",
                   s->nome, s->categoria, s->tipo, s->constante, s->n_params, s->linha);
        }
    }
}
