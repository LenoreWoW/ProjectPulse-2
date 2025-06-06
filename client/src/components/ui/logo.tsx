import { useI18n } from "@/hooks/use-i18n";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
}

export function Logo({ className = "", size = "md", hideText = false }: LogoProps) {
  const { t, isRtl } = useI18n();
  
  // Determine size classes
  const sizeClasses = {
    sm: { logo: "w-6 h-6", text: "text-sm ml-1.5" },
    md: { logo: "w-8 h-8", text: "text-lg ml-2" },
    lg: { logo: "w-10 h-10", text: "text-xl ml-3" },
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size].logo} bg-maroon-700 rounded flex items-center justify-center text-white font-bold`}>
        PMO
      </div>
      {!hideText && (
        <span className={`font-semibold ${sizeClasses[size].text} ${isRtl ? 'mr-2 ml-0' : 'ml-2 mr-0'}`}>
          مشاريعنا
        </span>
      )}
    </div>
  );
}
