"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
}

type FetchState = "idle" | "loading" | "success" | "error";

function getRelativeLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanha";
  return format(date, "EEE, d MMM", { locale: ptBR });
}

function formatTime(dateStr: string, allDay?: boolean): string {
  if (allDay) return "Dia inteiro";
  return format(parseISO(dateStr), "HH:mm", { locale: ptBR });
}

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [state, setState] = useState<FetchState>("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar", { signal: controller.signal });
        if (!res.ok) throw new Error("request failed");
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events.slice(0, 5) : []);
        setState("success");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState("error");
        }
      }
    }

    fetchEvents();
    return () => controller.abort();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar size={15} className="text-muted-foreground" />
          Proximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {state === "loading" && (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-gray-light animate-pulse" />
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <AlertCircle size={20} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Google Calendar não configurado
            </p>
            <p className="text-xs text-muted-foreground">
              Configure as variáveis de ambiente para ver seus eventos.
            </p>
          </div>
        )}

        {state === "success" && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <Calendar size={20} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
          </div>
        )}

        {state === "success" && events.length > 0 && (
          <ul className="space-y-1">
            {events.map((event) => {
              const relLabel = getRelativeLabel(event.start);
              const isCurrentDay = isToday(parseISO(event.start));
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-gray-light transition-colors group"
                >
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full",
                      isCurrentDay ? "bg-accent" : "bg-gray-medium"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">
                        {relLabel}
                      </span>
                      {!event.allDay && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <Clock size={11} className="text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {formatTime(event.start)}
                          </span>
                        </>
                      )}
                      {event.allDay && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">Dia inteiro</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
