import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { ContractFactory, Signer } from "ethers";
//import { ERC20 } from "../artifacts/@openzeppelin/contracts/token/ERC20.sol";

import { abi as abiFlashLoan } from "../artifacts/contracts/FlashLoan.sol/Flashloan.json";
//import { abi as abiBUSDContract } from "..artifacts/BUSDContract.json";

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";

const WHALE_ADDRESS_BUSD = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; //insert user address or address with the busd
const FLASH_CONTRACT = "";//only use when deployed otherwise leave blank


//Initialize Flash Loan Params
const path = [CAKE, WBNB];
const exchRoute = [1, 0, 0];
const v3Fee = 500;
const payContractAmount = "0"; //set to zero for profitability

//Token selection
const BORROW_TOKEN_BUSD = BUSD; //specify coin to be collected



describe("BinanceFlashloanPancakeSwapV3", function(){
 async function create_whale() {

        //connect to local forked test network(i.e. do not use getDefaultProvider)
     const provider = ethers.provider;

        //ensure bnb balance not zero (for making transactions)
     const whaleBalance = await provider.getBalance(WHALE_ADDRESS_BUSD);
     expect(whaleBalance).not.equal("0");

        //impersonate wallet Account
     await network.provider.request({
         method: "hardhat_impersonateAccount",
         params: [WHALE_ADDRESS_BUSD],

        });
        
     const WhaleWallet = ethers.provider.getSigner(WHALE_ADDRESS_BUSD);
     expect(WhaleWallet.getBalance()).not.equal("0");

        //Ensure BUSD balance
     const abi = [
            "function balance(address _owner) view returns (unit256 balance)",
    ];
     const contractBusd = new ethers.Contract(BORROW_TOKEN_BUSD, abi, provider);
     const balanceBusd = await contractBusd.balanceOf(WHALE_ADDRESS_BUSD);
     expect(balanceBusd).not.equal("0");

     //Return whalewallet
     return { WhaleWallet };
}

    describe("Deployment", function () {
        it("Should perform a FlashLoan using Pancake V3", async function (){
            let { WhaleWallet } = await loadFixture(create_whale);
            //deploys
            const FlashLoan = await ethers.getContractFactory("FlashLoan");
            let flashloan = await FlashLoan.deploy(WBNB, BUSD, 500);
            await flashloan.deployed();
            console.log("FlashLoan Contract Deployed: /t", flashloan.address);

            //Decide whether to use Live or newly deployed contract
            let flashAddress = 
            FLASH_CONTRACT.length > 0 ? FLASH_CONTRACT : flashloan.address;

            //send more BUSD to the smart contract
            //This ensures Flashloan is always paid in full
            let usdtAmt = ethers.utils.parseUnits(payContractAmount, 18);
            const abi = [
                "function transfer(address _to, uint256 _value) public returns (bool success)",
                "function balanceOf(address _owner) view returns (uint256 balance)",
            ];
            const contractUsdt = new ethers.Contract(
                BORROW_TOKEN_BUSD,
                abi,
                WhaleWallet
            );
            const txTferUsdt = await contractUsdt.transfer(flashloan.address, usdtAmt);
            const recieptTxUsdt = await txTferUsdt.wait();
            expect(recieptTxUsdt.status).to.eql(1);

            // Print starting BUSD balance
            let contractBalUsdt = await contractUsdt.balanceOf(flashloan.address);
            console.log("Flash Contract BUSD: \t\t", contractBalUsdt);

             //print starting BUSD balance
            let whaleBalUsdt = await contractUsdt.balanceOf(WhaleWallet._address);
            console.log("Flash Contract BUSD: \t\t\t", whaleBalUsdt);

            //initialize flashloan
            const amountBorrow = ethers.utils.parseUnits("20", 18); // Replace with your desired input amount
            const tokenPath = path; // Replace with your token addresses
            const routing = exchRoute; // Replace with 0 for PancakeSwap V2 or 1 for V3
            const feeV3 = v3Fee; // Replace with your desired fee value

            //connect to Flashloan contract
            const contractFlashLoan = new ethers.Contract(
               flashAddress,
               abiFlashLoan, 
               WhaleWallet
        );
        
            //send Flashloan transaction
            //call Flashloan Request Function
            const txFlashloan = await contractFlashLoan.flashloanRequest(
                tokenPath,
                0,
                amountBorrow,
                feeV3,
                routing
        );
         //show results
            const txFlashloanReceipt = await txFlashloan.wait();
            expect(txFlashloanReceipt.status).to.eql(1);

            whaleBalUsdt = await contractUsdt.balnaceOf(WhaleWallet._address);
            console.log("");
            console.log("Wallet BUSD: ", whaleBalUsdt);
        
            
         });
    });
});
    

