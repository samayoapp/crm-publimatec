'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Filter,
  Plus,
  X,
  ExternalLink,
  MessageSquare,
  CalendarDays,
  ListOrdered,
  CalendarRange,
} from 'lucide-react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { formatFriendlyDate, formatFriendlyDateTime, getDaysDiff, getStalenessInfo } from '@/lib/timeUtils';

type ViewMode = 'month' | 'week' | 'agenda';

interface CalendarEvent {
  id: string;
  type: 'FOLLOW_UP' | 'VENTA_CERRADA' | 'VENTA_PERDIDA';
  title: string;
  date: string;
  contactId?: string;
  contactName?: string;
  companyName?: string | null;
  companyId?: string | null;
  phone?: string | null;
  email?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  topProposal?: {
    id: string;
    title: string;
    amount: number;
    stage: string;
  } | null;
  isOverdue?: boolean;
  isToday?: boolean;
  isUpcoming?: boolean;
  isWon?: boolean;
  firstContactAt?: string | null;
  lastContactAt?: string | null;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [milestones, setMilestones] = useState<CalendarEvent[]>([]);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  // Reschedule quick modal
  const [reschedulingEvent, setReschedulingEvent] = useState<CalendarEvent | null>(null);
  const [newDateVal, setNewDateVal] = useState('');
  const [newTaskVal, setNewTaskVal] = useState('');
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Selected day for month view detail drawer
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(new Date());

