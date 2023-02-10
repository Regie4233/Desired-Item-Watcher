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

    m.reply("Fetching Price..");

    console.log("Working on price");
    checkPrice().then((a) => {
      m.reply(`Current Price: ${a}`);
      working = false;
    });
  } 
});

client.login(process.env.TOKEN);



async function checkPrice() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus');
    //await page.goto('https://www.google.com/search?q=time&client=ms-android-hms-tmobile-us&sxsrf=AJOqlzVeVY8Y_qvgIALqiYprILtP7rIkbA%3A1675962794188&ei=qinlY-yVC5mv5NoP0aG42A8&ved=0ahUKEwjskoT494j9AhWZF1kFHdEQDvsQ4dUDCBA&uact=5&oq=time&gs_lcp=Cgxnd3Mtd2l6LXNlcnAQAzIFCAAQkQIyBQgAEJECMgoIABCxAxCDARBDMgQIABBDMgUIABCABDIHCAAQsQMQQzILCC4QgAQQxwEQrwEyBAgAEEMyCwgAEIAEELEDEIMBMgUIABCABDoECCMQJzoOCC4QgAQQsQMQxwEQ0QM6CAgAELEDEIMBOg4ILhDHARCxAxDRAxCABDoLCC4QgAQQsQMQgwE6CAguEIAEELEDOggIABCABBCxA0oECEEYAEoECEYYAFAAWOcEYJYGaABwAXgAgAGXAYgB2QOSAQMxLjOYAQCgAQHAAQE&sclient=gws-wiz-serp');

    await page.reload();


    const aaa = await page.evaluate(() => {
        const bbb = document.querySelector('.final-price');
        const text = bbb.innerText;
        return text;
    });
    console.log(aaa);
    return aaa;
    await browser.close();
}

setInterval(async () => {
    let resp = await checkPrice();
    console.log(resp);
    if (current !== resp) {
        current = resp;
        const chanl = client.channels.cache.get('1073243133346848771');
        chanl.send(resp);
    }

}, 8000);
