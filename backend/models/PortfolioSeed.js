const mongoose = require("mongoose");

const portfolioSeedSchema = new mongoose.Schema({ key:{type:String,unique:true} });
const PortfolioSeed = mongoose.model("PortfolioSeed", portfolioSeedSchema);

module.exports = PortfolioSeed;
