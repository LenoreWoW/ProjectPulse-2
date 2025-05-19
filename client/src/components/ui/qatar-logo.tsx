import { useI18n } from "@/hooks/use-i18n-new";
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
    sm: { logo: "h-8" },
    md: { logo: "h-12" },
    lg: { logo: "h-16" },
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
      {/* Removed the "projectManagementSystem" text that was previously to the left of the logo */}
    </div>
  );
}