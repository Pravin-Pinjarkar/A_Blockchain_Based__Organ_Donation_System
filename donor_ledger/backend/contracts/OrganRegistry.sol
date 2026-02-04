// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrganRegistry {

    struct TransactionRecord {
        string donorId;
        string patientId;
        address hospital;
        uint timestamp;
        string txHash;
    }

    event DonorRegistered(uint indexed donorId, address indexed account, uint8 organ, uint8 blood, bool deceased);
    event PatientRegistered(uint indexed patientId, address indexed account, uint8 organ, uint8 blood, uint8 urgency);
    event MatchMade(uint indexed donorId, uint indexed patientId, uint8 organ);

    // 🔥 FIXED — flat params (NO struct emission)
    event TransactionRecorded(
        string donorId,
        string patientId,
        address hospital,
        string txHash
    );

    TransactionRecord[] public transactions;

    function recordMatch(
        string calldata donorId,
        string calldata patientId,
        string calldata txHash
    ) external {
        transactions.push(
            TransactionRecord({
                donorId: donorId,
                patientId: patientId,
                hospital: msg.sender,
                timestamp: block.timestamp,
                txHash: txHash
            })
        );

        // 🔥 EMIT FLAT VALUES (frontend readable)
        emit TransactionRecorded(donorId, patientId, msg.sender, txHash);
    }

    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }
}
