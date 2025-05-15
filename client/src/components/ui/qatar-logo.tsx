import { useI18n } from "@/hooks/use-i18n";
import qatarLogoPath from "@assets/Finallogo.jpg";

interface QatarLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
}

export function QatarLogo({ className = "", size = "md", hideText = false }: QatarLogoProps) {
  const { t, isRtl } = useI18n();
  
  // Determine size classes
  const sizeClasses = {
    sm: { logo: "h-8", text: "text-sm ml-1.5" },
    md: { logo: "h-12", text: "text-lg ml-2" },
    lg: { logo: "h-16", text: "text-xl ml-3" },
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size].logo} flex items-center`}>
        {/* Qatar Ministry of Defence Logo */}
        <img 
          src={qatarLogoPath} 
          alt="Qatar Ministry of Defence"
          className="h-full object-contain"
        />
      </div>
      {!hideText && (
        <div className={`font-semibold ${sizeClasses[size].text} ${isRtl ? 'mr-3 ml-0' : 'ml-3 mr-0'} flex flex-col`}>
          <span className="text-white font-bold">
            {t("projectManagementSystem")}
          </span>
        </div>
      )}
    </div>
  );
}