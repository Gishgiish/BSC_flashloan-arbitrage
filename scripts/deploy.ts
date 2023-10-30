import { ethers } from "hardhat";



//For mainnet npx hardhat run scripts/deploy.ts --network mainnet
//DEPLOYED CONTRACT ADDRESS:
async function main(){
  const [deployer] = await ethers.getSigners();
  const deployerBalance = (await deployer.getBalance()).toString();
  console.log("Signer Account balance:", deployerBalance);

  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
  const FlashLoan = await ethers.getContractFactory("FlashLoan");
  const flashloan = await FlashLoan.deploy(WBNB, BUSD, 500);
  await flashloan.deployed();
  console.log("FlashLoan Contract Deployed \t: ", flashloan.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });