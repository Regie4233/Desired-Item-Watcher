require("dotenv").config();

const { Client, GatewayIntentBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, Routes, Events, StringSelectMenuBuilder, SelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Component } = require("discord.js");
const { REST } = require('@discordjs/rest');
const commandRequest = require('./comamnds/request');
const commandFetch = require('./comamnds/fetch');
const commandFetchAll = require('./comamnds/adminfetchall');
const { default: puppeteer } = require("puppeteer");


const lib = require('./dbmanager');
const mongoose = require('mongoose');
// mongoose.connect("mongodb://localhost/sw-usersDb", (x) => {
//   console.log(`Database connected`);
// });
mongoose.connect("mongodb://127.0.0.1/sw-usersDb", (x) => {
  console.log(`Database connected`);
  Initialize_Bot();
});
const User = require('./user_model');


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
      commandFetch.data.toJSON(),
      commandFetchAll.data.toJSON()
    ];
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: commands },);
    client.login(process.env.TOKEN);
  } catch (e) {
    console.log(e);
  }
}



client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) { return; }

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

  } else if (interaction.commandName === 'showitems') {
    const user = await User.where('discordId').equals(interaction.user.id.toString());

    let arr_items = [];

    const embed = new EmbedBuilder()
      .setColor(0x1CDB00);
    user[0].items.forEach(element => {
      embed.addFields({ name: element.name, value: `[Website Link](${element.url})`, inline: false });
      embed.addFields({ name: " ", value: `- - Current Price: ${element.current.price} - - \n Lowest Price: ${element.lowest.price} \n  Highest Price: ${element.highest.price}`, inline: true });
      arr_items.push({ label: `Delete: ${element.name.slice(0, 40)}`, description: `${arr_items.length}`, value: `${arr_items.length}` })
    });

    const row_dropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("deletemenu")
        .setPlaceholder("Delete an Item")
        .addOptions(arr_items));

    await interaction.reply({ embeds: [embed], components: [row_dropdown], ephemeral: true });
    //setTimeout(() => interaction.deleteReply(), 45000);
  } else if (interaction.commandName === 'adminfetchall') {
    const user = await User.find({});
    // const embed = new EmbedBuilder().setColor(0xF2E30C).setTimestamp();
    const embed = [];
    user.forEach(element => {
      const temp = new EmbedBuilder().setColor(0xF2E30C).setTitle(element.discordId).setTimestamp();
      element.items.forEach((item) => {
        temp.addFields({ name: item.name, value: `>cur ${item.current.price} >low ${item.lowest.price} >hig ${item.highest.price}`, inline: false });
      });
      embed.push(temp);
    });
    await interaction.reply({ embeds: embed, ephemeral: true });
  }
});


client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isModalSubmit()) {
    const channel = client.channels.cache.get('1073243133346848771');
    if (interaction.customId === 'trackerform') {
      const url_sbmt = interaction.fields.getTextInputValue('input_url');

      await interaction.reply({ content: 'Requesting...', ephemeral: true });

      const site_valid = await Website_Validator(url_sbmt, interaction.user.id);
      const itemPrice = parseFloat(site_valid.price);
      const itemName = site_valid.name;
      const itemSelector = site_valid.selector;
      console.log(`${site_valid.accepted} : ${itemName} : ${itemPrice} : ${itemSelector}`);
      if (site_valid.accepted) {
        if (!await Database_Validation(url_sbmt, interaction.user.id)) {
          await interaction.editReply({ content: `Success! Adding to pool..`, ephemeral: true });
          await lib.Add_New_to_Database(interaction.user.id, url_sbmt, itemSelector, itemName);
          setTimeout(() => interaction.deleteReply(), 6000);
        } else {
          await interaction.editReply({ content: `Website already exists in your account!`, ephemeral: true });
          setTimeout(() => interaction.deleteReply(), 6000);
        }
      } else {
        await interaction.editReply({ content: `Website is invalid! Try again`, ephemeral: true });
        setTimeout(() => interaction.deleteReply(), 6000);
      }
    }
  }
  if (interaction.isStringSelectMenu()) {
    const selected = interaction.values[0];
    if (interaction.customId === 'deletemenu') {
      console.log(selected);
      lib.DeleteItem(interaction.user.id, selected);
    }


    await interaction.update({ content: "hello", ephemeral: true, components: [] });

    const user = await User.where('discordId').equals(interaction.user.id.toString());
    let arr_items = [];
    const embed = new EmbedBuilder()
      .setColor(0x1CDB00);
    user[0].items.forEach(element => {
      embed.addFields({ name: element.name, value: `[Website Link](${element.url})`, inline: false });
      embed.addFields({ name: " ", value: `- - Current Price: ${element.current.price} - - \n Lowest Price: ${element.lowest.price} \n  Highest Price: ${element.highest.price}`, inline: true });
      arr_items.push({ label: `Delete: ${element.name.slice(0, 40)}`, description: `${arr_items.length}`, value: `${arr_items.length}` })
    });
    const row_dropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("deletemenu")
        .setPlaceholder("Delete an Item")
        .addOptions(arr_items));
    await interaction.editReply({ embeds: [embed], components: [row_dropdown], ephemeral: true });
    setTimeout(() => interaction.deleteReply(), 10000);

  }

});


