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

        it("Deposit", async function () {
            const balanceBefore = await innovativeETH.balanceOf(owner.address);
            expect(balanceBefore).to.be.equal(0);

            const amount = utils.parseEther("555.123");
            var tx = await innovativeETH.deposit({ value: amount });
            await tx.wait();

            var balanceAfter = await innovativeETH.balanceOf(owner.address);
            expect(balanceAfter).to.be.equal(amount);
        });

    });

});