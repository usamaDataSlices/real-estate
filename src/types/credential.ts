export type Credential = {
  id: string
  title: string
  username: string
  password: string
  url: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

export type CredentialFormValues = {
  title: string
  username: string
  password: string
  url: string
  notes: string
}
