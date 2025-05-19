import { ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n-new";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, Filter, Download } from "lucide-react";
import { Link } from "wouter";

interface ReportTemplateProps {
  title: string;
  description: string;
  children: ReactNode;
  backLink?: string;
}

export function ReportTemplate({
  title,
  description,
  children,
  backLink = "/reports"
}: ReportTemplateProps) {
  const { t } = useI18n();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href={backLink}>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>2023-2024</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters")}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t("exportPDF")}
          </Button>
        </div>
      </div>
      
      {children}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  valueColor?: string;
}

export function SummaryCard({ title, value, description, valueColor }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor || ''}`}>{value}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ReportCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ReportCard({ title, description, children }: ReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
} 