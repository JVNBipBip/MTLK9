import {
  classAccessDocId,
  classAccessCollectionPath,
} from "./class-access"
import { DOG_CLASS_ACCESS_COLLECTION } from "./domain"

describe("class-access", () => {
  describe("classAccessDocId", () => {
    it("joins clientId, dogName, classTypeId as lowercase", () => {
      const id = classAccessDocId("Client1", "Buddy", "puppy-foundations")
      expect(id).toBe("client1__buddy__puppy-foundations")
    })

    it("trims whitespace", () => {
      const id = classAccessDocId("  client  ", "  dog  ", "  class  ")
      expect(id).toBe("client__dog__class")
    })

    it("produces same id as admin for same inputs", () => {
      const id = classAccessDocId("Client", "Dog", "Class")
      expect(id).toBe("client__dog__class")
    })
  })

  describe("classAccessCollectionPath", () => {
    it("returns DOG_CLASS_ACCESS_COLLECTION", () => {
      expect(classAccessCollectionPath()).toBe(DOG_CLASS_ACCESS_COLLECTION)
    })
  })
})
