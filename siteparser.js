const nightmare = require('nightmare')();

let counter = 0;

async function checkPrice() {
    
    try {
        const priceString = await nightmare
            .goto("https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus")
            .wait(".final-price")
            .evaluate(() => document.getElementsByClassName("final-price")[0].innerText)
            .end();

        const price = priceString.replace('$', '').replace(',', '');

        parseFloat(price);

        console.log(price);
        if (price < 1800) {
            console.log('cheaop');
        } else {
            console.log('not cheap');
        }
    }
    catch (e) {
        console.log(e);
    }
}

setInterval(() => {
    console.log("!");
}, 1000);
checkPrice();