"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Filter, 
  X, 
  ChevronDown, 
  DollarSign, 
  Tag,
  Calendar,
  Layers,
  Star,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Target,
  Globe,
  Clock,
  User,
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  MapPin,
  ArrowRight,
  Play
} from "lucide-react";

interface NavbarButton {
  label: string;
  onClick: (buttonData: { label: string; action: string; timestamp: Date }) => void;
  icon?: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
  actionType?: string;
}



interface AdvancedNavbarProps {
  title?: string;
  showTitle?: boolean;
  customTitle?: React.ReactNode;
  createButtons?: NavbarButton[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  searchSuggestions?: string[];
  className?: string;
  enabledFeatures?: {
    search?: boolean;
    filters?: boolean;
    title?: boolean;
    createButtons?: boolean;
  };
  onFeaturesChange?: (features: any) => void;
  theme?: "default" | "sales" | "analytics" | "inventory";
  quickStats?: {
    label: string;
    value: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
  }[];
  onButtonClick?: (buttonData: { label: string; action: string; timestamp: Date; data?: any }) => void;
  navTitle?: string | React.ReactNode;
}

export const AdvancedNavbar: React.FC<AdvancedNavbarProps> = ({
  title = "BavFlow ERP",
  showTitle = true,
  customTitle,
  createButtons = [],
  searchPlaceholder = "Search across orders, customers, products...",
  onSearch,
  searchSuggestions = [],
  className,
  enabledFeatures = {
    search: true,
    filters: true,
    title: true,
    createButtons: true
  },
  theme = "default",
  quickStats = [],
  onButtonClick,
  navTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = searchSuggestions.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced theme configurations with better gradients
  const themeConfigs = {
    default: {
      gradient: "from-slate-900 via-blue-900 to-purple-900",
      accent: "blue",
      icon: <Layers className="w-5 h-5 text-white" />,
      buttonGradient: "from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
      glow: "shadow-blue-500/25",
      border: "border-blue-500/20"
    },
    sales: {
      gradient: "from-emerald-900 via-green-900 to-teal-900",
      accent: "green",
      icon: <ShoppingCart className="w-5 h-5 text-white" />,
      buttonGradient: "from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600",
      glow: "shadow-green-500/25",
      border: "border-green-500/20"
    },
    analytics: {
      gradient: "from-violet-900 via-purple-900 to-indigo-900",
      accent: "purple",
      icon: <BarChart3 className="w-5 h-5 text-white" />,
      buttonGradient: "from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600",
      glow: "shadow-purple-500/25",
      border: "border-purple-500/20"
    },
    inventory: {
      gradient: "from-amber-900 via-orange-900 to-red-900",
      accent: "orange",
      icon: <Package className="w-5 h-5 text-white" />,
      buttonGradient: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
      glow: "shadow-orange-500/25",
      border: "border-orange-500/20"
    }
  };

  const currentTheme = themeConfigs[theme];

  // Initialize component
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % filteredSuggestions.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prev) =>
        prev === 0 ? filteredSuggestions.length - 1 : prev - 1
      );
      e.preventDefault();
    } else if (e.key === "Enter") {
      onSearch?.(filteredSuggestions[highlightedIndex]);
      setSearchQuery(filteredSuggestions[highlightedIndex]);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Enhanced button click handler
  const handleButtonClick = (button: NavbarButton, event: React.MouseEvent) => {
    const buttonData = {
      label: button.label,
      action: button.actionType || button.label.toLowerCase().replace(/\s+/g, '_'),
      timestamp: new Date(),
      data: {
        buttonType: button.variant || 'default',
        className: button.className,
        hasIcon: !!button.icon
      }
    };

    button.onClick(buttonData);
    onButtonClick?.(buttonData);
  };

  if (!mounted) {
    return (
      <div className={cn(
        `w-full bg-gradient-to-r ${currentTheme.gradient} text-white shadow-2xl border-b ${currentTheme.border} animate-pulse`,
        className
      )}>
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 space-y-4 md:space-y-0">
          <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
          <div className="h-10 w-96 bg-white/10 rounded-xl"></div>
          <div className="h-10 w-64 bg-white/10 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        `w-full bg-gradient-to-r ${currentTheme.gradient} text-white shadow-2xl border-b ${currentTheme.border} backdrop-blur-xl relative overflow-hidden`,
        className
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-conic from-transparent via-white/5 to-transparent animate-spin-slow"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Top Bar with Quick Stats */}
      {quickStats && quickStats.length > 0 && (
        <div className="px-6 py-2 bg-black/20 border-b border-white/10 relative z-10">
          <div className="flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full">
                <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                <span className="text-xs text-gray-200 font-medium">Live Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {quickStats.map((stat, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-2 text-xs group cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <div className="p-1.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                    {stat.icon}
                  </div>
                  <span className="text-gray-300 group-hover:text-white transition-colors">{stat.label}:</span>
                  <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded-md group-hover:bg-white/20 transition-colors">
                    {stat.value}
                  </span>
                  {stat.trend && (
                    <TrendingUp 
                      className={cn(
                        "w-3 h-3 transition-transform duration-300 group-hover:scale-125",
                        stat.trend === "up" ? "text-green-400" : 
                        stat.trend === "down" ? "text-red-400 rotate-180" : 
                        "text-gray-400"
                      )} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 space-y-4 md:space-y-0 relative z-10">
        {/* Left - Title & Logo */}
        {enabledFeatures.title && (
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className={cn(
              "w-12 h-12 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-glow",
              `from-${currentTheme.accent}-400 to-${currentTheme.accent}-600 ${currentTheme.glow}`
            )}>
              {currentTheme.icon}
            </div>
            
            {/* Nav Title - Priority: navTitle > customTitle > title */}
            {navTitle ? (
              <div className="flex flex-col">
                <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {navTitle}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-300 font-medium">System Active</span>
                  </div>
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                </div>
              </div>
            ) : customTitle ? (
              customTitle
            ) : (
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  {title}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1 bg-green-500/20 px-2 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-300 font-medium">System Active</span>
                  </div>
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Middle - Search */}
        {enabledFeatures.search && (
          <div className="relative w-full md:w-1/3 min-w-[320px] group">
            <div className="relative transform transition-all duration-500 group-hover:scale-[1.02]">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50"></div>
              
              <div className="relative z-20 flex items-center">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
                  <Search className="w-4 h-4 text-gray-300 group-hover:text-white transition-all duration-300 group-hover:scale-110" />
                </div>
                
                <Input
                  ref={searchRef}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    onSearch?.(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-12 pr-12 py-3 w-full bg-white/15 backdrop-blur-md border-white/30 text-white placeholder-gray-300 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-500 relative z-20 border-2 group-hover:border-white/40 group-hover:bg-white/20"
                />
                
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      onSearch?.("");
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-all duration-300 z-30 hover:scale-110"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Search Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full mt-3 w-full bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-300">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span>Quick Search</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300">
                      {filteredSuggestions.length} results
                    </Badge>
                  </div>
                </div>
                <div className="p-2">
                  {filteredSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm transition-all duration-300 rounded-xl group/suggestion mb-1 last:mb-0",
                        highlightedIndex === idx
                          ? `bg-${currentTheme.accent}-500/20 text-${currentTheme.accent}-100 border border-${currentTheme.accent}-400/30`
                          : "hover:bg-white/10 text-gray-300 hover:text-white border border-transparent"
                      )}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                        onSearch?.(suggestion);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "p-2 rounded-xl transition-all duration-300 group-hover/suggestion:scale-110",
                            highlightedIndex === idx 
                              ? `bg-${currentTheme.accent}-500/30` 
                              : "bg-white/10"
                          )}>
                            <Search className="w-3 h-3" />
                          </div>
                          <span className="font-medium">{suggestion}</span>
                        </div>
                        <ArrowRight className={cn(
                          "w-4 h-4 transition-all duration-300 transform group-hover/suggestion:translate-x-1",
                          highlightedIndex === idx ? "opacity-100" : "opacity-0 group-hover/suggestion:opacity-100"
                        )} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right - Actions */}
        <div className="flex items-center space-x-3">

          {/* Enhanced Create Buttons */}
          {enabledFeatures.createButtons && createButtons.length > 0 && (
            <div className="flex items-center space-x-2">
              {createButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  onClick={(e) => handleButtonClick(btn, e)}
                  variant={btn.variant || "default"}
                  className={cn(
                    `bg-gradient-to-r ${currentTheme.buttonGradient} text-white shadow-xl transition-all duration-500 hover:shadow-2xl hover:scale-105 group relative overflow-hidden border-2 border-white/20`,
                    "min-w-[120px] h-11 rounded-xl font-semibold",
                    btn.className
                  )}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <span className="relative z-10 flex items-center gap-2">
                    {btn.icon || <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />}
                    {btn.label}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};