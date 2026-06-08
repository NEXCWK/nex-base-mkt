import { cn } from "@/lib/utils";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  if (!content) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Sem conteúdo. Clique em Editar para adicionar.
      </p>
    );
  }

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())) {
      nodes.push(<hr key={i} className="my-5 border-gray-medium" />);
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      nodes.push(
        <h3 key={i} className="text-sm font-semibold mt-5 mb-1.5 text-foreground">
          {renderInline(h3[1])}
        </h3>
      );
      i++;
      continue;
    }

    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      nodes.push(
        <h2 key={i} className="text-sm font-bold mt-6 mb-2 text-foreground uppercase tracking-wide">
          {renderInline(h2[1])}
        </h2>
      );
      i++;
      continue;
    }

    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      nodes.push(
        <h1 key={i} className="text-base font-bold mt-7 mb-2 text-foreground first:mt-0">
          {renderInline(h1[1])}
        </h1>
      );
      i++;
      continue;
    }

    // Table — collect consecutive rows
    if (line.startsWith("|")) {
      const rawRows: string[][] = [];
      let hasSeparator = false;

      while (i < lines.length && lines[i].startsWith("|")) {
        const row = lines[i];
        if (/^\|[\s\-:|]+\|$/.test(row)) {
          hasSeparator = true;
        } else {
          const cells = row
            .slice(1, row.endsWith("|") ? -1 : undefined)
            .split("|")
            .map((c) => c.trim());
          rawRows.push(cells);
        }
        i++;
      }

      const headerRows = hasSeparator && rawRows.length > 1 ? [rawRows[0]] : [];
      const bodyRows = hasSeparator && rawRows.length > 1 ? rawRows.slice(1) : rawRows;

      nodes.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto">
          <table className="w-full text-sm border border-gray-medium rounded-lg overflow-hidden">
            <tbody>
              {headerRows.map((row, ri) => (
                <tr key={`h-${ri}`} className="bg-gray-light border-b border-gray-medium">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 font-semibold text-foreground align-top">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
              {bodyRows.map((row, ri) => (
                <tr key={`b-${ri}`} className={cn("border-b border-gray-medium last:border-0", ri % 2 === 1 ? "bg-gray-light/40" : "")}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={cn("px-3 py-2 text-gray-dark align-top", ci === 0 && headerRows.length === 0 ? "font-medium" : "")}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // List — collect consecutive items
    if (/^[-•] /.test(line)) {
      const startIdx = i;
      const items: string[] = [];
      while (i < lines.length && /^[-•] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-•] /, ""));
        i++;
      }
      nodes.push(
        <ul key={`list-${startIdx}`} className="my-2 pl-4 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-gray-dark leading-relaxed list-disc ml-2">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={i} className="text-sm text-gray-dark leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={cn("space-y-0.5", className)}>{nodes}</div>;
}
