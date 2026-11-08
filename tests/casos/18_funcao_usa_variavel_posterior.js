// Caso 18: funcao usa variavel global declarada depois da funcao
// (valido em JS: o corpo so executa quando a funcao e chamada)

function mostrarTaxa() {
  console.log(taxa);
}

function aplicarTaxa(valor) {
  return valor * taxa;
}

let taxa = 2;
mostrarTaxa();
console.log(aplicarTaxa(10));
