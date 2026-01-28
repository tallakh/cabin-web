"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations, useLocale } from "next-intl";
import type { Cabin, Booking } from "@/types/database";

interface CalendarProps {
  cabins: Cabin[];
  bookings: Booking[];
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function Calendar({
  cabins,
  bookings,
  currentUserId,
  isAdmin,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "no" ? nb : undefined;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday = 1
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Monday = 1
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      // Normalize dates to midnight for accurate date-only comparison
      const start = new Date(booking.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(booking.end_date);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      // Check if the date falls within the booking range (inclusive of both start and end)
      return (
        checkDate >= start &&
        checkDate <= end &&
        (booking.status === "approved" || booking.status === "pending")
      );
    });
  };

  const handleDeleteBooking = async (
    bookingId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    if (!confirm(t("admin.deleteBookingConfirm"))) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete booking");
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || t("errors.generic"));
    }
  };

  const canDeleteBooking = (booking: Booking) => {
    return isAdmin || booking.user_id === currentUserId;
  };

  const getCabinColor = (cabinId: string) => {
    const index = cabins.findIndex((c) => c.id === cabinId);
    const colors = [
      "bg-blue-200 border-blue-400",
      "bg-green-200 border-green-400",
      "bg-yellow-200 border-yellow-400",
      "bg-purple-200 border-purple-400",
      "bg-pink-200 border-pink-400",
      "bg-red-200 border-red-400",
    ];
    return colors[index % colors.length];
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-white shadow rounded-lg p-3 sm:p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded flex-shrink-0"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 text-center flex-1">
          {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded flex-shrink-0"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="min-w-[600px] sm:min-w-0">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-4">
          {locale === "no"
            ? ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-medium text-gray-700 py-1 sm:py-2"
                >
                  {day}
                </div>
              ))
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-medium text-gray-700 py-1 sm:py-2"
                >
                  {day}
                </div>
              ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {days.map((day) => {
            const dayBookings = getBookingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[60px] sm:min-h-24 p-0.5 sm:p-1 border rounded ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
              >
                <div
                  className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => {
                    const cabin = cabins.find((c) => c.id === booking.cabin_id);
                    const isPending = booking.status === "pending";
                    const canDelete = canDeleteBooking(booking);
                    const baseColor = getCabinColor(booking.cabin_id);
                    const borderStyle = isPending
                      ? "border-dashed opacity-75"
                      : "border-solid";
                    const bookerName =
                      booking.user_profiles?.full_name ||
                      booking.user_profiles?.email ||
                      t("common.user");
                    const guests = booking.number_of_guests || 1;

                    return (
                      <div
                        key={booking.id}
                        className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded border ${baseColor} ${borderStyle} group relative`}
                        title={`${cabin?.name || t("bookings.cabin")}: ${bookerName} (${guests} ${guests === 1 ? t("bookings.guest") : t("bookings.guests")}) - ${t(`bookings.status.${booking.status}`)}`}
                      >
                        <div className="font-medium truncate sm:hidden">
                          {bookerName}
                        </div>
                        <div className="font-medium truncate hidden sm:block">
                          {cabin?.name || t("bookings.cabin")}
                        </div>
                        <div className="text-[9px] sm:text-xs truncate text-gray-600 hidden sm:block">
                          {bookerName} ({guests})
                        </div>
                        {canDelete && booking.status === "approved" && (
                          <button
                            onClick={(e) => handleDeleteBooking(booking.id, e)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-[8px] sm:text-[10px] hover:bg-red-600 transition-opacity"
                            title={t("calendar.deleteBooking")}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayBookings.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-gray-500 font-medium px-0.5 sm:px-1">
                      +{dayBookings.length - 2} {t("calendar.more")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cabins.length > 0 && (
        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm font-medium text-gray-700">
              {t("calendar.legend")}:
            </div>
            {cabins.map((cabin, index) => {
              const colors = [
                "bg-blue-200 border-blue-400",
                "bg-green-200 border-green-400",
                "bg-yellow-200 border-yellow-400",
                "bg-purple-200 border-purple-400",
                "bg-pink-200 border-pink-400",
                "bg-red-200 border-red-400",
              ];
              return (
                <div
                  key={cabin.id}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded border ${colors[index % colors.length]}`}
                  ></div>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {cabin.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-solid bg-gray-200 border-gray-400"></div>
              <span>{t("calendar.approved")}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-dashed bg-gray-200 border-gray-400 opacity-75"></div>
              <span>{t("calendar.pending")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
