export type PropertyDocument = {
  id: string
  propertyId: string
  title: string
  content: string
  fileUrl?: string
  storagePath?: string
  createdAt?: string
  updatedAt?: string
}

export type PropertyDocumentSubmitPayload = {
  propertyId: string
  title: string
  content: string
}
