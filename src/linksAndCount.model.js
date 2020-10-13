const mongoose = require("mongoose");

let linksAndCountSchema = mongoose.Schema({
    url: String,
    count: Number,
    uniqueParams: Array
});

const LinksAndCountModel = mongoose.model("LinksAndCount", linksAndCountSchema);

module.exports = {LinksAndCountModel};