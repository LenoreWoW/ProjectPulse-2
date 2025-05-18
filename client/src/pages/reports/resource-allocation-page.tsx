import { ReportTemplate, ReportCard } from "@/components/reports/report-template";
import { useI18n } from "@/hooks/use-i18n-new";
import { Button } from "@/components/ui/button";
import { Download, Users } from "lucide-react";

export default function ResourceAllocationReportPage() {
  const { t } = useI18n();

  const exportReport = () => {
    alert("Export functionality not implemented yet");
  };

  return (
    <ReportTemplate
      title={t("resourceAllocationReport")}
      description={t("resourceAllocationDescription")}
    >
      <ReportCard
        title={t("resourceAllocation")}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-medium">{t("teamAllocation")}</h3>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={exportReport}
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
        
        <div className="py-12 text-center bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="text-xl font-semibold mb-2">{t("comingSoon")}</h3>
          <p>{t("resourceAllocationReportUnderDevelopment")}</p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("checkBackSoon")}</p>
        </div>
      </ReportCard>
    </ReportTemplate>
  );
} 