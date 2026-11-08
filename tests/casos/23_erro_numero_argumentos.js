// Caso 23 (erro semantico): chamada com numero errado de argumentos
// Esperado: "Erro semantico na linha 9: funcao 'area' espera 2 argumento(s), mas recebeu 1"
// Esperado: "Erro semantico na linha 10: funcao 'area' espera 2 argumento(s), mas recebeu 3"
function area(largura, altura) {
  return largura * altura;
}

let ok = area(2, 3);
let pouco = area(2);
let muito = area(2, 3, 4);
