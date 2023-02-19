require("dotenv").config();

const { Client, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Routes, Events, StringSelectMenuBuilder, SelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { REST } = require('@discordjs/rest');
const commandRequest = require('./comamnds/request');
const { default: puppeteer } = require("puppeteer");


const lib = require('./dbmanager');
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/sw-usersDb", (x) => {
  console.log(`Database connected`);
});
const User = require('./user_model');
const date = new Date();

const str1 = '<@';
const str2 = '>';
let working = false;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});
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


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
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




const client_id = process.env.CLIENT_ID;
const guild_id = process.env.GUILD_ID;



async function Initialize_Bot() {
  try {
    const commands = [
      commandRequest.data.toJSON(),
    ];
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: commands },);
    client.login(process.env.TOKEN);
  } catch (e) {
    console.log(e);
  }
}
// client.login(process.env.TOKEN);
Initialize_Bot();


// client.on('interactionCreate', async (interaction) => {
//   if (!interaction.isChatInputCommand()) return;

//   if (interaction.commandName === commandRequest.data.name) {
//     // const modal = new ModalBuilder()
//     //   .setCustomId("trackerform")
//     //   .setTitle("Request Tracker Form");
//     console.log("!");


//     // await interaction.showModal(modal);
//   }
// });

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'requestform') {
    const inputUrl = new TextInputBuilder()
      .setCustomId('input_url')
      .setLabel("Paste the URL of the item you want to track")
      .setStyle(TextInputStyle.Paragraph);

    const row_url = new ActionRowBuilder().addComponents(inputUrl);


    const modal = new ModalBuilder()
      .setCustomId("trackerform")
      .setTitle("Request Tracker Form")
      .addComponents(row_url);
    await interaction.showModal(modal);
  }


});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) { return; }
  if (interaction.customId === 'trackerform') {
    const url_sbmt = interaction.fields.getTextInputValue('input_url');

    await interaction.reply({ content: 'Requesting...', ephemeral: true });

    const site_valid = await Website_Validator(url_sbmt, interaction.user.id);
    const itemPrice =  parseFloat(site_valid.price);
    const itemName = site_valid.name;
    const itemSelector = site_valid.selector;
    console.log(`${site_valid.accepted} : ${itemName} : ${itemPrice} : ${itemSelector}`);
    if(site_valid.accepted){
      if(!await Database_Validation(url_sbmt, interaction.user.id)){
        await interaction.editReply({ content: `Success! Adding to pool..`, ephemeral: true });
        await lib.Add_New_to_Database(interaction.user.id, url_sbmt, itemSelector, itemName);
      }else{
        await interaction.editReply({ content: `Website already exists in your account!`, ephemeral: true });
      }
    }else{
      await interaction.editReply({ content: `Website is invalid! Try again`, ephemeral: true });
    }
  }
});


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

  // evaluate and return text
  const value = await page.evaluate((selector) => {
    const bbb = document.querySelectorAll(selector)[0].innerText;
    // const bbb = document.querySelector(selector);
    const text = bbb;
    return text;
  }, selector);

  const stri = value.replace('$', '').replace(',', '');

  const floatprice = parseFloat(stri);


  
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
  await browser.close();
}

async function test1() {
  const temp = str1.concat("726243976927248412").concat(str2);
  const user = await User.find({ discordId: '726243976927248412' });

}
//
Run_Parse_Website(); 
//<<MAIN parser  

async function Run_Parse_Website() {
  try {
    User.find({}, (err, resp) => {
      if (err) console.log(err);
      for (let i = 0; i < resp.length; i++) {
        for (let y = 0; y < resp[i].items.length; y++) {
          Run(resp[i].items[y]).then(() => resp[i].save());
          // console.log(`${resp[i].items[y].name} Price ${resp[i].items[y].current.price}`);
        }
      }

    });
  } catch (e) {
    console.log(e);
  }
}

setInterval(async () => {

  await Run_Parse_Website();


}, 900000);



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

async function Website_Validator(url) {
  try {
    console.log("validating site");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url,
      {
        waitUntil: "networkidle2",
        timeout: 0,
      });

    const val = await getWebsite(url, page);
    console.log(`${val.retName} ${val.retPrice} ${val.retSelector}`);
    const string = val.retPrice.replace('$', '').replace(',', '');
    const floatprice = parseFloat(string);
    await browser.close();
    return {accepted: true, price: floatprice, name: val.retName, selector: val.retSelector};

  } catch (e) {
    return {accepted: false};
  }
}
// async function comd() {
//   await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: [] })
//     .then(() => console.log('Successfully deleted guild command'))
//     .catch(console.error);
// }

async function getWebsite(url, page) {
  let value;
  if (url.includes("bestbuy.com")) {
    console.log('bestbuy site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".priceView-hero-price.priceView-customer-price span")[0].innerText;
      const nameElement = document.querySelector(".heading-5.v-fw-regular").innerText;
      return {retPrice: priceElement, retName: nameElement, retSelector: ".priceView-hero-price.priceView-customer-price span"};
    });
  } 
  else if (url.includes("lenovo.com")) {
    console.log('lenovo site detected');
    value = await page.evaluate(() => {
      // const priceElement = document.querySelector(".final-price").innerText;
      const priceElement = document.querySelectorAll(".final-price")[0].innerText;
      const nameElement = document.querySelector(".product_summary").innerText;
      return {retPrice: priceElement, retName: nameElement, retSelector: ".final-price"};
    });
  }
  else if (url.includes("microcenter.com")) {
    console.log('microcenter site detected');
    value = await page.evaluate(() => {
      // const priceElement = document.querySelector(".final-price").innerText;
      const priceElement = document.querySelectorAll(".big-price")[0].innerText;
      const nameElement = document.querySelector(".productTitle").textContent;
      console.log(priceElement);
      return {retPrice: priceElement, retName: nameElement, retSelector: ".big-price"};
    });
  }
  else if (url.includes("amazon.com")) {
    console.log('amazon site detected');
    value = await page.evaluate(() => {
      // const priceElement = document.querySelector(".final-price").innerText;
      const priceElement = document.querySelectorAll(".a-offscreen")[0].innerText;
      const nameElement = document.querySelector(".a-size-large.product-title-word-break").textContent;
      console.log(priceElement);
      return {retPrice: priceElement, retName: nameElement, retSelector: ".a-offscreen"};
    });
  }
  console.log(value);
  return value;
}

async function Database_Validation(url, discordid){
    if(await User.exists({discordId: discordid})){
    const user = await User.where('discordId').equals(discordid.toString()); 
    console.log(user[0]);
    for(let i = 0; i < user[0].items.length; i++){
      if(user[0].items[i].url === url){
        //item match deny
        return true;
      }
    }
    //no item match proceed
    return false;
  } else{
    console.log("User does not exiist creating user..");
    lib.Add_New_User(discordid);
    return false;
  }
} 

