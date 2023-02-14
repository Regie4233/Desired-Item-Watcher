require("dotenv").config();
const lib = require('./dbmanager');
const { Client, GatewayIntentBits } = require("discord.js");
const { default: puppeteer } = require("puppeteer");
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/sw-usersDb", (x) => {
  console.log(`Database connected`);
});
const User = require('./user_model');
const date = new Date();

const str1 = '<@';
const str2 = '>';
let working = false;

// let usersPrefs = [
//   {
//     userId: '726243976927248412',
//     target: {
//       url: 'https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus',
//       selector: '.final-price',
//       itemName: 'Lenovo X1 Extreme',
//       storedPrice: 0
//     }
//   },
//   {
//     userId: '213528934346653696',
//     target: {
//       url: 'https://www.microcenter.com/product/660836/asus-nvidia-geforce-rtx-4080-tuf-gaming-overclocked-triple-fan-16gb-gddr6x-pcie-40-graphics-card',
//       selector: '.big-price',
//       itemName: 'Nvidia 4080',
//       storedPrice: 0
//     }
//   }

// ]

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

client.on("messageCreate", async (m) => {
  if (m.author.bot) {
    return;
  }

  if (m.content === "check" && working === false) {
    working = true;

    const user = await User.where('discordId').equals(m.author.id.toString());
    const temp = str1.concat(user[0].discordId).concat(str2);
    const chanl = client.channels.cache.get('1073243133346848771');

    let message = []

    for (let i = 0; i < user[0].items.length; i++) {
      message.push({
        name: user[0].items[i].name,
        currentPrice: user[0].items[i].current.price,
        highestPrice: user[0].items[i].highest.price,
        lowestPrice: user[0].items[i].lowest.price,
      })

    }
    message.forEach(element => {
      m.reply(`${temp} \n ${element.name} \n Current ${element.currentPrice} \n Highest ${element.highestPrice} \n Lowest ${element.lowestPrice}`);
    });
    






    working = false;
  } else if (m.content === "test") {
    const chanl = client.channels.cache.get('1073243133346848771');
    chanl.send('<@726243976927248412>');
  }
});

client.login(process.env.TOKEN);




async function Run(item) {
  const url = item.url;
  const selector = item.selector;
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

  const stri = aaa.replace('$', '').replace(',', '');

  const floatprice = parseFloat(stri);


  await browser.close();
  console.log(`Parser found: ${floatprice}`);


  if (floatprice !== item.current.price) {
    if (floatprice >= item.current.price) {
      item.highest.price = floatprice;
      item.highest.date = date.toLocaleDateString();
    }
    if (floatprice <= item.current.price) {
      item.lowest.price = floatprice;
      item.lowest.date = date.toLocaleDateString();
    }
    item.current.price = floatprice;
    item.current.date = date.toLocaleDateString();

  }
  if (item.lowest.price === 0) {
    item.lowest.price = item.current.price;
  }
  console.log(item.current.price);
  // return floatprice;
}
// Execute_Data_Checks();
setInterval(async () => {

  await Run_Parse_Website();


}, 900000);


async function test1() {
  const temp = str1.concat("726243976927248412").concat(str2);
  const user = await User.find({ discordId: '726243976927248412' });

}
Run_Parse_Website();

async function Run_Parse_Website() {

  User.find({}, (err, resp) => {
    if (err) console.log(err);
    for (let i = 0; i < resp.length; i++) {
      for (let y = 0; y < resp[i].items.length; y++) {
        Run(resp[i].items[y]).then(() => resp[i].save());
        // console.log(`${resp[i].items[y].name} Price ${resp[i].items[y].current.price}`);
      }
    }

  });

}

}, 8000);

// Execute_Update(); 1074809115844550756


async function Add_Item_Validation(disId, url, selector, itemName) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 0 })
    lib.Add_New_to_Database(disId, url, selector, itemName);

  } catch (e) {
    const chanl = client.channels.cache.get('1073243133346848771');
    chanl.send(`Website not found \n ${url}`);
  }
}