  const fetchCalendarData = () => {
    setLoading(true);
    let url = '/api/calendar?';
    if (selectedAdvisor) url += `advisorId=${encodeURIComponent(selectedAdvisor)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
        if (data.milestoneEvents) setMilestones(data.milestoneEvents);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching calendar', err);
        setLoading(false);
      });
  };

  const fetchTeam = () => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.team) setAdvisors(data.team);
      })
      .catch((err) => console.error(err));
  };

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchTeam();
    fetchUser();
  }, []);

  useEffect(() => {
    fetchCalendarData();

    const handleReload = () => fetchCalendarData();
    window.addEventListener('crm-lead-saved', handleReload);
    window.addEventListener('crm-proposal-saved', handleReload);
    return () => {
      window.removeEventListener('crm-lead-saved', handleReload);
      window.removeEventListener('crm-proposal-saved', handleReload);
    };
  }, [selectedAdvisor]);

  // Combine events and milestones
  const allEvents = useMemo(() => {
    return [...events, ...milestones];
  }, [events, milestones]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(today);
  };

  // Month grid calculation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday as start of week: Sunday = 0 -> 6, Mon = 1 -> 0, etc.
    let startingDayIndex = firstDay.getDay() - 1;
    if (startingDayIndex === -1) startingDayIndex = 6;

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cur = new Date(year, month, d);
      const isToday = cur.getTime() === todayStart;
      days.push({
        date: cur,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month filler to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Filter events by day
  const getEventsForDay = (targetDate: Date) => {
    const y = targetDate.getFullYear();
    const m = targetDate.getMonth();
    const d = targetDate.getDate();

    return allEvents.filter((ev) => {
      if (!ev.date) return false;
      const evDate = new Date(ev.date);
      return (
        evDate.getFullYear() === y &&
        evDate.getMonth() === m &&
        evDate.getDate() === d
      );
    });
  };

  // Grouped stats
  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    let todayCount = 0;
    let overdueCount = 0;
    let upcomingWeekCount = 0;
    let wonMonthCount = 0;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    allEvents.forEach((ev) => {
      if (!ev.date) return;
      const t = new Date(ev.date).getTime();
      const evDate = new Date(ev.date);

      if (ev.type === 'FOLLOW_UP') {
        if (t < todayStart.getTime()) overdueCount++;
        else if (t >= todayStart.getTime() && t <= todayEnd.getTime()) todayCount++;
        else if (t > todayEnd.getTime() && t <= sevenDaysLater.getTime()) upcomingWeekCount++;
      } else if (ev.type === 'VENTA_CERRADA') {
        if (evDate.getFullYear() === currentYear && evDate.getMonth() === currentMonth) {
          wonMonthCount++;
        }
      }
    });

    return { todayCount, overdueCount, upcomingWeekCount, wonMonthCount };
  }, [allEvents, currentDate]);

  // Handlers for completing / rescheduling
  const handleCompleteFollowUp = async (contactId: string, eventId: string) => {
    if (!confirm('¿Deseas marcar esta cita/seguimiento como completado?')) return;
    try {
      // Clear nextFollowUp on contact
      await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextFollowUp: null, nextFollowUpTask: null }),
      });
      // Refresh
      fetchCalendarData();
      if (selectedEvent?.id === eventId) setSelectedEvent(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReschedule = async () => {
    if (!reschedulingEvent || !reschedulingEvent.contactId || !newDateVal) return;
    setSavingReschedule(true);
    try {
      await fetch(`/api/contacts/${reschedulingEvent.contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUp: new Date(newDateVal).toISOString(),
          nextFollowUpTask: newTaskVal || reschedulingEvent.title,
        }),
      });
      setSavingReschedule(false);
      setReschedulingEvent(null);
      setSelectedEvent(null);
      fetchCalendarData();
    } catch (err) {
      console.error(err);
      setSavingReschedule(false);
    }
  };

  const openRescheduleModal = (ev: CalendarEvent) => {
    setReschedulingEvent(ev);
    if (ev.date) {
      setNewDateVal(new Date(ev.date).toISOString().slice(0, 16));
    } else {
      setNewDateVal(new Date().toISOString().slice(0, 16));
    }
    setNewTaskVal(ev.title || '');
  };

  // Header Title
  const monthTitle = currentDate.toLocaleDateString('es-HN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Panel */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Calendario Comercial & Agenda</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    PixelMedia
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Planifica citas, llamadas acordadas, primer contacto y cierres ganados
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Views + Filter + Navigation */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* View Selector */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mes</span>
              </button>

              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>

              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>
            </div>

            {/* Advisor Selector */}
            {currentUser?.role === 'ADMIN' && advisors.length > 0 && (
              <div className="relative">
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="text-xs font-medium bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Todos los asesores</option>
                  {advisors.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Date Navigation & Mini KPIs */}
        <div className="p-3.5 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize ml-2">
              {monthTitle}
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{stats.todayCount} Hoy</span>
            </span>

            {stats.overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.overdueCount} Vencidas</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-500/20">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{stats.upcomingWeekCount} Esta semana</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>{stats.wonMonthCount} Cierres en el mes</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Sincronizando citas y agenda...</p>
          </div>
        </div>
      ) : (
        <>
          {/* VISTA 1: MES */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Calendar Grid (3 Columns on Large screens) */}
              <div className="lg:col-span-3 glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                {/* Day Header */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Sáb</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Dom</span>
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1.5 mt-2">
                  {monthDays.map((dayItem, idx) => {
                    const dayEvents = getEventsForDay(dayItem.date);
                    const isSelected =
                      selectedDayDate &&
                      selectedDayDate.toDateString() === dayItem.date.toDateString();

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDayDate(dayItem.date)}
                        className={`min-h-[92px] sm:min-h-[110px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                            : dayItem.isToday
                            ? 'border-indigo-400 dark:border-indigo-500/60 bg-indigo-50/10 dark:bg-indigo-900/10'
                            : dayItem.isCurrentMonth
                            ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                            : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/40 dark:border-slate-850/40 opacity-40'
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                              dayItem.isToday
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {dayItem.date.getDate()}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events preview pills */}
                        <div className="space-y-1 mt-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const isWon = ev.type === 'VENTA_CERRADA';
                            const isOverdue = ev.isOverdue;
                            const isToday = ev.isToday;

                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(ev);
                                }}
                                className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium transition-transform hover:scale-[1.02] ${
                                  isWon
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : isOverdue
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                    : isToday
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                }`}
                                title={ev.title}
                              >
                                {isWon ? '🏆 ' : ''}
                                {ev.contactName ? `${ev.contactName}: ` : ''}
                                {ev.title}
                              </div>
                            );
                          })}

                          {dayEvents.length > 2 && (
                            <div className="text-[9px] font-semibold text-slate-400 text-right pr-1">
                              +{dayEvents.length - 2} más...
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side Detail Panel for Selected Day */}
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Detalle del Día
                      </h3>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white capitalize mt-0.5">
                        {selectedDayDate
                          ? selectedDayDate.toLocaleDateString('es-HN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })
                          : 'Selecciona un día'}
                      </p>
                    </div>
                  </div>

                  {/* Day Events List */}
                  <div className="mt-3 space-y-2.5 max-h-[500px] overflow-y-auto">
                    {selectedDayDate && getEventsForDay(selectedDayDate).length === 0 ? (
                      <div className="text-center py-12 px-3 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No hay citas ni cierres programados para esta fecha.
                      </div>
                    ) : (
                      selectedDayDate &&
                      getEventsForDay(selectedDayDate).map((ev) => {
                        const isWon = ev.type === 'VENTA_CERRADA';
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900/70 shadow-xs cursor-pointer transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isWon
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : ev.isOverdue
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                    : ev.isToday
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                }`}
                              >
                                {isWon ? '🏆 Cierre Ganado' : ev.isOverdue ? '⚠️ Vencido' : ev.isToday ? '📅 Hoy' : '⏰ Programado'}
                              </span>

                              <span className="text-[10px] text-slate-400 font-medium">
                                {ev.date ? new Date(ev.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                                {ev.title}
                              </p>
                              {ev.contactName && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span className="font-semibold">{ev.contactName}</span>
                                  {ev.companyName && <span>• {ev.companyName}</span>}
                                </p>
                              )}
                            </div>

                            {/* Quick Action buttons */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                              {ev.phone ? (
                                <WhatsAppButton
                                  phone={ev.phone}
                                  contactName={ev.contactName}
                                  size="sm"
                                  className="text-[10px] px-2 py-0.5"
                                />
                              ) : (
                                <div />
                              )}

                              {ev.contactId && (
                                <Link
                                  href={`/leads/${ev.contactId}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  <span>Ficha</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>PixelMedia Time Tracker</span>
                  <Link href="/leads" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Ver todos los contactos →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: SEMANA */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((wDate, idx) => {
                const dayEvents = getEventsForDay(wDate);
                const isToday = wDate.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`glass-panel rounded-2xl border p-3 flex flex-col min-h-[500px] transition-colors ${
                      isToday
                        ? 'border-indigo-400 dark:border-indigo-500/60 bg-indigo-50/15 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                          {wDate.toLocaleDateString('es-HN', { weekday: 'short' })}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          {wDate.getDate()} {wDate.toLocaleDateString('es-HN', { month: 'short' })}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {dayEvents.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2 mt-3 flex-1 overflow-y-auto">
                      {dayEvents.length === 0 ? (
                        <div className="text-center py-10 text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                          Sin citas
                        </div>
                      ) : (
                        dayEvents.map((ev) => {
                          const isWon = ev.type === 'VENTA_CERRADA';
                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-400 cursor-pointer transition-all space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                    isWon
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                      : ev.isOverdue
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                  }`}
                                >
                                  {isWon ? '🏆 Cierre' : ev.date ? new Date(ev.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : 'Todo el día'}
                                </span>
                              </div>

                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {ev.title}
                              </p>

                              {ev.contactName && (
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                                  👤 {ev.contactName}
                                </p>
                              )}

                              {ev.phone && (
                                <div className="pt-1">
                                  <WhatsAppButton
                                    phone={ev.phone}
                                    contactName={ev.contactName}
                                    size="sm"
                                    className="text-[9px] px-1.5 py-0.5 w-full justify-center"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTA 3: AGENDA / LISTA */}
          {viewMode === 'agenda' && (
            <div className="space-y-4">
              {/* Overdue Section */}
              {allEvents.filter((e) => e.isOverdue).length > 0 && (
                <div className="glass-panel rounded-2xl border border-rose-300 dark:border-rose-800/80 p-4 bg-rose-50/20 dark:bg-rose-950/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Compromisos Vencidos / Requieren Atención Inmediata</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allEvents
                      .filter((e) => e.isOverdue)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                              Venció {formatFriendlyDate(ev.date)}
                            </span>
                            {ev.assignedTo && (
                              <span className="text-[10px] text-slate-400">
                                {ev.assignedTo.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            👤 <strong>{ev.contactName}</strong> {ev.companyName ? `(${ev.companyName})` : ''}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            {ev.phone && (
                              <WhatsAppButton
                                phone={ev.phone}
                                contactName={ev.contactName}
                                size="sm"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRescheduleModal(ev);
                              }}
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              Reprogramar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Citas y Llamadas para Hoy ({stats.todayCount})</span>
                </h3>
                {allEvents.filter((e) => e.isToday).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tienes llamadas ni citas programadas para hoy.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allEvents
                      .filter((e) => e.isToday)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                              ⏰ {ev.date ? new Date(ev.date).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                            </span>
                            {ev.assignedTo && (
                              <span className="text-[10px] text-slate-400">
                                {ev.assignedTo.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            👤 <strong>{ev.contactName}</strong> {ev.companyName ? `(${ev.companyName})` : ''}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            {ev.phone && (
                              <WhatsAppButton
                                phone={ev.phone}
                                contactName={ev.contactName}
                                size="sm"
                              />
                            )}
                            {ev.contactId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteFollowUp(ev.contactId!, ev.id);
                                }}
                                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Realizada</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Upcoming Future Section */}
              <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-3">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Próximas Citas y Seguimientos Programados</span>
                </h3>
                {allEvents.filter((e) => e.isUpcoming).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay seguimientos futuros en agenda.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allEvents
                      .filter((e) => e.isUpcoming)
                      .map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-400 cursor-pointer transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                              📅 {formatFriendlyDateTime(ev.date)}
                            </span>
                            {ev.assignedTo && (
                              <span className="text-[10px] text-slate-400">
                                {ev.assignedTo.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            👤 <strong>{ev.contactName}</strong> {ev.companyName ? `(${ev.companyName})` : ''}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                            {ev.phone && (
                              <WhatsAppButton
                                phone={ev.phone}
                                contactName={ev.contactName}
                                size="sm"
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRescheduleModal(ev);
                              }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              Reprogramar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Milestones: Venta Cerrada */}
              {milestones.length > 0 && (
                <div className="glass-panel rounded-2xl border border-emerald-300 dark:border-emerald-800/80 p-4 bg-emerald-50/20 dark:bg-emerald-950/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
                    <Award className="w-4 h-4" />
                    <span>Hitos de Ventas Cerradas Ganadas</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {milestones.map((ms) => (
                      <div
                        key={ms.id}
                        onClick={() => setSelectedEvent(ms)}
                        className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 shadow-xs cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                            🏆 Cierre Exitoso: {formatFriendlyDate(ms.date)}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {ms.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Cliente: <strong>{ms.contactName}</strong> {ms.companyName ? `(${ms.companyName})` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: DETALLE DE EVENTO */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedEvent.type === 'VENTA_CERRADA'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : selectedEvent.isOverdue
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                      : selectedEvent.isToday
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                  }`}
                >
                  {selectedEvent.type === 'VENTA_CERRADA'
                    ? '🏆 Hito de Cierre de Venta'
                    : selectedEvent.isOverdue
                    ? '⚠️ Cita Vencida'
                    : selectedEvent.isToday
                    ? '📅 Cita de Hoy'
                    : '⏰ Cita Programada'}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fecha y Hora */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatFriendlyDateTime(selectedEvent.date)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {selectedEvent.isOverdue
                    ? `Retrasado por ${getDaysDiff(selectedEvent.date)} días`
                    : selectedEvent.isToday
                    ? 'Previsto para el día de hoy'
                    : `Faltan ${getDaysDiff(new Date(), selectedEvent.date)} días`}
                </p>
              </div>
            </div>

            {/* Contacto Info */}
            {selectedEvent.contactName && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Prospecto / Cliente:</span>
                  <Link
                    href={`/leads/${selectedEvent.contactId}`}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{selectedEvent.contactName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {selectedEvent.companyName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Empresa:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEvent.companyName}
                    </span>
                  </div>
                )}

                {selectedEvent.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Teléfono:</span>
                    <a
                      href={`tel:${selectedEvent.phone}`}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600"
                    >
                      {selectedEvent.phone}
                    </a>
                  </div>
                )}

                {selectedEvent.assignedTo && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Asesor Comercial:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedEvent.assignedTo.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedEvent.phone && (
                  <WhatsAppButton
                    phone={selectedEvent.phone}
                    contactName={selectedEvent.contactName}
                    size="md"
                  />
                )}
                {selectedEvent.contactId && selectedEvent.type === 'FOLLOW_UP' && (
                  <button
                    onClick={() => handleCompleteFollowUp(selectedEvent.contactId!, selectedEvent.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar Realizada</span>
                  </button>
                )}
              </div>

              {selectedEvent.type === 'FOLLOW_UP' && (
                <button
                  onClick={() => openRescheduleModal(selectedEvent)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Reprogramar Fecha
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REPROGRAMAR CITA */}
      {reschedulingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Reprogramar Seguimiento / Cita</span>
              </h3>
              <button
                onClick={() => setReschedulingEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Contacto: <strong>{reschedulingEvent.contactName}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nueva Fecha y Hora de la Cita *
                </label>
                <input
                  type="datetime-local"
                  value={newDateVal}
                  onChange={(e) => setNewDateVal(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo o Tarea Acordada
                </label>
                <input
                  type="text"
                  value={newTaskVal}
                  onChange={(e) => setNewTaskVal(e.target.value)}
                  placeholder="Ej: Presentar propuesta de vallas en San Pedro Sula"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setReschedulingEvent(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReschedule}
                disabled={savingReschedule || !newDateVal}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {savingReschedule ? 'Guardando...' : 'Guardar Nueva Fecha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
