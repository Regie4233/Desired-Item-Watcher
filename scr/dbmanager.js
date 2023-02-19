const mongoose = require('mongoose');
const { update } = require('./user_model');
const User = require('./user_model');
mongoose.connect("mongodb://localhost/sw-usersDb", (x) => {
    console.log(`Database connected`);
});


async function exe_command() {
    try {
        // const user = await User.create({
        //     discordId: '726243976927248412',
        //     items: [
        //         {
        //             url: 'https://www.lenovo.com/us/en/p/laptops/thinkpad/thinkpadx1/x1-extreme-g4/20y5007jus',
        //             selector: '.final-price',
        //             name: 'Lenovo X1 Extreme',
        //             lowest: { price: 0, date: "no value" },
        //             highest: { price: 0, date: "no value" },
        //             current: { price: 0, date: "no value" }
        //         },
        //         {
        //             url: 'https://www.microcenter.com/product/660836/asus-nvidia-geforce-rtx-4080-tuf-gaming-overclocked-triple-fan-16gb-gddr6x-pcie-40-graphics-card',
        //             selector: '.big-price',
        //             name: 'Nvidia 4080',
        //             lowest: { price: 0, date: "no value" },
        //             highest: { price: 0, date: "no value" },
        //             current: { price: 0, date: "no value" }
        //         }
        //     ]
        // })

        // console.log(user);
        // const user = await User.where("discordId").equals("726243976927248412");
        // const itemtoadd = 
        // {
        // url: 'https://www.microcenter.com/product/650116/asus-zenbook-pro-16x-oled-ux7602zm-xb96t-160-laptop-computer-black',
        //             selector: '.big-price',
        //             name: 'Asus Zenbook OLED 16x 3060 i9',
        //             lowest: { price: 0, date: "no value" },
        //             highest: { price: 0, date: "no value" },
        //             current: { price: 0, date: "no value" }
        // }
        // user[0].items.push(itemtoadd);
        // await user[0].save();
        // console.log(user);
        // const user = await User.where('discordId').equals('726243976927248412');

        // const res = await user[0].items.pull({ _id: '63ea5764f853815ee4de7ace' });

        const user = await User.where('discordId').equals('726243976927248412');
        user[0].items[0].current.price = 0;
        console.log(user[0].items[0].current.price);
        user[0].save();

    } catch (x) {
        console.log(x.message);

    }
}


async function Add_New_User(disId) {
    console.log(`DB adding ${disId}`);
    const user = await User.create({
        discordId: disId,
        items: []
    });
    user.save();
}

async function Add_New_to_Database(disId, url, selector, itemName) {
    const user = await User.where("discordId").equals(disId);
    if (user[0]) {
        if (ValidateUrl(url, user[0])) {
            return;
        }
        
        console.log(`Adding new Item: ${itemName}`);
        const itemtoadd = {
            url: url,
            selector: selector,
            name: itemName,
            lowest: { price: 0, date: "no value" },
            highest: { price: 0, date: "no value" },
            current: { price: 0, date: "no value" }
        }
        user[0].items.push(itemtoadd);
        await user[0].save();
        console.log("Item Added");
    } else {
        console.log("Item Did not add no user");
    }

}


function ValidateUrl(toValidate, user) {

    for (let i = 0; i < user.items.length; i++) {
        const string1 = toValidate;
        const string2 = user.items[i].url;
        console.log(`${user.items[i].url} -> ${toValidate}`);
        const comp = string2.localeCompare(string1);
        if (comp === 0) {
            return true;
        }
    }
    return false;
}

module.exports = { Add_New_to_Database, Add_New_User };

