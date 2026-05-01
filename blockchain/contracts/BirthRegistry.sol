// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BirthRegistry
 * @dev Registre décentralisé pour les actes de naissance de NaissanceChain
 */
contract BirthRegistry {
    struct BirthRecord {
        string birthHash;    // Hash SHA-256 des données de l'acte
        uint256 timestamp;   // Date d'enregistrement sur la blockchain
        address registrar;   // Adresse de l'agent/admin qui a enregistré
    }

    // Mapping: NationalID (ex: GN-2026-CONA-0001) => BirthRecord
    mapping(string => BirthRecord) private records;
    
    // Mapping pour vérifier si un ID national existe déjà
    mapping(string => bool) private exists;

    event BirthRegistered(string indexed nationalId, string birthHash, address indexed registrar);

    /**
     * @dev Enregistre un nouvel acte de naissance
     * @param nationalId Identifiant unique de l'acte
     * @param birthHash Hash des données (stocké sur IPFS par ailleurs)
     */
    function registerBirth(string memory nationalId, string memory birthHash) public {
        require(!exists[nationalId], "Cet identifiant national est deja enregistre.");
        require(bytes(birthHash).length > 0, "Le hash ne peut pas etre vide.");

        records[nationalId] = BirthRecord({
            birthHash: birthHash,
            timestamp: block.timestamp,
            registrar: msg.sender
        });

        exists[nationalId] = true;

        emit BirthRegistered(nationalId, birthHash, msg.sender);
    }

    /**
     * @dev Vérifie l'existence et récupère les données d'un acte
     */
    function verifyBirth(string memory nationalId) public view returns (
        string memory birthHash,
        uint256 timestamp,
        address registrar
    ) {
        require(exists[nationalId], "Acte de naissance introuvable.");
        
        BirthRecord memory record = records[nationalId];
        return (record.birthHash, record.timestamp, record.registrar);
    }
}
