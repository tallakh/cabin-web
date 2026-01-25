export type Cabin = {
  id: string
  name: string
  description: string | null
  capacity: number
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'approved' | 'rejected'

export type Booking = {
  id: string
  cabin_id: string
  user_id: string
  start_date: string
  end_date: string
  status: BookingStatus
  notes: string | null
  created_at: string
  updated_at: string
  cabins?: Cabin
  user_profiles?: UserProfile
}

export type UserProfile = {
  id: string
  email: string
  full_name: string
  is_admin: boolean
  created_at: string
}