async function Run(discordid, item) {
  const url = item.url;
  const selector = item.selector;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const date = new Date();
  await page.goto(url,
    {
      waitUntil: "networkidle2",
      timeout: 0,
    });

  // await page.reload();
  await page.waitForSelector(selector)
  // evaluate and return text
  const value = await page.evaluate((selector) => {
    const bbb = document.querySelectorAll(selector)[0].innerText;
    // const bbb = document.querySelector(selector);
    console.log(bbb);
    return bbb;
  }, selector);
  await browser.close();

  const stri = value.replace('$', '').replace(',', '');

  const floatprice = parseFloat(stri);

  console.log(`Parser found: ${item.name} stri:${value} ${floatprice}`);
  if (!isNaN(floatprice)) {
    if (floatprice !== item.current.price) {
      if (floatprice >= item.current.price) {
        item.highest.price = floatprice;
        item.highest.date = date.toLocaleDateString();
      }
      if (floatprice <= item.current.price) {

        item.lowest.price = floatprice;
        item.lowest.date = date.toLocaleDateString();

        client.users.fetch(discordid).then((user) => {
          user.send(`Price Alert! Price low! \n $${item.name} \n $${floatprice} ${item.current.price} \n ${item.url})`);
        });

      }
      item.current.price = floatprice;
      item.current.date = date.toLocaleDateString();

    }
    if (item.lowest.price === 0) {
      item.lowest.price = item.current.price;
    }

    console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]${discordid} - ${item.name} \n ${item.current.price}`);
    // return floatprice;
    //   await browser.close();
  }else{
    console.log(`NaN detected! ${item.name}`);
  }
}

//
Run_Parse_Website();
//<<MAIN parser  

async function Run_Parse_Website() {
  try {
    // User.find({}, (err, resp) => {
    //   if (err) console.log(err);
    //   resp.forEach(async (element) => {
    //     for (let y = 0; y < element.items.length; y++) {
    //       await Run(element.discordId, element.items[y]);
    //       await element.save()
    //     }
    //   });
    // });
    const arr_usr = [];
    arr_usr = User.find({}, (err, resp) => {
      if (err) console.log(err);
      
    });
    arr_usr.forEach(async (element) => {
      for (let y = 0; y < element.items.length; y++) {
        await Run(element.discordId, element.items[y]);
        await element.save()
      }
    });

  } catch (e) {
    console.log(e);
  }
}

setInterval(async () => {

  await Run_Parse_Website();


}, 1800000);

async function GetWebsite_Selector(url){
  const nameSelector = "empty name";
  const priceView = "empty string price";
    if (url.includes("bestbuy.com")) {
      console.log('bestbuy site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll(".priceView-hero-price.priceView-customer-price span")[0].innerText;
        const nameElement = document.querySelector(".heading-5.v-fw-regular").innerText;
      });
    }
    else if (url.includes("lenovo.com")) {
      console.log('lenovo site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll(".final-price")[0].innerText;
        const nameElement = document.querySelector(".product_summary").innerText;
      });
    }
    else if (url.includes("microcenter.com")) {
      console.log('microcenter site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll(".big-price")[0].innerText;
        const nameElement = document.querySelector(".productTitle").textContent;
        console.log(priceElement);
        
      });
    }
    else if (url.includes("amazon.com")) {
      console.log('amazon site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll("span.a-offscreen")[0].innerText;
        const nameElement = document.querySelector("span#productTitle").textContent;
        console.log(priceElement);
       
      });
    }
    else if (url.includes("newegg.com")) {
      console.log('newegg site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll(".price-current")[0].innerText;
        const nameElement = document.querySelector(".product-title").textContent;
        console.log(priceElement);
        
      });
    }
    else if (url.includes("bhphotovideo.com")) {
      console.log('bhphoto site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll(".price_L0iytPTSvv")[0].innerText;
        const nameElement = document.querySelector("h1.text_TAw0W35QK_").textContent;
        console.log(priceElement);
        
      });
      // BH website not working
    }
    else if (url.includes("zotacstore.com")) {
      console.log('zotac store site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll("span.price")[0].innerText;
        const nameElement = document.querySelector(".product-name").textContent;
        console.log(priceElement);
       
      });
    }
    else if (url.includes("regie4233.github.io")) {
      console.log('bot test site detected');
      const value = await page.evaluate(() => {
        const priceElement = document.querySelectorAll("div.some-price")[0].innerText;
        const nameElement = document.querySelector(".mutitle").textContent;
        console.log(priceElement);
        
      });
    }
  
  return {nameSelector: "", priceSelector: ""}
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
    return { accepted: true, price: floatprice, name: val.retName, selector: val.retSelector };

  } catch (e) {
    return { accepted: false };
  }
}
//Website_Validator(
//  "https://www.bestbuy.com/site/samsung-galaxy-book3-ultra-16-3k-amoled-laptop-intel-13th-gen-evo-core-i9-13900h-32gb-nvidia-geforce-rtx-4070-1tb-ssd-graphite/6531066.p?skuId=6531066");

//Website_Validator("https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus?orgRef=https%253A%252F%252Fwww.digitaltrends.com%252F&clickid=RlEzS9RYTxyNUzp2dTyW1XwlUkA3yRwnPVQozI0&irgwc=1&PID=123412&acid=ww%3Aaffiliate%3Abv0as6&cid=us%3Aaffiliate%3Acxsaam");
async function comd() {
  await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: [] })
    .then(() => console.log('Successfully deleted guild command'))
    .catch(console.error);
}

async function getWebsite(url, page) {
  let value;
  if (url.includes("bestbuy.com")) {
    console.log('bestbuy site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".priceView-hero-price.priceView-customer-price span")[0].innerText;
      const nameElement = document.querySelector(".heading-5.v-fw-regular").innerText;
      return { retPrice: priceElement, retName: nameElement, retSelector: ".priceView-hero-price.priceView-customer-price span" };
    });
  }
  else if (url.includes("lenovo.com")) {
    console.log('lenovo site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".final-price")[0].innerText;
      const nameElement = document.querySelector(".product_summary").innerText;
      return { retPrice: priceElement, retName: nameElement, retSelector: ".final-price" };
    });
  }
  else if (url.includes("microcenter.com")) {
    console.log('microcenter site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".big-price")[0].innerText;
      const nameElement = document.querySelector(".productTitle").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: ".big-price" };
    });
  }
  else if (url.includes("amazon.com")) {
    console.log('amazon site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll("span.a-offscreen")[0].innerText;
      const nameElement = document.querySelector("span#productTitle").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: "span.a-offscreen" };
    });
  }
  else if (url.includes("newegg.com")) {
    console.log('newegg site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".price-current")[0].innerText;
      const nameElement = document.querySelector(".product-title").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: ".price-current-label" };
    });
  }
  else if (url.includes("bhphotovideo.com")) {
    console.log('bhphoto site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll(".price_L0iytPTSvv")[0].innerText;
      const nameElement = document.querySelector("h1.text_TAw0W35QK_").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: ".price_L0iytPTSvv" };
    });
    // BH website not working
  }
  else if (url.includes("zotacstore.com")) {
    console.log('zotac store site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll("span.price")[0].innerText;
      const nameElement = document.querySelector(".product-name").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: ".span.price" };
    });
  }
  else if (url.includes("regie4233.github.io")) {
    console.log('bot test site detected');
    value = await page.evaluate(() => {
      const priceElement = document.querySelectorAll("div.some-price")[0].innerText;
      const nameElement = document.querySelector(".mutitle").textContent;
      console.log(priceElement);
      return { retPrice: priceElement, retName: nameElement, retSelector: "div.some-price" };
    });
  }
  // else if (url.includes("clock.zone")) {
  //   console.log('test site detected');
  //   value = await page.evaluate(() => {
  //     const priceElement = document.querySelectorAll("#mm")[0].innerText;
  //     const nameElement = "test using time"
  //     console.log(priceElement);
  //     return { retPrice: priceElement, retName: nameElement, retSelector: "#mm" };
  //   });
  // }
  console.log(value);
  return value;
}

async function Database_Validation(url, discordid) {
  if (await User.exists({ discordId: discordid })) {
    const user = await User.where('discordId').equals(discordid.toString());
    // console.log(user[0]);
    for (let i = 0; i < user[0].items.length; i++) {
      if (user[0].items[i].url === url) {
        //item match deny
        return true;
      }
    }
    //no item match proceed
    return false;
  } else {
    console.log("User does not exiist creating user..");
    lib.Add_New_User(discordid);
    return false;
  }
}

