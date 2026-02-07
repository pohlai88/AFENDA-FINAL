"use client";

/**
 * Machina Action Recommendation Engine
 * Intelligent action recommendations based on usage patterns and system state.
 */

import * as React from "react";
import { useUser } from "@/app/_components/user-context";
import { QuickAction } from "./types";

export interface ActionScore {
  actionId: string;
  score: number; // 0-100
  reasons: string[];
  priority: "low" | "medium" | "high";
}

export interface RecommendationContext {
  systemHealth: {
    summary?: {
      degraded?: number;
      down?: number;
    };
    status?: string;
  } | null;
  recentAudit: Array<{
    eventType: string;
    id: string;
  }>;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  userRole: string;
  usageHistory: Array<{
    actionId: string;
    timestamp: Date;
    frequency: number;
  }>;
}

export class MachinaRecommendationEngine {
  private weights = {
    frequency: 0.3, // How often user uses this action
    recency: 0.2, // How recently user used this action
    context: 0.25, // Current system context relevance
    time: 0.15, // Time-based patterns
    role: 0.1, // Role-based preferences
  };

  /**
   * Calculate recommendation scores for all actions
   */
  calculateRecommendations(
    actions: QuickAction[],
    context: RecommendationContext
  ): ActionScore[] {
    return actions.map(action => ({
      actionId: action.id,
      score: this.calculateActionScore(action, context),
      reasons: this.getReasons(action, context),
      priority: this.getPriority(action, context),
    })).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate score for a single action using machina intelligence
   */
  private calculateActionScore(action: QuickAction, context: RecommendationContext): number {
    let score = 50; // Base score

    // Frequency weight
    const usage = context.usageHistory.find(u => u.actionId === action.id);
    if (usage) {
      score += Math.min(usage.frequency * 10, 30) * this.weights.frequency;
    }

    // Recency weight
    if (usage) {
      const hoursSinceUse = (Date.now() - usage.timestamp.getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 20 - hoursSinceUse);
      score += recencyScore * this.weights.recency;
    }

    // Context weight - System state relevance
    const contextScore = this.calculateContextScore(action, context);
    score += contextScore * this.weights.context;

    // Time-based patterns
    const timeScore = this.calculateTimeScore(action, context);
    score += timeScore * this.weights.time;

    // Role-based preferences
    const roleScore = this.calculateRoleScore(action, context);
    score += roleScore * this.weights.role;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate context relevance score
   */
  private calculateContextScore(action: QuickAction, context: RecommendationContext): number {
    let score = 0;

    // System health issues
    if (context.systemHealth?.status === "degraded") {
      if (action.id.includes("health") || action.id.includes("troubleshoot")) {
        score += 40;
      }
    }

    if (context.systemHealth?.status === "down") {
      if (action.id.includes("restart") || action.id.includes("emergency")) {
        score += 50;
      }
    }

    // Recent audit events
    const recentErrors = context.recentAudit.filter(a =>
      a.eventType.includes("error") || a.eventType.includes("failure")
    );
    if (recentErrors.length > 0) {
      if (action.id.includes("audit") || action.id.includes("logs")) {
        score += 30;
      }
    }

    // Service-specific issues
    if (context.systemHealth?.summary?.down && context.systemHealth.summary.down > 0) {
      if (action.id.includes("service") || action.id.includes("restart")) {
        score += 35;
      }
    }

    return score;
  }

  /**
   * Calculate time-based pattern score
   */
  private calculateTimeScore(action: QuickAction, context: RecommendationContext): number {
    let score = 0;

    // Morning hours (6-12) - Maintenance tasks
    if (context.timeOfDay >= 6 && context.timeOfDay < 12) {
      if (action.id.includes("backup") || action.id.includes("maintenance")) {
        score += 20;
      }
    }

    // Business hours (9-17) - Monitoring tasks
    if (context.timeOfDay >= 9 && context.timeOfDay < 17) {
      if (action.id.includes("health") || action.id.includes("monitor")) {
        score += 15;
      }
    }

    // Evening hours (17-21) - Review tasks
    if (context.timeOfDay >= 17 && context.timeOfDay < 21) {
      if (action.id.includes("report") || action.id.includes("review")) {
        score += 15;
      }
    }

    // Weekend - Less critical tasks
    if (context.dayOfWeek === 0 || context.dayOfWeek === 6) {
      if (action.id.includes("config") || action.id.includes("update")) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Calculate role-based score
   */
  private calculateRoleScore(action: QuickAction, context: RecommendationContext): number {
    let score = 0;

    // Admin preferences
    if (context.userRole === "admin") {
      if (action.adminOnly) {
        score += 20; // Boost admin-specific actions
      }
      if (action.id.includes("security") || action.id.includes("audit")) {
        score += 10;
      }
    }

    // User preferences
    if (context.userRole === "user") {
      if (!action.adminOnly) {
        score += 10; // Boost user-friendly actions
      }
    }

    return score;
  }

  /**
   * Get reasons for recommendation
   */
  private getReasons(action: QuickAction, context: RecommendationContext): string[] {
    const reasons: string[] = [];

    const usage = context.usageHistory.find(u => u.actionId === action.id);
    if (usage && usage.frequency > 5) {
      reasons.push("Frequently used");
    }

    if (context.systemHealth?.status === "degraded" &&
      (action.id.includes("health") || action.id.includes("troubleshoot"))) {
      reasons.push("System needs attention");
    }

    if (context.systemHealth?.summary?.down && context.systemHealth.summary.down > 0 &&
      action.id.includes("restart")) {
      reasons.push("Services are down");
    }

    const recentErrors = context.recentAudit.filter(a =>
      a.eventType.includes("error") || a.eventType.includes("failure")
    );
    if (recentErrors.length > 3 && action.id.includes("audit")) {
      reasons.push("High error rate detected");
    }

    if (context.timeOfDay >= 9 && context.timeOfDay < 17 &&
      action.id.includes("monitor")) {
      reasons.push("Business hours monitoring");
    }

    return reasons;
  }

  /**
   * Get priority level
   */
  private getPriority(action: QuickAction, context: RecommendationContext): "low" | "medium" | "high" {
    const score = this.calculateActionScore(action, context);

    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  }
}

/**
 * Hook for using the recommendation engine
 */
export function useActionRecommendations(
  actions: QuickAction[],
  systemHealth: {
    summary?: {
      degraded?: number;
      down?: number;
    };
    status?: string;
  } | null,
  recentAudit: Array<{
    eventType: string;
    id: string;
  }>
) {
  const { user } = useUser();
  const engine = React.useMemo(() => new MachinaRecommendationEngine(), []);

  // Mock usage history - in real implementation, this would come from analytics
  const usageHistory = React.useMemo(() => {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return [
      { actionId: "view-health", timestamp: twoHoursAgo, frequency: 8 },
      { actionId: "view-audit", timestamp: fourHoursAgo, frequency: 5 },
      { actionId: "manage-config", timestamp: oneDayAgo, frequency: 3 },
    ];
  }, []);

  const context = React.useMemo(() => ({
    systemHealth,
    recentAudit,
    timeOfDay: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    userRole: user?.role || "user",
    usageHistory,
  }), [systemHealth, recentAudit, user, usageHistory]);

  const recommendations = React.useMemo(() => {
    return engine.calculateRecommendations(actions, context);
  }, [engine, actions, context]);

  return recommendations;
}
