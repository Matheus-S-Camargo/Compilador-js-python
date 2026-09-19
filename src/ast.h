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
    
}