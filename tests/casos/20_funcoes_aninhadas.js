// Caso 20: funcoes aninhadas, recursao e return sem valor
function externa(n) {
  function interna(x) {
    return x * 2;
  }
  if (n <= 0) {
    return interna(n);
  }
  return interna(n) + externa(n - 1);
}

function avisar(ativo) {
  if (ativo) {
    console.log("ativo");
    return;
  }
  console.log("inativo");
}

console.log(externa(3));
avisar(true);
avisar(false);
