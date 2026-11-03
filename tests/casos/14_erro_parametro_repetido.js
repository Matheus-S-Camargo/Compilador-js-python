// Caso 14 (erro semantico): variavel com o mesmo nome de um parametro
// Esperado: "Erro semantico na linha 4: 'valor' redeclarada no mesmo escopo (declarada antes na linha 3)"
function dobrar(valor) {
  let valor = 2;
  return valor;
}
