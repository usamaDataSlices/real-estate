import { useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourcePlugin from '@fullcalendar/resource'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import type { DateSelectArg, DatesSetArg, EventClickArg, EventInput, SlotLabelContentArg } from '@fullcalendar/core'
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { Booking, BookingStatus } from '../../types/booking'
import { bookingToCalendarEnd } from '../../lib/booking-mappers'
import CalendarMonthYearPicker from './CalendarMonthYearPicker'
import BookingStatusLegend from './BookingStatusLegend'
import './bookings-calendar.css'

export type CalendarProperty = {
  id: string
  title: string
}

const RESOURCE_AREA_WIDTH = 220

type Props = {
  properties: CalendarProperty[]
  propertySearch: string
  onPropertySearchChange: (value: string) => void
  bookings: Booking[]
  onSelectRange: (payload: { propertyId: string; checkIn: string; checkOut: string }) => void
  onEditBooking: (booking: Booking) => void
}

function statusClass(status: BookingStatus) {
  return `booking-${status}`
}

function toInclusiveCheckOut(endExclusive: Date) {
  const date = new Date(endExclusive)
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function renderDayHeader(arg: SlotLabelContentArg) {
  if (arg.level === 0) return undefined

  const dayNum = arg.date.getDate()
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(arg.date)

  return {
    html: `<div class="booking-day-header"><span class="booking-day-header-num">${dayNum}</span><span class="booking-day-header-name">${weekday}</span></div>`,
  }
}

function formatToolbarTitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

export default function BookingsCalendar({
  properties,
  propertySearch,
  onPropertySearchChange,
  bookings,
  onSelectRange,
  onEditBooking,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null)
  const [visibleDate, setVisibleDate] = useState(() => new Date())
  const [pickerOpen, setPickerOpen] = useState(false)

  const resources = useMemo(
    () => properties.map((property) => ({ id: property.id, title: property.title })),
    [properties],
  )

  const events = useMemo<EventInput[]>(
    () =>
      bookings
        .filter((booking) => properties.some((property) => property.id === booking.propertyId))
        .map((booking) => ({
          id: booking.id,
          resourceId: booking.propertyId,
          title: booking.guestName,
          start: booking.checkIn,
          end: bookingToCalendarEnd(booking.checkOut),
          allDay: true,
          classNames: [statusClass(booking.status)],
          extendedProps: { booking },
        })),
    [bookings, properties],
  )

  const getApi = () => calendarRef.current?.getApi()

  const handleDatesSet = (info: DatesSetArg) => {
    setVisibleDate(info.view.currentStart)
  }

  const handleSelect = (info: DateSelectArg) => {
    const propertyId = info.resource?.id
    if (!propertyId) return

    onSelectRange({
      propertyId,
      checkIn: info.startStr.slice(0, 10),
      checkOut: toInclusiveCheckOut(info.end),
    })
    info.view.calendar.unselect()
  }

  const handleEventClick = (info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as Booking | undefined
    if (booking) onEditBooking(booking)
  }

  const goToDate = (date: Date) => {
    getApi()?.gotoDate(date)
  }

  return (
    <div className="bookings-calendar overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="bookings-calendar-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="bookings-calendar-btn"
            onClick={() => getApi()?.prev()}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="bookings-calendar-btn"
            onClick={() => getApi()?.next()}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" className="bookings-calendar-btn px-3" onClick={() => getApi()?.today()}>
            Today
          </button>
          <button
            type="button"
            className="bookings-calendar-btn px-3"
            onClick={() => setPickerOpen(true)}
            aria-label="Pick month and year"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-lg font-heading font-semibold text-primary">{formatToolbarTitle(visibleDate)}</h2>
      </div>

      <BookingStatusLegend />

      <div className="bookings-resource-search border-b border-neutral-200 bg-neutral-50">
        <div className="flex">
          <div
            className="shrink-0 border-r border-neutral-200 p-2"
            style={{ width: RESOURCE_AREA_WIDTH }}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={propertySearch}
                onChange={(event) => onPropertySearchChange(event.target.value)}
                placeholder="Search properties..."
                className="w-full rounded-md border border-neutral-200 bg-white py-1.5 pl-8 pr-2 text-sm"
              />
            </label>
          </div>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="p-12 text-center text-sm text-neutral-600">
          No properties match your search.
        </div>
      ) : (
      <FullCalendar
        ref={calendarRef}
        plugins={[resourcePlugin, resourceTimelinePlugin, interactionPlugin]}
        initialView="bookingsMonth"
        headerToolbar={false}
        datesSet={handleDatesSet}
        slotDuration={{ days: 1 }}
        slotLabelInterval={{ days: 1 }}
        snapDuration={{ days: 1 }}
        views={{
          bookingsMonth: {
            type: 'resourceTimeline',
            duration: { months: 1 },
            slotDuration: { days: 1 },
            slotLabelInterval: { days: 1 },
            snapDuration: { days: 1 },
            slotLabelFormat: [{ month: 'long', year: 'numeric' }, { day: 'numeric' }],
            slotLabelContent: renderDayHeader,
          },
        }}
        resources={resources}
        events={events}
        selectable
        selectMirror
        editable={false}
        displayEventTime={false}
        resourceAreaHeaderContent=""
        resourceAreaWidth={`${RESOURCE_AREA_WIDTH}px`}
        height={Math.max(400, properties.length * 44 + 104)}
        slotMinWidth={56}
        select={handleSelect}
        eventClick={handleEventClick}
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
      />
      )}

      <CalendarMonthYearPicker
        open={pickerOpen}
        value={visibleDate}
        onClose={() => setPickerOpen(false)}
        onSelect={goToDate}
      />
    </div>
  )
}
