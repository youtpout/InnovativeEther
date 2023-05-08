import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { BigNumber, Transaction, utils } from "ethers";
import { TransactionReceipt } from "@ethersproject/providers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { InnovativeETH } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Swap", function () {
    var innovativeETH: InnovativeETH;
    var addressIETH = "";
    var owner: SignerWithAddress, bob: SignerWithAddress, alice: SignerWithAddress;

    beforeEach(async function () {

        // Contracts are deployed using the first signer/account by default
        [owner, bob, alice] = await ethers.getSigners();

        const WETH = await ethers.getContractFactory("InnovativeETH");
        innovativeETH = await WETH.deploy();
        addressIETH = innovativeETH.address;

    })

    describe("Test Contract", function () {


        it("Infos", async function () {

            const name = await innovativeETH.name();
            const symbol = await innovativeETH.symbol();
            const decimals = await innovativeETH.decimals();
            expect(name).to.be.equal("Innovative Ether");
            expect(symbol).to.be.equal("IETH");
            expect(decimals).to.be.equal(decimals);
        });

        it("Deposit", async function () {

            // check balance before deposit
            const balanceBeforeEth = await ethers.provider.getBalance(owner.address);

            const balanceBefore = await innovativeETH.balanceOf(owner.address);
            expect(balanceBefore).to.be.equal(0);

            // call deposit function
            const amount = utils.parseEther("555.123");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();
            const gasSpend = totalGasWei(receipt);

            // check if the balance of the user correctly updated
            const balanceAfterEth = await ethers.provider.getBalance(owner.address);
            const balanceExpectedEth = balanceBeforeEth.sub(amount).sub(gasSpend);
            expect(balanceAfterEth).to.be.equal(balanceExpectedEth);

            // check if the innovative ether has the correct amount
            const balanceAfter = await innovativeETH.balanceOf(owner.address);
            expect(balanceAfter).to.be.equal(amount);
        });


        it("Receive", async function () {

            // check balance before deposit
            const balanceBeforeEth = await ethers.provider.getBalance(owner.address);

            const balanceBefore = await innovativeETH.balanceOf(owner.address);
            expect(balanceBefore).to.be.equal(0);

            // call receive function
            const amount = utils.parseEther("555.123");
            const tx = await owner.sendTransaction({ to: addressIETH, value: amount });
            const receipt = await tx.wait();
            const gasSpend = totalGasWei(receipt);

            // check if the balance of the user correctly updated
            const balanceAfterEth = await ethers.provider.getBalance(owner.address);
            const balanceExpectedEth = balanceBeforeEth.sub(amount).sub(gasSpend);
            expect(balanceAfterEth).to.be.equal(balanceExpectedEth);

            // check if the innovative ether has the correct amount
            const balanceAfter = await innovativeETH.balanceOf(owner.address);
            expect(balanceAfter).to.be.equal(amount);
        });

        it("Withdraw", async function () {
            // check balance before deposit
            const balanceBeforeEth = await ethers.provider.getBalance(owner.address);

            const balanceBefore = await innovativeETH.balanceOf(owner.address);
            expect(balanceBefore).to.be.equal(0);

            // call deposit function
            const amount = utils.parseEther("555.123");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();

            // check if deposit worked correctly
            const balanceAfter = await innovativeETH.balanceOf(owner.address);
            expect(balanceAfter).to.be.equal(amount);

            // withdraw
            const tx2 = await innovativeETH.withdraw(amount);
            const receipt2 = await tx2.wait();

            // check if withdraw worked correctly
            const balanceAfterEth = await ethers.provider.getBalance(owner.address);
            const balanceExpectedEth = balanceBeforeEth.sub(totalGasWei(receipt)).sub(totalGasWei(receipt2));
            expect(balanceAfterEth).to.be.equal(balanceExpectedEth);

            const balanceEnd = await innovativeETH.balanceOf(owner.address);
            expect(balanceEnd).to.be.equal(0);
        });

        it("Supply", async function () {

            // call deposit function
            const amount = utils.parseEther("12.111");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();

            const amount2 = utils.parseEther("8.25");
            const tx2 = await innovativeETH.connect(bob).deposit({ value: amount2 });
            const receipt2 = await tx2.wait();

            const amount3 = utils.parseEther("2.15");
            const tx3 = await innovativeETH.withdraw(amount3);
            const receipt3 = await tx3.wait();


            // check if the supply is correct worked correctly
            const supply = await innovativeETH.totalSupply();
            const expectedSupply = amount.add(amount2).sub(amount3);
            expect(supply).to.be.equal(expectedSupply);

        });

        it("Approve", async function () {
            // call deposit function
            const amount = utils.parseEther("12.111");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();

            // call approve
            const tx2 = await innovativeETH.approve(bob.address, amount);
            const receipt2 = await tx.wait();

            // check allowance
            const allowance = await innovativeETH.allowance(owner.address, bob.address);
            expect(allowance).to.be.equal(amount);
        });

        it("Transfer", async function () {
            // call deposit function
            const amount = utils.parseEther("12.111");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();

            // call transfer
            const tx3 = await innovativeETH.transfer(bob.address, amount);
            const receipt3 = await tx.wait();

            // check balance
            const balance = await innovativeETH.balanceOf(bob.address);
            expect(balance).to.be.equal(amount);
        });

        it("Transfer From", async function () {
            // call deposit function
            const amount = utils.parseEther("12.111");
            const tx = await innovativeETH.deposit({ value: amount });
            const receipt = await tx.wait();

            // call approve
            const tx2 = await innovativeETH.approve(bob.address, amount);
            const receipt2 = await tx.wait();

            // call transfer
            const tx3 = await innovativeETH.connect(bob).transferFrom(owner.address, bob.address, amount);
            const receipt3 = await tx.wait();

            // check balance
            const balance = await innovativeETH.balanceOf(bob.address);
            expect(balance).to.be.equal(amount);
        });

    });

});

function totalGasWei(tx: TransactionReceipt) {
    if (tx.gasUsed && tx.effectiveGasPrice) {
        return tx.gasUsed.mul(tx.effectiveGasPrice);
    }
    return BigNumber.from(0);
}