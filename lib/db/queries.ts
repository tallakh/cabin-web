import { createClient } from "@/lib/supabase/server";
import { differenceInDays } from "date-fns";
import type { Cabin, Booking, UserProfile } from "@/types/database";

export type BookingStats = {
  cabin_id: string;
  cabin_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  total_nights: number;
  booking_count: number;
};

export async function getCabins(): Promise<Cabin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cabins")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getCabin(id: string): Promise<Cabin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cabins")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getBookings(userId?: string): Promise<Booking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*, cabins(*)")
    .order("start_date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Fetch user profiles separately and attach them
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("*")
      .in("id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return data.map((booking) => ({
      ...booking,
      user_profiles: profileMap.get(booking.user_id) || null,
    }));
  }

  return data || [];
}

export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, cabins(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Fetch user profile separately
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", data.user_id)
    .single();

  return {
    ...data,
    user_profiles: profile || null,
  };
}

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // If profile doesn't exist (PGRST116), return null instead of throwing
  if (error && error.code === "PGRST116") {
    return null;
  }

  if (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }

  return data;
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string,
): Promise<UserProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      is_admin: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBookingsForDateRange(
  cabinId: string,
  startDate: string,
  endDate: string,
): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("cabin_id", cabinId)
    .eq("status", "approved")
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (error) throw error;
  return data || [];
}

export async function getBookingStatistics(
  year?: number,
): Promise<BookingStats[]> {
  const supabase = await createClient();
  const currentYear = year || new Date().getFullYear();

  // Fetch all bookings - we'll filter by year in JavaScript for reliability
  const { data: allBookings, error } = await supabase
    .from("bookings")
    .select("*, cabins(*)")
    .order("start_date", { ascending: false });

  if (error) throw error;
  if (!allBookings || allBookings.length === 0) return [];

  // Filter bookings that touch the selected year
  const yearStart = new Date(currentYear, 0, 1); // January 1st of the year
  const yearEnd = new Date(currentYear, 11, 31); // December 31st of the year

  const bookings = allBookings.filter((booking) => {
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);

    // Booking touches the year if:
    // 1. Start date is within the year, OR
    // 2. End date is within the year, OR
    // 3. Booking spans the entire year (starts before and ends after)
    return (
      (startDate >= yearStart && startDate <= yearEnd) ||
      (endDate >= yearStart && endDate <= yearEnd) ||
      (startDate <= yearStart && endDate >= yearEnd)
    );
  });

  if (bookings.length === 0) return [];

  // Fetch user profiles
  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Calculate statistics grouped by cabin and user
  const statsMap = new Map<string, BookingStats>();

  for (const booking of bookings) {
    const cabin = booking.cabins as Cabin;
    const profile = profileMap.get(booking.user_id);

    if (!cabin || !profile) continue;

    // Calculate nights: end_date is checkout day (you don't stay that night)
    // Example: Friday to Sunday = 2 nights (Friday night, Saturday night)
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const nights = differenceInDays(endDate, startDate);

    // Create key for grouping: cabin_id + user_id
    const key = `${booking.cabin_id}-${booking.user_id}`;

    if (statsMap.has(key)) {
      const existing = statsMap.get(key)!;
      existing.total_nights += nights;
      existing.booking_count += 1;
    } else {
      statsMap.set(key, {
        cabin_id: booking.cabin_id,
        cabin_name: cabin.name,
        user_id: booking.user_id,
        user_name: profile.full_name,
        user_email: profile.email,
        total_nights: nights,
        booking_count: 1,
      });
    }
  }

  // Convert map to array and sort by cabin name, then user name
  return Array.from(statsMap.values()).sort((a, b) => {
    if (a.cabin_name !== b.cabin_name) {
      return a.cabin_name.localeCompare(b.cabin_name);
    }
    return a.user_name.localeCompare(b.user_name);
  });
}

export async function getAvailableYears(): Promise<number[]> {
  const supabase = await createClient();

  // Get all unique years from bookings
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("start_date, end_date");

  if (error) throw error;
  if (!bookings || bookings.length === 0) return [new Date().getFullYear()];

  const years = new Set<number>();

  for (const booking of bookings) {
    const startYear = new Date(booking.start_date).getFullYear();
    const endYear = new Date(booking.end_date).getFullYear();
    years.add(startYear);
    years.add(endYear);
  }

  // Always include current year
  years.add(new Date().getFullYear());

  // Return sorted in descending order (most recent first)
  return Array.from(years).sort((a, b) => b - a);
}
