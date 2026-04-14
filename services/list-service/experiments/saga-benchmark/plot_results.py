"""
Plot availability vs consistency experiment results.

Usage:
    pip install matplotlib numpy
    python plot_results.py
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

OUTPUT_DIR = "image/distributed-consistency-layers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Measured Data ──────────────────────────────────────────

# Layer 2: Saga (direct publish)
saga_baseline = {"availability": 100.0, "e2e_p50": 6, "e2e_p99": 8}
saga_degraded = {"availability": 100.0, "e2e_p50": 2266, "e2e_p99": 2343}
saga_recovery = {"drain_time_ms": 18}

# Layer 3: Saga + Outbox
outbox_baseline = {"availability": 100.0, "e2e_p50": 62, "e2e_p99": 74}
outbox_degraded = {"availability": 100.0, "e2e_p50": 1354, "e2e_p99": 1371}
outbox_recovery = {"drain_time_ms": 9}

# Aliases for backward compat in plots that only use one layer
baseline = saga_baseline
degraded = saga_degraded
recovery = saga_recovery

# ── Style ──────────────────────────────────────────────────

BLUE = "#4A90D9"
RED = "#E06666"
GREEN = "#6AA84F"
ORANGE = "#E69138"
GRAY = "#999999"
LIGHT_BG = "#F8F9FA"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 11,
    "axes.facecolor": LIGHT_BG,
    "figure.facecolor": "white",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.linestyle": "--",
})


# ── Figure 1: Availability Under Partition ─────────────────

fig, ax = plt.subplots(figsize=(8, 5))

scenarios = ["Baseline\n(both UP)", "Degraded\n(list-service DOWN)"]
saga_avail = [saga_baseline["availability"], saga_degraded["availability"]]
outbox_avail = [outbox_baseline["availability"], outbox_degraded["availability"]]

x = np.arange(len(scenarios))
width = 0.3

bars1 = ax.bar(x - width / 2, saga_avail, width, label="Layer 2: Saga", color=BLUE, edgecolor="white", linewidth=0.5)
bars2 = ax.bar(x + width / 2, outbox_avail, width, label="Layer 3: Saga + Outbox", color="#8E44AD", edgecolor="white", linewidth=0.5)

ax.set_ylabel("Availability (%)")
ax.set_title("Availability Under Partition: Saga vs Saga + Outbox", fontweight="bold", fontsize=13)
ax.set_xticks(x)
ax.set_xticklabels(scenarios)
ax.set_ylim(0, 115)
ax.legend(loc="upper right")

for bar, val in zip(bars1, saga_avail):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2, f"{val:.0f}%",
            ha="center", va="bottom", fontweight="bold", fontsize=11)
for bar, val in zip(bars2, outbox_avail):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 2, f"{val:.0f}%",
            ha="center", va="bottom", fontweight="bold", fontsize=11)

ax.axhline(y=100, color=GREEN, linestyle=":", alpha=0.5, label="_nolegend_")

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/availability_comparison.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved {OUTPUT_DIR}/availability_comparison.png")


# ── Figure 2: End-to-End Latency — Saga vs Outbox ─────────

fig, axes = plt.subplots(1, 2, figsize=(14, 5), sharey=True)

# Left: Baseline (both UP)
ax = axes[0]
labels = ["Saga\n(Layer 2)", "Saga + Outbox\n(Layer 3)"]
p50_vals = [saga_baseline["e2e_p50"], outbox_baseline["e2e_p50"]]
p99_vals = [saga_baseline["e2e_p99"], outbox_baseline["e2e_p99"]]
x = np.arange(len(labels))
width = 0.3
b1 = ax.bar(x - width/2, p50_vals, width, label="P50", color=BLUE, edgecolor="white")
b2 = ax.bar(x + width/2, p99_vals, width, label="P99", color=ORANGE, edgecolor="white")
for bar, val in zip(b1, p50_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}ms",
            ha="center", va="bottom", fontsize=10, fontweight="bold")
for bar, val in zip(b2, p99_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1, f"{val}ms",
            ha="center", va="bottom", fontsize=10, fontweight="bold")
ax.set_title("Baseline (both services UP)", fontweight="bold", fontsize=12)
ax.set_ylabel("End-to-End Latency (ms)")
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.legend()

# Right: Degraded (list-service DOWN)
ax = axes[1]
p50_vals = [saga_degraded["e2e_p50"], outbox_degraded["e2e_p50"]]
p99_vals = [saga_degraded["e2e_p99"], outbox_degraded["e2e_p99"]]
b1 = ax.bar(x - width/2, p50_vals, width, label="P50", color=BLUE, edgecolor="white")
b2 = ax.bar(x + width/2, p99_vals, width, label="P99", color=ORANGE, edgecolor="white")
for bar, val in zip(b1, p50_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 20, f"{val}ms",
            ha="center", va="bottom", fontsize=10, fontweight="bold")
for bar, val in zip(b2, p99_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 20, f"{val}ms",
            ha="center", va="bottom", fontsize=10, fontweight="bold")
ax.set_title("Degraded (list-service DOWN)", fontweight="bold", fontsize=12)
ax.set_xticks(x)
ax.set_xticklabels(labels)
ax.legend()

fig.suptitle("End-to-End Latency: DELETE → Lists Fully Cleaned", fontweight="bold", fontsize=14, y=1.02)
plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/latency_comparison.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved {OUTPUT_DIR}/latency_comparison.png")


# ── Figure 4: CAP Tradeoff Scatter ─────────────────────────

fig, ax = plt.subplots(figsize=(8, 6))

# Plot the three approaches on a Consistency vs Availability plane
approaches = {
    "2PC\n(theoretical)": {"avail": 50, "consist": 0, "color": RED, "marker": "s", "size": 200},
    "Saga\n(baseline)": {"avail": 100, "consist": 4, "color": BLUE, "marker": "o", "size": 200},
    "Saga\n(degraded)": {"avail": 100, "consist": None, "color": ORANGE, "marker": "D", "size": 200},
}

PURPLE = "#8E44AD"

# Use log scale so 5ms, 62ms, 1354ms, 2266ms are all clearly separated
ax.set_yscale("log")

# Saga baseline: 100% avail, 6ms
ax.scatter(95, 6, s=200, color=BLUE, marker="o", zorder=5, edgecolors="black", linewidth=0.5)
ax.annotate("Saga baseline\n(6ms)", (95, 6),
            textcoords="offset points", xytext=(-90, -30), fontsize=9,
            arrowprops=dict(arrowstyle="->", color=GRAY))

# Outbox baseline: 100% avail, 62ms
ax.scatter(105, 62, s=200, color=PURPLE, marker="^", zorder=5, edgecolors="black", linewidth=0.5)
ax.annotate("Outbox baseline\n(62ms — poller cost)", (105, 62),
            textcoords="offset points", xytext=(10, -35), fontsize=9,
            arrowprops=dict(arrowstyle="->", color=GRAY))

# Saga degraded: 100% avail, 2266ms
ax.scatter(95, 2266, s=200, color=BLUE, marker="o", zorder=5, edgecolors="black", linewidth=0.5, alpha=0.7)
ax.annotate("Saga degraded\n(2.3s)", (95, 2266),
            textcoords="offset points", xytext=(30, 15), fontsize=9,
            arrowprops=dict(arrowstyle="->", color=GRAY))

# Outbox degraded: 100% avail, 1354ms
ax.scatter(105, 1354, s=200, color=PURPLE, marker="^", zorder=5, edgecolors="black", linewidth=0.5, alpha=0.7)
ax.annotate("Outbox degraded\n(1.4s)", (105, 1354),
            textcoords="offset points", xytext=(10, 15), fontsize=9,
            arrowprops=dict(arrowstyle="->", color=GRAY))

ax.set_xlabel("Availability (%)", fontsize=12)
ax.set_ylabel("End-to-End Latency (ms) — log scale", fontsize=12)
ax.set_title("CAP Tradeoff: Saga vs Saga + Outbox", fontweight="bold", fontsize=13)
ax.set_xlim(80, 120)
ax.set_ylim(2, 5000)

legend_elements = [
    mpatches.Patch(facecolor=BLUE, label="Layer 2: Saga"),
    mpatches.Patch(facecolor=PURPLE, label="Layer 3: Saga + Outbox"),
]
ax.legend(handles=legend_elements, loc="upper left")

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/cap_tradeoff.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved {OUTPUT_DIR}/cap_tradeoff.png")


# ── Figure 5: Recovery Timeline ────────────────────────────

fig, ax = plt.subplots(figsize=(10, 4))

phases = [
    ("Phase A:\nBaseline", 0, 3, BLUE, "20/20 success\n6ms e2e latency"),
    ("Phase B:\nDegraded", 3.5, 3, ORANGE, "20/20 success\nEvents queued in RabbitMQ"),
    ("Phase C:\nRecovery", 7, 1.5, GREEN, "18ms drain\n2.3s e2e (incl. restart)"),
    ("Phase D:\nAudit", 9, 1.5, GRAY, "0 orphans\n40/40 clean"),
]

for label, start, width, color, annotation in phases:
    bar = ax.barh(0, width, left=start, height=0.5, color=color, edgecolor="white",
                  linewidth=1, alpha=0.85)
    ax.text(start + width / 2, 0, label, ha="center", va="center",
            fontweight="bold", fontsize=9, color="white")
    ax.text(start + width / 2, -0.45, annotation, ha="center", va="top", fontsize=8, color="#333")

# Stop/Start markers
ax.axvline(x=3.5, color=RED, linewidth=2, linestyle="--", alpha=0.7)
ax.text(3.5, 0.35, "STOP\nlist-service", ha="center", fontsize=8, color=RED, fontweight="bold")

ax.axvline(x=7, color=GREEN, linewidth=2, linestyle="--", alpha=0.7)
ax.text(7, 0.35, "START\nlist-service", ha="center", fontsize=8, color=GREEN, fontweight="bold")

ax.set_xlim(-0.5, 11)
ax.set_ylim(-1, 0.7)
ax.set_xlabel("Experiment Timeline", fontsize=11)
ax.set_title("Availability Experiment: Phase Timeline", fontweight="bold", fontsize=13)
ax.set_yticks([])
ax.spines["left"].set_visible(False)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

plt.tight_layout()
plt.savefig(f"{OUTPUT_DIR}/experiment_timeline.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"Saved {OUTPUT_DIR}/experiment_timeline.png")


print("\nAll plots saved to image/distributed-consistency-layers/")
