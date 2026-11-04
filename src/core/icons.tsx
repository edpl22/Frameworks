import type { ComponentType } from 'react';
import {
  Zap, Shield, Sparkles, Rocket, BarChart3, Globe, Lock, Layers, Cpu, Cloud, Code2, Palette,
  Heart, Star, Users, MessageCircle, Mail, Phone, MapPin, Clock, Check, CheckCircle2, Gauge,
  Target, TrendingUp, Wand2, Workflow, Database, Smartphone, Leaf, Award, Gem, Infinity as InfinityIcon,
  Menu, ArrowRight, Play, Box, Camera, Coffee,
  Eye, BookOpen, Feather, Key, Flame, Moon, Hourglass, Crosshair, Activity, Bus, Scroll, Ticket,
  type LucideIcon,
} from 'lucide-react';

// Brand marks (lucide no longer ships brand logos) — simple monochrome glyphs.
type IconLike = ComponentType<{ size?: number | string; strokeWidth?: number | string; 'aria-hidden'?: boolean | 'true' }>;
const brand = (d: string): IconLike => ({ size = 24, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}><path d={d} /></svg>
);
const Github = brand('M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z');
const Twitter = brand('M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z');
const Linkedin = brand('M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z');
const Instagram = brand('M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z');
const Youtube = brand('M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z');
export { Github };

/** Curated icon set available inside generated sites (names follow lucide.dev). */
export const SITE_ICONS: Record<string, LucideIcon | IconLike> = {
  zap: Zap, shield: Shield, sparkles: Sparkles, rocket: Rocket, chart: BarChart3, globe: Globe,
  lock: Lock, layers: Layers, cpu: Cpu, cloud: Cloud, code: Code2, palette: Palette, heart: Heart,
  star: Star, users: Users, message: MessageCircle, mail: Mail, phone: Phone, pin: MapPin,
  clock: Clock, check: Check, 'check-circle': CheckCircle2, gauge: Gauge, target: Target,
  trending: TrendingUp, wand: Wand2, workflow: Workflow, database: Database, smartphone: Smartphone,
  leaf: Leaf, award: Award, gem: Gem, infinity: InfinityIcon, box: Box, camera: Camera, coffee: Coffee,
  github: Github, twitter: Twitter, linkedin: Linkedin, instagram: Instagram, youtube: Youtube,
  menu: Menu, arrow: ArrowRight, play: Play,
  eye: Eye, book: BookOpen, feather: Feather, key: Key, flame: Flame, moon: Moon, hourglass: Hourglass,
  crosshair: Crosshair, activity: Activity, bus: Bus, scroll: Scroll, ticket: Ticket,
};

export const ICON_NAMES = Object.keys(SITE_ICONS);

export function SiteIcon({ name, size }: { name: string; size?: number }) {
  const I = SITE_ICONS[name] ?? Sparkles;
  return <I size={size} strokeWidth={1.75} aria-hidden="true" />;
}
