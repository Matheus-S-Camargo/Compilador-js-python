// Caso 25 (erro semantico): funcao usa variavel que so existe dentro de outro bloco
// Esperado: "Erro semantico na linha 4: variavel 'segredo' nao declarada"
function revelar() {
  return segredo;
}

if (true) {
  let segredo = 42;
}

revelar();
