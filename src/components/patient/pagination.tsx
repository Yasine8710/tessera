import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
      {page > 1 ? (
        <LinkButton href={href(page - 1)} variant="secondary" size="sm">
          <ChevronLeft className="size-4" aria-hidden /> Newer
        </LinkButton>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <LinkButton href={href(page + 1)} variant="secondary" size="sm">
          Older <ChevronRight className="size-4" aria-hidden />
        </LinkButton>
      ) : (
        <span />
      )}
    </nav>
  );
}
