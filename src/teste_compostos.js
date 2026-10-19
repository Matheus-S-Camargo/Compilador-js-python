let a = 10;
a *= 2;
a /= 3;
a %= 4;
a += 1;
a -= 1;

function ajustar(x) {
    let total = x;
    for (let i = 0; i < 5; i++) {
        total *= 2;
        if (total % 2 === 0) {
            total /= 2;
        }
        total %= 100;
    }
    return total;
}
