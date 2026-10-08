import { ChevronDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { adminCopy } from "@/lib/copy";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Export actions grouped in one menu. Exports are not built yet, so each item says so. */
const ExportMenu = ({ print = true }: { print?: boolean }) => {
  const { toast } = useToast();
  const soon = () => toast({ title: adminCopy.soon_title, description: adminCopy.soon_desc });

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {adminCopy.export}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[184px]">
        <DropdownMenuItem className="gap-2 text-small" onSelect={soon}>
          <FileSpreadsheet aria-hidden className="h-4 w-4" /> {adminCopy.export_excel}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-small" onSelect={soon}>
          <FileText aria-hidden className="h-4 w-4" /> {adminCopy.export_pdf}
        </DropdownMenuItem>
        {print && (
          <DropdownMenuItem className="gap-2 text-small" onSelect={soon}>
            <Printer aria-hidden className="h-4 w-4" /> {adminCopy.print}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
