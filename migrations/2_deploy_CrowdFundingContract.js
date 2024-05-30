const CrowdFundingContract = artifacts.require("CrowdFundingContract");
module.exports = function(deployer){
    deployer.deploy(CrowdFundingContract);
};
