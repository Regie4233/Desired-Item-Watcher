require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { default: puppeteer } = require("puppeteer");


let current = 0;
let working = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.on("ready", (c) => {
  console.log(`${c.user.tag} is online`);
});

client.on("messageCreate", (m) => {
  if (m.author.bot) {
    return;
  }

  if (m.content === "check" && working === false) {
    working = true;

    m.reply("Fetching Price.. lenovo x1 extreme");

    console.log("Working on price");
    m.reply(`Current Price: Lenovo x1 extreme ${current}`);
    working = false;
  } else if (m.content === "test") {
    const chanl = client.channels.cache.get('1073243133346848771');
    chanl.send('<@726243976927248412>');
  }
});

client.login(process.env.TOKEN);



async function checkPrice() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus',
    {
      waitUntil: "networkidle2",
      // Remove the timeout
      timeout: 0,
    });
  // await page.goto('https://www.google.com/search?q=time&client=ms-android-hms-tmobile-us&sxsrf=AJOqlzVeVY8Y_qvgIALqiYprILtP7rIkbA%3A1675962794188&ei=qinlY-yVC5mv5NoP0aG42A8&ved=0ahUKEwjskoT494j9AhWZF1kFHdEQDvsQ4dUDCBA&uact=5&oq=time&gs_lcp=Cgxnd3Mtd2l6LXNlcnAQAzIFCAAQkQIyBQgAEJECMgoIABCxAxCDARBDMgQIABBDMgUIABCABDIHCAAQsQMQQzILCC4QgAQQxwEQrwEyBAgAEEMyCwgAEIAEELEDEIMBMgUIABCABDoECCMQJzoOCC4QgAQQsQMQxwEQ0QM6CAgAELEDEIMBOg4ILhDHARCxAxDRAxCABDoLCC4QgAQQsQMQgwE6CAguEIAEELEDOggIABCABBCxA0oECEEYAEoECEYYAFAAWOcEYJYGaABwAXgAgAGXAYgB2QOSAQMxLjOYAQCgAQHAAQE&sclient=gws-wiz-serp',
  //   {
  //     waitUntil: "networkidle2",
  //     // Remove the timeout
  //     timeout: 0,
  //   });


  await page.reload();


  const aaa = await page.evaluate(() => {
    const bbb = document.querySelector('.final-price');
    // const bbb = document.querySelector('.gsrt');
    const text = bbb.innerText;
    return text;
  });

  // aaa.replace('$','');
  // aaa.replace(',','');
  console.log(aaa);
  const stri = aaa.replace('$', '').replace(',', '');
  console.log(stri);
  await browser.close();
  return parseFloat(stri);
}


async function Run(url, selector, userId, itemName) {
  
    
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url,
    {
      waitUntil: "networkidle2",
      timeout: 0,
    });

  await page.reload();


  const aaa = await page.evaluate((selector) => {
    const bbb = document.querySelector(selector);
    const text = bbb.innerText;
    return text;
  }, selector);

  // aaa.replace('$','');
  // aaa.replace(',','');
  console.log(aaa);
  const stri = aaa.replace('$', '').replace(',', '');
  console.log(stri);
  const floatprice = parseFloat(stri);
  const chanl = client.channels.cache.get('1073243133346848771');
  chanl.send(`Price for ${itemName} : $${floatprice}  ${userId}`);

  await browser.close();
  // return parseFloat(stri);
}


setInterval(async () => {
  await Run('https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus', '.final-price', '<@726243976927248412>', 'Lenovo X1 Extreme');
  await Run('https://www.microcenter.com/product/660836/asus-nvidia-geforce-rtx-4080-tuf-gaming-overclocked-triple-fan-16gb-gddr6x-pcie-40-graphics-card', '.big-price', '<@726243976927248412>', 'Nvidia 4080');

},60000);

// Run('https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus', '.final-price', '<@726243976927248412>', 'Lenovo X1 Extreme');
// // Run_GetAttribute('https://www.microcenter.com/product/660836/asus-nvidia-geforce-rtx-4080-tuf-gaming-overclocked-triple-fan-16gb-gddr6x-pcie-40-graphics-card', '.big-price', '<@726243976927248412>', 'Nvidia 4080');
// Run('https://www.microcenter.com/product/660836/asus-nvidia-geforce-rtx-4080-tuf-gaming-overclocked-triple-fan-16gb-gddr6x-pcie-40-graphics-card', '.big-price', '<@726243976927248412>', 'Nvidia 4080');


// setInterval(async () => {
//   let resp = await checkPrice();
//   // console.log(resp);
//   if (current !== resp) {
//     current = resp;
//     const chanl = client.channels.cache.get('1073243133346848771');
//     chanl.send(`Price now: Lenovo x1 Extreme ${resp}`);
//   }
// },8000);

