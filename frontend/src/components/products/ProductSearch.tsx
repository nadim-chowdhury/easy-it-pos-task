import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (query: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export default function ProductSearch({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search products",
  className = "max-w-md",
  loading = false,
}: ProductSearchProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex ${className}`}>
      <div className="relative flex-1">
        {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /> */}
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-1"
        />
      </div>
      <Button
        type="submit"
        size="default"
        className="rounded-l-none px-4 cursor-pointer w-12"
        disabled={loading}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
