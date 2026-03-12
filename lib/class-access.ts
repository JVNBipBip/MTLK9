import { DOG_CLASS_ACCESS_COLLECTION } from "@/lib/domain"

export function classAccessDocId(clientId: string, dogName: string, classTypeId: string) {
  return `${clientId.trim().toLowerCase()}__${dogName.trim().toLowerCase()}__${classTypeId.trim().toLowerCase()}`
}

export function classAccessCollectionPath() {
  return DOG_CLASS_ACCESS_COLLECTION
}

