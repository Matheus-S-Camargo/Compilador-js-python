// Caso 10 (erro semantico): parametro usado fora da funcao
// Esperado: "Erro semantico na linha 8: variavel 'largura' nao declarada"
function area(largura, altura) {
  return largura * altura;
}

let a = area(2, 3);
console.log(largura);
