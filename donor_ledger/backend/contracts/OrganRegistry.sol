// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrganRegistry {

    /* ================= EXISTING STRUCT ================= */
    struct TransactionRecord {
        string donorId;
        string patientId;
        address hospital;
        uint timestamp;
        string txHash;
    }

    TransactionRecord[] public transactions;

    /* ================= NEW SHIPMENT STRUCT ================= */
    struct Shipment {
        uint id;
        address sender;
        address receiver;
        string pickupTime;
        uint distance;
        uint price;
        uint timestamp;
    }

    Shipment[] public shipments;

    uint public shipmentCount;

    /* ================= EVENTS ================= */

    event TransactionRecorded(
        string donorId,
        string patientId,
        address hospital,
        string txHash
    );

    event ShipmentCreated(
        uint shipmentId,
        address sender,
        address receiver,
        string pickupTime,
        uint distance,
        uint price,
        uint timestamp
    );

    // ✅ START SHIPMENT EVENT
    event ShipmentStarted(
        address sender,
        address receiver,
        string recipientId
    );

    // ✅ NEW COMPLETE SHIPMENT EVENT
    event ShipmentCompleted(
        address sender,
        address receiver,
        string recipientId
    );

    /* ================= MATCH FUNCTION ================= */

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

        emit TransactionRecorded(donorId, patientId, msg.sender, txHash);
    }

    /* ================= CREATE SHIPMENT ================= */

    function createShipment(
        address _receiver,
        string calldata _pickupTime,
        uint _distance,
        uint _price
    ) external {
        shipmentCount++;

        shipments.push(
            Shipment({
                id: shipmentCount,
                sender: msg.sender,
                receiver: _receiver,
                pickupTime: _pickupTime,
                distance: _distance,
                price: _price,
                timestamp: block.timestamp
            })
        );

        emit ShipmentCreated(
            shipmentCount,
            msg.sender,
            _receiver,
            _pickupTime,
            _distance,
            _price,
            block.timestamp
        );
    }

    /* ================= START SHIPMENT ================= */

    function startShipment(
        address receiver,
        string memory recipientId
    ) public {
        emit ShipmentStarted(msg.sender, receiver, recipientId);
    }

    /* ================= COMPLETE SHIPMENT (NEW) ================= */

    function completeShipment(
        address receiver,
        string memory recipientId
    ) public {
        emit ShipmentCompleted(msg.sender, receiver, recipientId);
    }

    /* ================= VIEW FUNCTIONS ================= */

    function getShipmentCount() external view returns (uint) {
        return shipments.length;
    }

    function getShipment(uint index) external view returns (
        uint id,
        address sender,
        address receiver,
        string memory pickupTime,
        uint distance,
        uint price,
        uint timestamp
    ) {
        Shipment memory s = shipments[index];
        return (
            s.id,
            s.sender,
            s.receiver,
            s.pickupTime,
            s.distance,
            s.price,
            s.timestamp
        );
    }
}