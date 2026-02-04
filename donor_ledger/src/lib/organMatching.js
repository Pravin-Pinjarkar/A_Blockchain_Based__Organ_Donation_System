/****************************************************
 * ADVANCED MEDICAL MATCHING ENGINE
 * FCFS + Blood + Organ + Age Gap (≤ 15 years)
 ****************************************************/

/******** AGE VALIDATION ********/
/**
 * Valid when absolute age difference ≤ 15
 */
export const validateAge = (donorAge, recipientAge) => {
  if (!donorAge || !recipientAge) return true; // allow if unknown
  return Math.abs(donorAge - recipientAge) <= 15;
};

/******** BLOOD COMPATIBILITY ********/
export const validateBlood = (donorBlood, recipientBlood) => {
  if (!donorBlood || !recipientBlood) return false;
  return donorBlood.toUpperCase() === recipientBlood.toUpperCase();
};

/******** ORGAN COMPATIBILITY ********/
export const validateOrgan = (donorOrgan, recipientOrgan) => {
  if (!donorOrgan || !recipientOrgan) return false;
  return donorOrgan.toLowerCase() === recipientOrgan.toLowerCase();
};

/****************************************************
 * FCFS MATCHING (First Come – First Served)
 ****************************************************/
export const matchOrganRequest = (request, donors) => {
  if (!request || !donors?.length) return null;

  const possible = [];

  for (const donor of donors) {
    // ❌ Skip unavailable or already matched donors
    if (donor.status !== "Available" || donor.matchStatus !== "NotMatched")
      continue;

    const organMatch = validateOrgan(donor.organ, request.organ);
    const bloodMatch = validateBlood(
      donor.bloodType,
      request.bloodTypeRequired || request.bloodType
    );

    const recipientAge = request.recipientAge || request.age || null;
    const ageMatch = validateAge(donor.age, recipientAge);

    /*************** LOGGING ADDED HERE ***************/
    if (organMatch && bloodMatch && ageMatch) {
      console.log("🎯 MATCH FOUND →", donor.name, "→", request.recipientName);

      possible.push({
        donorMongoId: donor._id,
        donorBlockchainId: donor.donorId,
        donorInfo: {
          id: donor.donorId,
          name: donor.name,
          organ: donor.organ,
          bloodType: donor.bloodType,
          age: donor.age,
        },
        compatibility: 100,
      });
    } else {
      console.warn(
        "⛔ Skip:", donor.name,
        "| Organ:", organMatch,
        "| Blood:", bloodMatch,
        "| Age:", ageMatch,
        "| Donor:", donor.organ, donor.bloodType, donor.age,
        "| Recip:", request.organ, request.bloodTypeRequired, request.recipientAge
      );
    }
    /***************************************************/
  }

  if (!possible.length) return null;

  // FCFS — first valid compatible donor
  return {
    match: possible[0],
    allMatches: possible,
    matchedAt: new Date(),
  };
};

/****************************************************
 * VALIDATION FOR BLOCKCHAIN (MUST HAVE NUMERIC PART)
 ****************************************************/
export const validateMatchForBlockchain = (result) => {
  if (!result || !result.match) return false;

  const id = result.match.donorBlockchainId; // "D-0006"
  const numericId = parseInt(String(id).replace(/\D/g, "")); // -> 6

  return !isNaN(numericId) && numericId > 0;
};

/****************************************************
 * FORMAT PAYLOAD FOR /api/match/approve
 ****************************************************/
export const formatMatchForBlockchain = (result, request) => {
  const m = result.match;

  return {
    requestId: request._id,
    donorBlockchainId: m.donorBlockchainId,
    donorName: m.donorInfo.name,
    organ: m.donorInfo.organ,
  };
};
