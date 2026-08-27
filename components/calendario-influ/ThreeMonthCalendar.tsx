"use client";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, format, isSameDay, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { USO_META, type PublicConfirmedEntry } from "./types";

const WEEKDAY_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function MonthGrid({ monthDate, entries }: { monthDate: Date; entries: PublicConfirmedEntry[] }) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const leading = getDay(start);

  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border border-gray-medium rounded-xl overflow-hidden bg-white flex-1 min-w-0">
      <div className="bg-black text-white px-4 py-3">
        <p className="text-sm font-700 capitalize">{format(monthDate, "MMMM yyyy", { locale: ptBR })}</p>
      </div>
      <div className="grid grid-cols-7 bg-gray-light border-b border-gray-medium">
        {WEEKDAY_SHORT.map((d, i) => (
          <div key={i} className="py-1.5 text-center text-[10px] font-600 uppercase text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const dayEntries = date ? entries.filter((e) => e.data && isSameDay(parseISO(e.data), date)) : [];
          return (
            <div
              key={i}
              className={cn(
                "min-h-[64px] border-r border-b border-gray-medium p-1 flex flex-col gap-0.5 [&:nth-child(7n)]:border-r-0",
                !date && "bg-gray-light/60"
              )}
            >
              {date && (
                <>
                  <span className="text-[10px] font-600 text-muted-foreground">{date.getDate()}</span>
                  {dayEntries.map((e) => (
                    <span
                      key={e.id}
                      title={`${e.name} · ${USO_META[e.uso].label}`}
                      className={cn("text-[9px] font-600 rounded px-1 py-0.5 leading-tight truncate", USO_META[e.uso].chip)}
                    >
                      {e.name}
                    </span>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ThreeMonthCalendar({ entries }: { entries: PublicConfirmedEntry[] }) {
  const now = new Date();
  const months = [now, addMonths(now, 1), addMonths(now, 2)];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {months.map((m) => (
        <MonthGrid key={m.getMonth()} monthDate={m} entries={entries} />
      ))}
    </div>
  );
}
