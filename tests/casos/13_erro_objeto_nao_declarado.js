// Caso 13 (erro semantico): acesso a membro de objeto nao declarado
// Esperado: "Erro semantico na linha 4: variavel 'nave' nao declarada"
// Esperado: "Erro semantico na linha 5: variavel 'nave' nao declarada"
let painel = nave.status;
let coordenadas = nave.getCoordenadas(0, 1);
