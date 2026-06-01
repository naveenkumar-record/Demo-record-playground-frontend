import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

    if (totalPages <= 3) {
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
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {renderPages().map((page, idx) =>
        typeof page === "number" ? (
          <Button
            key={idx}
            size="icon"
            onClick={() => onPageChange(page)}
            className={
              currentPage === page
                ? "h-9 w-9 bg-[#1a3a2a] text-white hover:bg-[#142e22]"
                : "h-9 w-9 border border-neutral-200 bg-white text-[#3a3a3a] hover:bg-neutral-50"
            }
            variant={currentPage === page ? "default" : "outline"}
          >
            {page}
          </Button>
        ) : (
          <span
            key={idx}
            className="flex h-9 w-9 items-center justify-center select-none text-[13px] text-muted-foreground"
          >
            {page}
          </span>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PaginationControl;
