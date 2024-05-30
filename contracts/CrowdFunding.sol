// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract CrowdFundingContract {
    enum CampaignStatus {Completed, Inprogress}

    uint campaignCount;

    // Constructor code is only run when the contract is created
    constructor() {
        campaignCount = 0;
    }

    // Declaring a structure CampaignDetails
    struct CampaignDetails {
        uint campaignId;
        string name;
        string image;
        uint targetAmt;
        uint deadline;
        string location;
        uint amountCollected;
        address[] donators;
        uint256[] donations;
        CampaignStatus status;
    }

    mapping (uint => CampaignDetails) public listOfCampaigns;

    function incrementCampaignCount() internal {
        campaignCount += 1;
    }

    // Function to obtain the campaign count
    function getNoOfCampaigns() public view returns (uint) {
        return campaignCount;
    }

    event CampaignCreated(
        uint campaignId,
        string name,
        string image,
        uint targetAmt,
        uint deadline,
        string location,
        address ownerId,
        CampaignStatus status
    );

    // Function to add a campaign
    function addCampaign(
        string memory _name,
        string memory _image,
        uint _targetAmt,
        uint _deadline,
        string memory _location
    ) public {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        incrementCampaignCount();
        // Initialize dynamic arrays separately
        address[] memory emptyAddresses;
        uint256[] memory emptyDonations;
        listOfCampaigns[campaignCount] = CampaignDetails(
            campaignCount,
            _name,
            _image,
            _targetAmt,
            _deadline,
            _location,
            0, // amountCollected initially 0
            emptyAddresses, // empty array for donators
            emptyDonations, // empty array for donations
            CampaignStatus.Inprogress // initially set to Inprogress
        );
        emit CampaignCreated(
            campaignCount,
            _name,
            _image,
            _targetAmt,
            _deadline,
            _location,
            msg.sender,
            CampaignStatus.Inprogress
        );
    }

    event CampaignFunded(
        uint campaignId,
        uint amount,
        address donator,
        uint totalAmountCollected
    );

    // Function to fund a campaign
    function fundCampaign(uint _campaignId) public payable {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        CampaignDetails storage campaign = listOfCampaigns[_campaignId];
        require(campaign.status == CampaignStatus.Inprogress, "Campaign not in progress");
        require(msg.value > 0, "Invalid donation amount");

        // Update campaign details
        campaign.amountCollected += msg.value;
        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);

        emit CampaignFunded(_campaignId, msg.value, msg.sender, campaign.amountCollected);
    }

    function getDonators(uint _campaignId) public view returns (address[] memory) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        return listOfCampaigns[_campaignId].donators;
    }

    // Function that sets the campaign status to “Completed”
    function setCampaignCompleted(uint _campaignId) public {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        CampaignDetails storage campaign = listOfCampaigns[_campaignId];
        campaign.status = CampaignStatus.Completed;
    }

    // Function to retrieve the current availability of the campaign
    function getCampaignAvailability(uint _campaignId) public view returns(CampaignStatus) {
        require(_campaignId > 0 && _campaignId <= campaignCount, "Invalid campaign ID");
        return listOfCampaigns[_campaignId].status;
    }
}



