// Caso 08 (erro semantico): variavel de bloco usada fora dele
// Esperado: "Erro semantico na linha 9: variavel 'interna' nao declarada"
let ativo = true;

if (ativo) {
  let interna = 5;
}

console.log(interna);
