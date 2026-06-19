export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  roleName: string
  permissions: string[]
}

export interface Role {
  id: string
  name: string
  description: string | null
  permissionKeys: string[]
}

export interface Permission {
  id: string
  key: string
  description: string | null
}

export interface User {
  id: string
  name: string
  email: string
  active: boolean
  roleId: string
  role: { id: string; name: string }
}

export interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  active: boolean
  _count?: { areas: number }
}

export interface Area {
  id: string
  code: string
  name: string
  barcode: string | null
  active: boolean
  warehouseId: string
  warehouse?: { id: string; code: string; name: string }
  _count?: { locations: number }
}

export interface Location {
  id: string
  code: string
  name: string | null
  aisle: string | null
  floor: string | null
  position: string | null
  barcode: string | null
  accessibility: number
  capacity: number | null
  active: boolean
  areaId: string
  area?: {
    id: string
    code: string
    name: string
    warehouse?: { id: string; code: string; name: string }
  }
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  barcode: string | null
  weight: number | null
  turnoverScore: number
  quantity: number
  priorityScore: number
  active: boolean
  allocatedQuantity?: number
  unallocatedQuantity?: number
}

export interface Allocation {
  id: string
  productId: string
  locationId: string
  quantity: number
  location?: {
    id: string
    code: string
    name: string | null
    accessibility: number
    area?: { name: string }
  }
}

export interface LocationScore {
  locationId: string
  code: string
  name: string | null
  areaName: string | null
  accessibility: number
  capacity: number | null
  occupied: number
  available: number | null
  score: number
  reason: string
}

export interface SuggestResult {
  product: { id: string; sku: string; name: string; turnoverScore: number }
  quantity: number
  suggestions: LocationScore[]
}

export interface PlacementSuggestion {
  id: string
  productId: string
  fromLocationId: string | null
  toLocationId: string
  quantity: number
  reason: string
  score: number
  status: string
  product?: { sku: string; name: string }
  fromLocation?: { id: string; code: string; name: string | null } | null
  toLocation?: { id: string; code: string; name: string | null } | null
}
