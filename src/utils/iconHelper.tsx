import React from 'react';
import {
  DollarSign,
  Target,
  Dumbbell,
  BookOpen,
  Zap,
  ShieldCheck,
  Flame,
  TrendingUp,
  AlertTriangle,
  Heart,
  Brain,
  Sparkles,
  Coffee,
  CheckCircle2,
  Smile,
  Moon,
  Clock,
  Briefcase,
  Award,
} from 'lucide-react';

export function getIndicatorIcon(iconName: string, className = 'w-5 h-5'): React.ReactNode {
  switch (iconName?.toLowerCase()) {
    case 'dollarsign':
    case 'money':
    case 'dollar':
      return <DollarSign className={className} />;
    case 'target':
    case 'goal':
      return <Target className={className} />;
    case 'dumbbell':
    case 'workout':
    case 'fitness':
      return <Dumbbell className={className} />;
    case 'bookopen':
    case 'book':
    case 'study':
      return <BookOpen className={className} />;
    case 'zap':
    case 'focus':
    case 'deepwork':
      return <Zap className={className} />;
    case 'shieldcheck':
    case 'shield':
    case 'discipline':
      return <ShieldCheck className={className} />;
    case 'flame':
    case 'fire':
    case 'energy':
      return <Flame className={className} />;
    case 'trendingup':
    case 'sales':
    case 'growth':
      return <TrendingUp className={className} />;
    case 'alerttriangle':
    case 'warning':
    case 'sabotage':
      return <AlertTriangle className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'brain':
    case 'mindset':
      return <Brain className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'moon':
    case 'sleep':
      return <Moon className={className} />;
    case 'clock':
    case 'time':
      return <Clock className={className} />;
    case 'briefcase':
    case 'work':
      return <Briefcase className={className} />;
    case 'award':
    case 'trophy':
      return <Award className={className} />;
    case 'smile':
      return <Smile className={className} />;
    case 'sparkles':
    default:
      return <Sparkles className={className} />;
  }
}
