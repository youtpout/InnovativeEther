// SPDX-License-Identifier: MIT
// Credits Eddy Boughioul
pragma solidity =0.8.18;

contract InnovativeETH {
    string public name = "Innovative Ether";
    string public symbol = "IETH";
    uint8 public decimals = 18;
    uint256 public constant maxValue = 2 ** 256 - 1;

    event Approval(address indexed src, address indexed guy, uint wad);
    event Transfer(address indexed src, address indexed dst, uint wad);
    event Deposit(address indexed dst, uint wad);
    event Withdrawal(address indexed src, uint wad);

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    bytes32 constant depositTopic =
        0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c;
    bytes32 constant transferTopic =
        0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;
    bytes32 constant withdrawalTopic =
        0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65;
    bytes32 constant approvalTopic =
        0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925;

    receive() external payable {
        deposit();
    }

    function deposit() public payable {
        assembly {
            mstore(0x0, caller())
            mstore(0x20, balanceOf.slot)

            let balanceHash := keccak256(0x0, 0x40)

            let balanceValue := sload(balanceHash)
            // balanceOf[msg.sender] += msg.value;
            sstore(balanceHash, add(balanceValue, callvalue()))

            mstore(0x100, callvalue())
            //emit Deposit(msg.sender, msg.value);
            log2(0x100, 0x20, depositTopic, caller())
        }
    }

    function withdraw(uint wad) public {
        assembly {
            mstore(0x0, caller())
            mstore(0x20, balanceOf.slot)
            let balanceHashSrc := keccak256(0x0, 0x40)
            let balanceValueSrc := sload(balanceHashSrc)
            //  require(balanceOf[msg.sender] >= wad);
            if lt(balanceValueSrc, wad) {
                revert(0, 0)
            }
            // balanceOf[msg.sender] -= wad;
            sstore(balanceHashSrc, sub(balanceValueSrc, wad))

            // payable(msg.sender).transfer(wad)
            let result := call(gas(), caller(), wad, 0, 0, 0, 0)
            // check if call was succesfull, else revert
            if iszero(result) {
                revert(0, 0)
            }

            //  emit Withdrawal(msg.sender, wad);
            mstore(0x100, wad)
            log2(0x100, 0x20, withdrawalTopic, caller())
        }
    }

    function totalSupply() public view returns (uint) {
        return address(this).balance;
    }

    function approve(address guy, uint wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(address dst, uint wad) public returns (bool) {
        return transferFrom(msg.sender, dst, wad);
    }

    function transferFrom(
        address src,
        address dst,
        uint wad
    ) public returns (bool) {
        assembly {
            //   require(dst != address(0) && dst != address(this));
            if iszero(dst) {
                revert(0, 0)
            }
            if eq(dst, address()) {
                revert(0, 0)
            }

            // src != msg.sender
            if iszero(eq(src, caller())) {
                // get allowance
                mstore(0x0, src)
                mstore(0x20, allowance.slot)
                let allowanceAccountSrc := keccak256(0x0, 0x40)
                mstore(0x0, caller())
                mstore(0x20, allowanceAccountSrc)
                let approveSlot := keccak256(0x0, 0x40)
                let balanceApproved := sload(approveSlot)
                // && allowance[src][msg.sender] != type(uint256).max
                if iszero(eq(balanceApproved, maxValue)) {
                    if lt(balanceApproved, wad) {
                        // require(allowance[src][msg.sender] >= wad);
                        revert(0, 0)
                    }
                    //   allowance[src][msg.sender] -= wad;
                    sstore(approveSlot, sub(balanceApproved, wad))
                }
            }

            mstore(0x0, src)
            mstore(0x20, balanceOf.slot)
            let balanceHashSrc := keccak256(0x0, 0x40)
            let balanceValueSrc := sload(balanceHashSrc)
            // require(balanceOf[src] >= wad);
            if lt(balanceValueSrc, wad) {
                revert(0, 0)
            }
            // balanceOf[src] -= wad
            sstore(balanceHashSrc, sub(balanceValueSrc, wad))

            // balanceOf[dst] += wad
            mstore(0x0, dst)
            let balanceHashDst := keccak256(0x0, 0x40)
            let balanceValueDst := sload(balanceHashDst)
            sstore(balanceHashDst, add(balanceValueDst, wad))

            // emit Transfer(src, dst, wad);
            mstore(0x100, wad)
            log3(0x100, 0x20, transferTopic, src, dst)

            // return true;
            mstore(0, 1)
            return(0, 0x20)
        }
    }
}
