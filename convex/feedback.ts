import { v } from "convex/values";
import { action } from "./_generated/server";

const CATEGORY_LABELS: Record<string, string[]> = {
  bug: ["bug", "user-reported"],
  feature: ["enhancement", "user-reported"],
  question: ["question", "user-reported"],
};

export const submitFeedback = action({
  args: {
    category: v.union(
      v.literal("bug"),
      v.literal("feature"),
      v.literal("question")
    ),
    subject: v.string(),
    description: v.string(),
    userEmail: v.string(),
  },
  handler: async (_ctx, args) => {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;

    if (!token || !owner || !repo) {
      throw new Error("GitHub integration not configured");
    }

    const categoryLabel =
      args.category === "bug"
        ? "Bug Report"
        : args.category === "feature"
          ? "Feature Request"
          : "General Question";

    const body = `## Feedback Details
**Category:** ${categoryLabel}
**Submitted by:** ${args.userEmail}
**Submitted via:** HSA Songbook in-app feedback

---

${args.description}

---
*This issue was automatically created from the HSA Songbook feedback form.*`;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: `[${args.category.toUpperCase()}] ${args.subject}`,
          body,
          labels: CATEGORY_LABELS[args.category],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("GitHub API error:", error);
      throw new Error("Failed to submit feedback. Please try again later.");
    }

    const issue = (await response.json()) as { number: number; html_url: string };
    return {
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    };
  },
});
