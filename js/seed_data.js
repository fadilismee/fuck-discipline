/**
 * SEED DATA FOR PRODUCTIV LIFE OS
 * High-performance offline data store initialization
 */

window.INITIAL_PRODUCTIV_DATA = {
  "user": {
    "name": "Fadil",
    "role": "Executive Terminal / Power User",
    "title": "Software Engineer & Architect",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "dateStr": "Friday, 25 September 2026",
    "cognitiveCapacity": 88
  },
  "tasks": [
    {
      "id": "t-1",
      "title": "Finish Productiv UI",
      "project": "Productiv",
      "priority": "high",
      "est": "2h est",
      "due": "Today 23:59",
      "status": "today",
      "completed": false,
      "timeSpent": "1h 24m",
      "tags": ["#Design", "#FE"],
      "notes": "Implement high-contrast zen interface and remove side navbar in favor of slick top bar.",
      "subtasks": [
        { "id": "st-1", "title": "Design slick top navigation bar", "done": true },
        { "id": "st-2", "title": "Wire reactive JSON store with localStorage persistence", "done": true },
        { "id": "st-3", "title": "Interactive task drawer and kanban toggle", "done": false }
      ]
    },
    {
      "id": "t-2",
      "title": "Study SQL & Indexing",
      "project": "Learning",
      "priority": "med",
      "est": "1h est",
      "due": "Today 21:00",
      "status": "today",
      "completed": false,
      "timeSpent": "0m",
      "tags": ["#Database", "#Backend"],
      "notes": "B-Tree indexing, query execution plans, and composite indexing best practices.",
      "subtasks": [
        { "id": "st-4", "title": "Read chapters on B-Tree vs LSM trees", "done": true },
        { "id": "st-5", "title": "Benchmark EXPLAIN ANALYZE on Postgres", "done": false }
      ]
    },
    {
      "id": "t-3",
      "title": "Upload portfolio assets",
      "project": "Portfolio",
      "priority": "low",
      "est": "30m",
      "due": "Today 14:20",
      "status": "completed",
      "completed": true,
      "timeSpent": "25m",
      "tags": ["#Portfolio"],
      "notes": "Uploaded latest UI mockups and demo previews to CDN.",
      "subtasks": []
    },
    {
      "id": "t-4",
      "title": "Exercise & Mobility routine",
      "project": "Health",
      "priority": "med",
      "est": "45m",
      "due": "Today 16:00",
      "status": "today",
      "completed": false,
      "timeSpent": "0m",
      "tags": ["#Fitness", "#Health"],
      "notes": "Upper body push workout + 15 min thoracic mobility stretching.",
      "subtasks": []
    },
    {
      "id": "t-5",
      "title": "Review personal ledger",
      "project": "Finance",
      "priority": "low",
      "est": "15m",
      "due": "Today 20:00",
      "status": "today",
      "completed": false,
      "timeSpent": "0m",
      "tags": ["#Finance"],
      "notes": "Weekly reconcile of personal expenses and cash flow analysis.",
      "subtasks": []
    },
    {
      "id": "t-6",
      "title": "Refactor API Gateway routes",
      "project": "Productiv",
      "priority": "high",
      "est": "3h est",
      "due": "Tomorrow 12:00",
      "status": "upcoming",
      "completed": false,
      "timeSpent": "0m",
      "tags": ["#Backend", "#Gateway"],
      "notes": "Implement token bucket rate limiting and zero-latency caching layer.",
      "subtasks": []
    },
    {
      "id": "t-7",
      "title": "Prepare quarterly tax report",
      "project": "Finance",
      "priority": "high",
      "est": "2h est",
      "due": "Yesterday",
      "status": "overdue",
      "completed": false,
      "timeSpent": "30m",
      "tags": ["#Finance", "#Tax"],
      "notes": "Compile invoices, digital receipts, and business expense deductions.",
      "subtasks": []
    },
    {
      "id": "t-8",
      "title": "Deep reading System Design",
      "project": "Learning",
      "priority": "low",
      "est": "1h est",
      "due": "Sunday 22:00",
      "status": "upcoming",
      "completed": false,
      "timeSpent": "0m",
      "tags": ["#Books"],
      "notes": "Read Designing Data-Intensive Applications chapters 7 & 8.",
      "subtasks": []
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Productiv",
      "tagline": "Personal OS v2.4",
      "description": "High-agency executive dashboard and digital craftsmanship operating system for power users.",
      "category": "Software",
      "status": "active",
      "progress": 72,
      "color": "emerald",
      "lead": "Fadil",
      "milestones": [
        { "id": "m-1", "name": "Alpha Prototype Wireframes", "done": true, "due": "Sep 15" },
        { "id": "m-2", "name": "Top Navigation & JSON Store", "done": true, "due": "Sep 25" },
        { "id": "m-3", "name": "Live Interactive Release", "done": false, "due": "Sep 30" }
      ]
    },
    {
      "id": "proj-2",
      "name": "Learning Hub",
      "tagline": "Engineering & CS Deep Dive",
      "description": "Structured curriculum covering database engines, distributed consensus, and microkernel architecture.",
      "category": "Education",
      "status": "active",
      "progress": 45,
      "color": "sky",
      "lead": "Fadil",
      "milestones": [
        { "id": "m-4", "name": "SQL & Query Optimization", "done": true, "due": "Sep 20" },
        { "id": "m-5", "name": "Distributed Raft Consensus", "done": false, "due": "Oct 10" }
      ]
    },
    {
      "id": "proj-3",
      "name": "Physical Resilience",
      "tagline": "Health & Bio-Optimization",
      "description": "Strength training protocol, circadian alignment, clean nutrition, and daily mobility work.",
      "category": "Health",
      "status": "active",
      "progress": 85,
      "color": "emerald",
      "lead": "Fadil",
      "milestones": [
        { "id": "m-6", "name": "Maintain 30-day streak of Morning prayers & workout", "done": true, "due": "Sep 28" },
        { "id": "m-7", "name": "Complete 100km total monthly running", "done": false, "due": "Sep 30" }
      ]
    },
    {
      "id": "proj-4",
      "name": "Capital & Assets",
      "tagline": "Finance & Investment Protocol",
      "description": "Ledger tracking, high-yield cash preservation, expense discipline, and portfolio allocation.",
      "category": "Finance",
      "status": "active",
      "progress": 60,
      "color": "violet",
      "lead": "Fadil",
      "milestones": [
        { "id": "m-8", "name": "Emergency Fund 6 Months Buffer", "done": true, "due": "Sep 01" },
        { "id": "m-9", "name": "Q3 Ledger Audit & Optimization", "done": false, "due": "Sep 30" }
      ]
    }
  ],
  "calendar": [
    {
      "id": "ev-1",
      "title": "UT Lecture & Quiz",
      "category": "Academics",
      "location": "Online / Zoom",
      "startTime": "09:00",
      "endTime": "10:30",
      "date": "2026-09-25",
      "done": true,
      "color": "slate"
    },
    {
      "id": "ev-2",
      "title": "Productiv UI Design Sprint",
      "category": "Engineering",
      "location": "Local Workstation",
      "startTime": "11:00",
      "endTime": "13:00",
      "date": "2026-09-25",
      "done": true,
      "color": "emerald"
    },
    {
      "id": "ev-3",
      "title": "Lunch & Nutritional Reset",
      "category": "Break",
      "location": "Dining",
      "startTime": "13:00",
      "endTime": "14:00",
      "date": "2026-09-25",
      "done": true,
      "color": "slate"
    },
    {
      "id": "ev-4",
      "title": "Exercise & Mobility Workout",
      "category": "Health",
      "location": "Gym / Park",
      "startTime": "16:00",
      "endTime": "17:00",
      "date": "2026-09-25",
      "done": false,
      "color": "emerald"
    },
    {
      "id": "ev-5",
      "title": "Study SQL & Database Indexing",
      "category": "Learning",
      "location": "Desk",
      "startTime": "19:00",
      "endTime": "20:30",
      "date": "2026-09-25",
      "done": false,
      "color": "sky"
    },
    {
      "id": "ev-6",
      "title": "Weekly Audit & Retrospective",
      "category": "Review",
      "location": "Obsidian Terminal",
      "startTime": "21:00",
      "endTime": "22:00",
      "date": "2026-09-25",
      "done": false,
      "color": "violet"
    }
  ],
  "focus": {
    "currentMode": "pomodoro",
    "presetMinutes": 25,
    "breakMinutes": 5,
    "longBreakMinutes": 15,
    "sessionsCompletedToday": 4,
    "totalSecondsToday": 12240,
    "targetTaskId": "t-1",
    "targetTaskTitle": "Finish Productiv UI",
    "targetProject": "Productiv",
    "ambientSound": "alpha_10hz",
    "ambientPlaying": false,
    "volume": 60,
    "history": [
      { "id": "foc-1", "task": "Productiv UI Components", "duration": 25, "time": "11:00", "date": "2026-09-25" },
      { "id": "foc-2", "task": "Top Nav Architecture", "duration": 25, "time": "11:35", "date": "2026-09-25" },
      { "id": "foc-3", "task": "JSON Store Hookup", "duration": 25, "time": "12:10", "date": "2026-09-25" },
      { "id": "foc-4", "task": "Task Drawer Refinement", "duration": 25, "time": "14:30", "date": "2026-09-25" }
    ]
  },
  "routines": [
    {
      "id": "r-1",
      "title": "Wake up at 05:30 (Fajr)",
      "block": "morning",
      "time": "05:30",
      "streak": 42,
      "doneToday": true,
      "tag": "Prime Discipline",
      "desc": "Alarm sync · Circadian start"
    },
    {
      "id": "r-2",
      "title": "Daily Prayers (Fajr-Asr)",
      "block": "morning",
      "time": "06:00",
      "streak": 60,
      "doneToday": true,
      "tag": "Spiritual",
      "desc": "Fajr, Dhuhr, Asr on time"
    },
    {
      "id": "r-3",
      "title": "Qur'an Recitation (1 Juz)",
      "block": "morning",
      "time": "06:30",
      "streak": 28,
      "doneToday": true,
      "tag": "Daily Reading",
      "desc": "Consistent morning reflection"
    },
    {
      "id": "r-4",
      "title": "Workout & Stretch",
      "block": "afternoon",
      "time": "16:00",
      "streak": 14,
      "doneToday": false,
      "tag": "Physical",
      "desc": "Upper Body Push & Thoracic Mobility"
    },
    {
      "id": "r-5",
      "title": "English Speaking Practice",
      "block": "evening",
      "time": "18:30",
      "streak": 9,
      "doneToday": false,
      "tag": "Skill Flow",
      "desc": "20m active conversational flow"
    },
    {
      "id": "r-6",
      "title": "Deep Reading (Non-screen)",
      "block": "evening",
      "time": "22:00",
      "streak": 19,
      "doneToday": false,
      "tag": "Winddown",
      "desc": "Bedtime physical book reading"
    }
  ],
  "finance": {
    "liquidBalance": 2450000,
    "dailyTarget": 100000,
    "monthlyBudget": 3500000,
    "monthlySpent": 1850000,
    "currency": "Rp",
    "transactions": [
      {
        "id": "f-1",
        "title": "Warung Makan (Lunch)",
        "category": "Food",
        "amount": 25000,
        "type": "expense",
        "date": "2026-09-25",
        "time": "13:15",
        "icon": "lunch_dining",
        "notes": "Nutritional midday meal"
      },
      {
        "id": "f-2",
        "title": "Americano Kopi",
        "category": "Coffee",
        "amount": 22000,
        "type": "expense",
        "date": "2026-09-25",
        "time": "08:30",
        "icon": "local_cafe",
        "notes": "Daily focus fuel"
      },
      {
        "id": "f-3",
        "title": "Client Milestone Payout",
        "category": "Income",
        "amount": 1500000,
        "type": "income",
        "date": "2026-09-24",
        "time": "15:00",
        "icon": "payments",
        "notes": "Frontend architecture deliverable"
      },
      {
        "id": "f-4",
        "title": "Fiber Internet Subscription",
        "category": "Utilities",
        "amount": 350000,
        "type": "expense",
        "date": "2026-09-22",
        "time": "10:00",
        "icon": "wifi",
        "notes": "Monthly gigabit connection"
      },
      {
        "id": "f-5",
        "title": "System Design Reference Book",
        "category": "Education",
        "amount": 120000,
        "type": "expense",
        "date": "2026-09-20",
        "time": "14:20",
        "icon": "menu_book",
        "notes": "Hardcover learning edition"
      }
    ]
  },
  "review": {
    "currentDate": "2026-09-25",
    "throughputPercent": 88.4,
    "history": [
      {
        "id": "rev-1",
        "date": "2026-09-25",
        "period": "daily",
        "win": "Finished high-speed top navigation and unified JSON store architecture.",
        "friction": "Midday context switching between design and research.",
        "decision": "Group deep tasks into unified 90-minute blocks without notifications.",
        "productivityRating": 9,
        "energyLevel": "High",
        "cognitiveScore": 88
      },
      {
        "id": "rev-2",
        "date": "2026-09-24",
        "period": "daily",
        "win": "Completed freelance milestone ahead of schedule.",
        "friction": "Slightly delayed morning workout.",
        "decision": "Prep gym clothes the night before.",
        "productivityRating": 8,
        "energyLevel": "Medium-High",
        "cognitiveScore": 84
      }
    ]
  },
  "mirrorAi": {
    "cognitiveLoad": 78.4,
    "frictionIndex": "+18.2%",
    "systemConfidence": "94.2%",
    "recommendations": [
      "Focus on completing 'Finish Productiv UI' before 16:00 to preserve evening cognitive capacity.",
      "Morning routines are at 100% cadence today. Excellent behavioral momentum.",
      "Daily expenditure is currently at Rp 47.000 (47% of Rp 100.000 limit) — Safe status."
    ],
    "chatHistory": [
      {
        "id": "m-msg-1",
        "sender": "ai",
        "time": "14:30",
        "text": "Executive Terminal online. Cognitive capacity steady at 88%. You have 3 tasks remaining for today. Would you like me to optimize your evening timeboxing or review pending tasks?"
      }
    ]
  },
  "settings": {
    "userName": "Fadil",
    "email": "fadil@productiv.local",
    "theme": "obsidian-dark",
    "soundEffects": true,
    "pomodoroDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "dailySpendLimit": 100000,
    "telemetryEnabled": true,
    "notificationsEnabled": true,
    "autoSyncLocalStorage": true
  }
};
