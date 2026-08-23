import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart, X, Star, MessageCircle, User, Home, Compass, Users, Calendar,
  Bell, Sun, Moon, MapPin, CheckCircle2, Sparkles, Send, ChevronRight,
  ChevronLeft, Search, Filter, TrendingUp, Award, Zap, GraduationCap,
  BookOpen, Briefcase, PartyPopper, Camera, ArrowRight, Check,
  Plus, Bookmark, Repeat2, MoreHorizontal, Volume2, VolumeX, Play,
  Hash, Image as ImageIcon, Type as TypeIcon, Film, UserPlus, UserCheck,
  ChevronUp, ChevronDown, Clapperboard, Loader2, WifiOff
} from "lucide-react";
import * as cmApi from "./api/client";
import { ResponsiveContainer } from "./components";

/* ============================================================
   DESIGN TOKENS
   Display: Space Grotesk (geometric, technical -> engineering campus)
   Body: Inter
   Signature motif: the "Tri-Campus Constellation" — three glowing
   nodes (GGITS / GGCT / GGCE) orbiting a shared center, echoed in
   the logo mark, loaders, and the landing hero.
   ============================================================ */

const TOKENS = {
  dark: {
    bg: "#0A0D1A",
    bg2: "#0F1326",
    surface: "rgba(255,255,255,0.055)",
    surfaceStrong: "rgba(255,255,255,0.09)",
    border: "rgba(255,255,255,0.10)",
    text: "#F2F1FB",
    textMuted: "rgba(242,241,251,0.62)",
    textFaint: "rgba(242,241,251,0.38)",
  },
  light: {
    bg: "#F5F5FB",
    bg2: "#FFFFFF",
    surface: "rgba(255,255,255,0.75)",
    surfaceStrong: "rgba(255,255,255,0.95)",
    border: "rgba(20,18,31,0.08)",
    text: "#14121F",
    textMuted: "rgba(20,18,31,0.62)",