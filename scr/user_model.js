const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    price: Number,
    date: String
});
const itemSchema = new mongoose.Schema({
    url: String,
    selector: String,
    name: String,
    lowest: priceSchema,
    highest: priceSchema,
    current: priceSchema

});


const userSchema = new mongoose.Schema({
    discordId: String,
    items: [itemSchema]
});

module.exports = mongoose.model("User", userSchema);