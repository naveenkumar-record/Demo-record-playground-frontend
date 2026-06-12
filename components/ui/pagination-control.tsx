import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControl: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const renderPages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
          currentPage === 1
            ? "cursor-not-allowed text-neutral-300"
            : "cursor-pointer text-[#1f1f1f] hover:bg-white",
        )}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>

      {renderPages().map((page, idx) =>
        typeof page === "number" ? (
          <button
            key={idx}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              "h-8 min-w-[32px] rounded-md px-2 text-[13px] transition-colors",
              currentPage === page
                ? "bg-[#ff5723] font-semibold text-white"
                : "cursor-pointer text-[#1f1f1f] hover:bg-white",
            )}
          >
            {page}
          </button>
        ) : (
          <span
            key={idx}
            className="px-1 text-[13px] text-neutral-400"
          >
            {page}
          </span>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
          currentPage === totalPages
            ? "cursor-not-allowed text-neutral-300"
            : "cursor-pointer text-[#1f1f1f] hover:bg-white",
        )}
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default PaginationControl;
