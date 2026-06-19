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
  active: boolean
  areaId: string
  area?: {
    id: string
    code: string
    name: string
    warehouse?: { id: string; code: string; name: string }
  }
}
