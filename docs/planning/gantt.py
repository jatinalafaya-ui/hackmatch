"""Draws docs/planning/gantt.png: planned vs. actual schedule."""
from datetime import date, timedelta
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.dates as mdates
import matplotlib.pyplot as plt

BRAND = "#1E3A8A"
PLAN = "#B9C6EA"
ACCENT = "#F59E0B"

# (task, planned start, planned end, actual start, actual end)
TASKS = [
    ("Idea selection and feasibility (A2)", date(2026, 10, 19), date(2026, 10, 25), date(2026, 10, 19), date(2026, 10, 25)),
    ("Team coordination", date(2026, 10, 22), date(2026, 10, 27), date(2026, 10, 22), date(2026, 11, 14)),
    ("Requirements, use cases, ERD", date(2026, 10, 26), date(2026, 11, 1), date(2026, 11, 15), date(2026, 11, 15)),
    ("API: auth, email verification, reset", date(2026, 10, 29), date(2026, 11, 5), date(2026, 11, 15), date(2026, 11, 15)),
    ("API: search and shortlist", date(2026, 11, 2), date(2026, 11, 8), date(2026, 11, 15), date(2026, 11, 15)),
    ("React web client", date(2026, 11, 5), date(2026, 11, 11), date(2026, 11, 15), date(2026, 11, 15)),
    ("Flutter mobile app", date(2026, 11, 8), date(2026, 11, 13), date(2026, 11, 15), date(2026, 11, 15)),
    ("Tests, CI, diagrams, slides", date(2026, 11, 11), date(2026, 11, 15), date(2026, 11, 15), date(2026, 11, 15)),
    ("Deploy, SwaggerHub, rehearse", date(2026, 11, 13), date(2026, 11, 15), date(2026, 11, 15), date(2026, 11, 17)),
]

fig, ax = plt.subplots(figsize=(13, 5.6), dpi=150)
one_day = timedelta(days=1)
for row, (name, ps, pe, as_, ae) in enumerate(TASKS):
    y = len(TASKS) - 1 - row
    ax.barh(y + 0.18, (pe - ps + one_day).days, left=mdates.date2num(ps), height=0.32, color=PLAN, edgecolor=BRAND, linewidth=0.6)
    ax.barh(y - 0.18, (ae - as_ + one_day).days, left=mdates.date2num(as_), height=0.32, color=BRAND)

ax.set_yticks(range(len(TASKS)))
ax.set_yticklabels([t[0] for t in reversed(TASKS)], fontsize=10)
ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO))
ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
ax.set_xlim(mdates.date2num(date(2026, 10, 18)), mdates.date2num(date(2026, 11, 19)))
ax.axvline(mdates.date2num(date(2026, 11, 15)) + 1, color=ACCENT, linewidth=2)
ax.text(mdates.date2num(date(2026, 11, 15)) + 1.1, len(TASKS) - 0.5, "Due Nov 15", color="#92400E", fontsize=9, va="top")
ax.grid(axis="x", color="#E5E7EB")
ax.set_axisbelow(True)
for side in ("top", "right"):
    ax.spines[side].set_visible(False)
ax.legend(
    handles=[
        plt.Rectangle((0, 0), 1, 1, color=PLAN, ec=BRAND, lw=0.6, label="Planned (team schedule)"),
        plt.Rectangle((0, 0), 1, 1, color=BRAND, label="Actual (individual)"),
    ],
    loc="lower left",
    frameon=False,
    fontsize=9,
)
ax.set_title("HackMatch schedule: planned vs. actual", fontsize=13, fontweight="bold", loc="left", color="#111827")
fig.tight_layout()
fig.savefig(Path(__file__).with_name("gantt.png"))
