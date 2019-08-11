var BZxTo0xV2 = artifacts.require("BZxTo0xV2");
var BZxOwnable = artifacts.require("BZxOwnable");
var ExchangeV2Interface = artifacts.require("ExchangeV2Interface");

module.exports = function(deployer) {
    deployer.deploy(ExchangeV2Interface);
    deployer.deploy(BZxTo0xV2);
}