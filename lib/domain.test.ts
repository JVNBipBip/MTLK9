import {
  CONSULTATIONS_COLLECTION,
  CLASS_SESSIONS_COLLECTION,
  BOOKINGS_COLLECTION,
  DOG_CLASS_ACCESS_COLLECTION,
  SQUARE_SERVICE_CONFIG_COLLECTION,
} from "./domain"

describe("domain", () => {
  describe("collection names - must match admin", () => {
    it("has same Firestore collection constants as admin", () => {
      expect(CONSULTATIONS_COLLECTION).toBe("consultations")
      expect(CLASS_SESSIONS_COLLECTION).toBe("class_sessions")
      expect(BOOKINGS_COLLECTION).toBe("bookings")
      expect(DOG_CLASS_ACCESS_COLLECTION).toBe("dog_class_access")
      expect(SQUARE_SERVICE_CONFIG_COLLECTION).toBe("square_service_config")
    })
  })
})
