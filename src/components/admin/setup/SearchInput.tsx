import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

/** Toolbar search field: search icon at the start, label from the placeholder. */
const SearchInput = ({ value, onChange, placeholder, className }: SearchInputProps) => (
  <div className={cn("relative w-full sm:w-80", className)}>
    <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 ps-10 text-small"
    />
  </div>
);

export default SearchInput;
