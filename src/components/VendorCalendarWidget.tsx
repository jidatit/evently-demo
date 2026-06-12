
import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  ExternalLink
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time?: string;
  customer_name: string;
  service_name: string;
  status: 'confirmed' | 'pending' | 'unavailable';
  total_amount?: number;
}

interface VendorCalendarWidgetProps {
  bookings: Booking[];
  onCreateBooking?: () => void;
  onBookingClick?: (booking: Booking) => void;
}

type ViewType = 'month' | 'week' | 'day';

const VendorCalendarWidget: React.FC<VendorCalendarWidgetProps> = ({
  bookings,
  onCreateBooking,
  onBookingClick
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const getBookingColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-lime-100 border-lime-300 text-lime-800';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.booking_date), date)
    );
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (currentView === 'month') {
      setViewDate(direction === 'next' ? addMonths(viewDate, 1) : subMonths(viewDate, 1));
    } else if (currentView === 'week') {
      setViewDate(direction === 'next' ? addWeeks(viewDate, 1) : subWeeks(viewDate, 1));
    } else {
      const newDate = new Date(viewDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      setViewDate(newDate);
      setSelectedDate(newDate);
    }
  };

  const weekDays = useMemo(() => {
    if (currentView === 'week') {
      const start = startOfWeek(viewDate);
      const end = endOfWeek(viewDate);
      return eachDayOfInterval({ start, end });
    }
    return [];
  }, [viewDate, currentView]);

  const renderDayView = () => {
    const dayBookings = getBookingsForDate(selectedDate);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>
        
        {dayBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings for this day</p>
            {onCreateBooking && (
              <Button 
                onClick={onCreateBooking}
                className="mt-4 bg-lime-500 hover:bg-lime-600 text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Booking
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {dayBookings.map((booking) => (
              <div
                key={booking.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${getBookingColor(booking.status)}`}
                onClick={() => onBookingClick?.(booking)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{booking.service_name}</p>
                    <p className="text-sm opacity-80">{booking.customer_name}</p>
                    <p className="text-sm opacity-80">
                      {booking.start_time} {booking.end_time && `- ${booking.end_time}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          
          return (
            <div
              key={day.toISOString()}
              className={`p-2 border rounded-lg cursor-pointer transition-colors min-h-[120px] ${
                isSelected ? 'border-lime-500 bg-lime-50' : 
                isToday ? 'border-lime-300 bg-lime-25' : 'border-gray-200'
              }`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium text-gray-900 mb-2">
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 2).map((booking) => (
                  <div
                    key={booking.id}
                    className={`text-xs p-1 rounded truncate ${getBookingColor(booking.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookingClick?.(booking);
                    }}
                  >
                    {booking.service_name}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        month={viewDate}
        onMonthChange={setViewDate}
        className="rounded-md border"
        modifiers={{
          hasBookings: (date) => getBookingsForDate(date).length > 0,
          confirmed: (date) => getBookingsForDate(date).some(b => b.status === 'confirmed'),
          pending: (date) => getBookingsForDate(date).some(b => b.status === 'pending'),
          unavailable: (date) => getBookingsForDate(date).some(b => b.status === 'unavailable'),
        }}
        modifiersStyles={{
          hasBookings: { fontWeight: 'bold' },
          confirmed: { backgroundColor: '#ecfccb', color: '#365314' },
          pending: { backgroundColor: '#fef3c7', color: '#92400e' },
          unavailable: { backgroundColor: '#fee2e2', color: '#991b1b' },
        }}
      />
    );
  };

  return (
    <Card className="bg-white rounded-xl border border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-lime-600" />
            Calendar
          </CardTitle>
          
          {/* View Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <Button
                  key={view}
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    currentView === view 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setCurrentView(view)}
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {currentView === 'day' 
                ? format(selectedDate, 'MMMM d, yyyy')
                : currentView === 'week'
                ? `${format(startOfWeek(viewDate), 'MMM d')} - ${format(endOfWeek(viewDate), 'MMM d, yyyy')}`
                : format(viewDate, 'MMMM yyyy')
              }
            </h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Google Calendar Sync Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            onClick={() => {
              // Future: Implement Google Calendar sync
              console.log('Google Calendar sync - coming soon!');
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Sync with Google
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-lime-200 border border-lime-300"></div>
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-200 border border-red-300"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </CardContent>
    </Card>
  );
};

export default VendorCalendarWidget;
