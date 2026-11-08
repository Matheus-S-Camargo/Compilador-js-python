// Caso 24 (erro semantico): chamar uma variavel que guarda um valor simples
// Esperado: "Erro semantico na linha 6: 'limite' nao e uma funcao (valor do tipo num)"
// Esperado: "Erro semantico na linha 7: 'nome' nao e uma funcao (valor do tipo str)"
let limite = 10;
let nome = "nave";
limite();
nome(1);
