import React from 'react';
import {
  Users, UserPlus, UserCheck, UserX, UserMinus,
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  ShoppingBag, ShoppingCart, Package, Truck, ClipboardPenLine,
  Target, Activity, Zap, Heart, Star,
  Calendar, Clock, Globe, MapPin,
  Mail, Phone, MessageSquare, Bell,
  Settings, Filter, Search, Download,
  Eye, Edit, Trash2, Plus, Minus,
  ArrowUp, ArrowDown, ArrowRight, ArrowLeft,
  CheckCircle, XCircle, AlertCircle, Info, ChartArea, ChartPie
} from 'lucide-react';

type IconName = 
  // User/Customer icons
  | 'users' | 'user-plus' | 'user-check' | 'user-x' | 'user-minus'
  // Financial icons
  | 'dollar-sign' | 'trending-up' | 'trending-down' | 'bar-chart' | 'area-chart' | 'pie-chart'
  // Commerce icons
  | 'shopping-bag' | 'shopping-cart' | 'package' | 'truck' | 'order'
  // Performance icons
  | 'target' | 'activity' | 'zap' | 'heart' | 'star'
  // Time/Location icons
  | 'calendar' | 'clock' | 'globe' | 'map-pin'
  // Communication icons
  | 'mail' | 'phone' | 'message-square' | 'bell'
  // Action icons
  | 'settings' | 'filter' | 'search' | 'download'
  | 'eye' | 'edit' | 'trash' | 'plus' | 'minus'
  // Arrow icons
  | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'arrow-left'
  // Status icons
  | 'check-circle' | 'x-circle' | 'alert-circle' | 'info';

interface MetricIconProps {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const iconMap = {
  // User/Customer icons
  'users': Users,
  'user-plus': UserPlus,
  'user-check': UserCheck,
  'user-x': UserX,
  'user-minus': UserMinus,
  // Financial icons
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'bar-chart': BarChart3,
  'order': ClipboardPenLine,
  'pie-chart': ChartPie,
  'area-chart': ChartArea,
   // Commerce icons
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'package': Package,
  'truck': Truck,
  // Performance icons
  'target': Target,
  'activity': Activity,
  'zap': Zap,
  'heart': Heart,
  'star': Star,
  // Time/Location icons
  'calendar': Calendar,
  'clock': Clock,
  'globe': Globe,
  'map-pin': MapPin,
  // Communication icons
  'mail': Mail,
  'phone': Phone,
  'message-square': MessageSquare,
  'bell': Bell,
  // Action icons
  'settings': Settings,
  'filter': Filter,
  'search': Search,
  'download': Download,
  'eye': Eye,
  'edit': Edit,
  'trash': Trash2,
  'plus': Plus,
  'minus': Minus,
  // Arrow icons
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  // Status icons
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  'info': Info,
};

const MetricIcon: React.FC<MetricIconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  style = {}
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  const defaultStyle: React.CSSProperties = {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
    opacity: 0.9,
    ...style
  };

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={defaultStyle}
    />
  );
};

export default MetricIcon;