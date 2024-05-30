const CrowdFundingContract = artifacts.require("./CrowdFundingContract.sol");

contract("CrowdFundingContract", (accounts) => {
    let crowdFunding;
    const owner = accounts[0];
    const donor = accounts[1];
    const anotherDonor = accounts[2];

    before(async () => {
        crowdFunding = await CrowdFundingContract.deployed();
    });

    describe("Deployment", async () => {
        it("should deploy successfully and initialize campaign count to 0", async () => {
            const campaignCount = await crowdFunding.getNoOfCampaigns();
            assert.equal(campaignCount.toNumber(), 0, "Initial campaign count should be 0");
        });
    });

    describe("Adding Campaigns", async () => {
        let campaignId;

        it("should add a campaign successfully", async () => {
            const result = await crowdFunding.addCampaign(
                "Save the Elephants",
                "elephant.jpg",
                web3.utils.toWei("10", "ether"),
                Math.floor(Date.now() / 1000) + 86400, // 1 day from now in seconds
                "Africa",
                { from: owner }
            );

            campaignId = result.logs[0].args.campaignId.toNumber();
            const campaign = await crowdFunding.listOfCampaigns(campaignId);

            assert.equal(campaign.name, "Save the Elephants", "Campaign name is correct");
            assert.equal(campaign.image, "elephant.jpg", "Campaign image is correct");
            assert.equal(campaign.targetAmt.toString(), web3.utils.toWei("10", "ether"), "Campaign target amount is correct");
            assert.equal(campaign.location, "Africa", "Campaign location is correct");
            assert.equal(campaign.amountCollected.toString(), "0", "Initial amount collected is 0");
            assert.equal(campaign.status.toString(), "1", "Campaign status is Inprogress");
        });

        it("should not create a campaign with an invalid deadline", async () => {
            try {
                await crowdFunding.addCampaign(
                    "Invalid Campaign",
                    "invalid.jpg",
                    web3.utils.toWei("5", "ether"),
                    Math.floor(Date.now() / 1000) - 86400, // 1 day ago in seconds
                    "Nowhere",
                    { from: owner }
                );
                assert.fail("Campaign with invalid deadline should not be created");
            } catch (error) {
                assert(error.message.includes("Deadline must be in the future"), "Expected revert, got: " + error.message);
            }
        });
    });

    describe("Funding Campaigns", async () => {
        let campaignId;

        before(async () => {
            const result = await crowdFunding.addCampaign(
                "Save the Tigers",
                "tiger.jpg",
                web3.utils.toWei("5", "ether"),
                Math.floor(Date.now() / 1000) + 86400, // 1 day from now in seconds
                "Asia",
                { from: owner }
            );
            campaignId = result.logs[0].args.campaignId.toNumber();
        });

        it("should not fund campaign with zero amount", async () => {
            try {
                await crowdFunding.fundCampaign(campaignId, { from: donor, value: 0 });
                assert.fail("Funding with zero amount should fail");
            } catch (error) {
                assert(error.message.includes("Invalid donation amount"), "Expected revert, got: " + error.message);
            }
        });

        it("should fund campaign and check if donor is added", async () => {
            const donationAmount = web3.utils.toWei("1", "ether");
            const result = await crowdFunding.fundCampaign(campaignId, { from: donor, value: donationAmount });

            if (!result) {
                throw new Error("Funding campaign failed!");
            }

            const campaign = await crowdFunding.listOfCampaigns(campaignId);
            assert.equal(campaign.amountCollected.toString(), donationAmount, "Amount collected is updated");
            const donators = await crowdFunding.getDonators(campaignId);
            assert.equal(donators[0], donor, "Donor address is recorded");
        });

        it("should allow multiple donations and update amount collected", async () => {
            const additionalDonation = web3.utils.toWei("2", "ether");
            await crowdFunding.fundCampaign(campaignId, { from: anotherDonor, value: additionalDonation });

            const campaign = await crowdFunding.listOfCampaigns(campaignId);
            const totalAmountCollected = web3.utils.toBN(web3.utils.toWei("3", "ether")); // 1 + 2 ethers
            assert.equal(campaign.amountCollected.toString(), totalAmountCollected.toString(), "Total amount collected is correct");
            const donators = await crowdFunding.getDonators(campaignId);
            assert.equal(donators[1], anotherDonor, "Second donor address is recorded");
        });

        it("should not fund a completed campaign", async () => {
            await crowdFunding.setCampaignCompleted(campaignId);

            const newDonation = web3.utils.toWei("1", "ether");
            try {
                await crowdFunding.fundCampaign(campaignId, { from: donor, value: newDonation });
                assert.fail("Funding a completed campaign should fail");
            } catch (error) {
                assert(error.message.includes("Campaign not in progress"), "Expected revert, got: " + error.message);
            }
        });
    });

    describe("Campaign Status", async () => {
        let campaignId;

        before(async () => {
            const result = await crowdFunding.addCampaign(
                "Save the Whales",
                "whale.jpg",
                web3.utils.toWei("15", "ether"),
                Math.floor(Date.now() / 1000) + 86400, // 1 day from now in seconds
                "Oceans",
                { from: owner }
            );
            campaignId = result.logs[0].args.campaignId.toNumber();
        });

        it("should retrieve the correct campaign status", async () => {
            const status = await crowdFunding.getCampaignAvailability(campaignId);
            assert.equal(status.toString(), "1", "Campaign status is Inprogress");
        });

        it("should set the campaign status to Completed", async () => {
            await crowdFunding.setCampaignCompleted(campaignId);
            const status = await crowdFunding.getCampaignAvailability(campaignId);
            assert.equal(status.toString(), "0", "Campaign status is Completed");
        });
    });
});



                    






