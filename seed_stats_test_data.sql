-- ================================================================
-- LOCKED IN — STATS PAGE TEST DATA
-- ================================================================
-- What this gives you:
--   • 5,000 gold balance
--   • Annual premium access
--   • 14-day session history with two rest days (realistic streak)
--   • 7-day current streak, 14 longest streak
--   • ~216 total pomodoros, ~90 total hours
--   • Weekly chart: data on all 7 days
--   • Streak dot calendar: 12 of 14 days active
--   • 7 achievements
--   • Focus profile → score 70 "Sharp", full workflow tips
--   • 5 sample revision topics in the planner
--
-- HOW TO USE:
--   1. Find your user_id:  SELECT user_id, email FROM `user`;
--   2. Set @uid below to your user_id
--   3. Run the whole script in MySQL Workbench (Ctrl+Shift+Enter)
--   4. Hard-refresh the stats page
-- ================================================================

SET @uid = 3;  -- ← CHANGE THIS TO YOUR user_id


-- ─────────────────────────────────────────────────────────────────
-- CLEANUP  (safe to re-run — removes previous test data only)
-- ─────────────────────────────────────────────────────────────────
DELETE FROM pomodoro_sessions
  WHERE user_id = @uid
    AND start_time >= DATE_SUB(CURDATE(), INTERVAL 130 DAY);

DELETE FROM gold_transactions
  WHERE user_id = @uid
    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 130 DAY);

DELETE FROM achievements  WHERE user_id = @uid;
DELETE FROM revisiontopic WHERE user_id = @uid;


-- ─────────────────────────────────────────────────────────────────
-- 1. GOLD BALANCE
-- ─────────────────────────────────────────────────────────────────
UPDATE `user` SET gold = 5000 WHERE user_id = @uid;


-- ─────────────────────────────────────────────────────────────────
-- 2. PREMIUM  (annual plan, active — writes to user_subscriptions only)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO user_subscriptions (user_id, plan, status, current_period_end)
VALUES (@uid, 'annual', 'active', DATE_ADD(CURDATE(), INTERVAL 1 YEAR))
ON DUPLICATE KEY UPDATE
  plan               = 'annual',
  status             = 'active',
  current_period_end = DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
  updated_at         = NOW();

-- ─────────────────────────────────────────────────────────────────
-- 3. STREAK & AGGREGATE STATS
--    current_streak = 7  (days 0–6 all have sessions)
--    longest_streak = 14 (historical best)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO userstats (
  user_id, hours_spent_revising_per_d, days_revised_in_a_row,
  total_hours_revised, current_streak, longest_streak,
  last_pomodoro_date, heart_points, last_heart_refill_date
) VALUES (
  @uid, 2.1, 7, 82.0, 7, 14, CURDATE(), 2, CURDATE()
) ON DUPLICATE KEY UPDATE
  current_streak               = 7,
  longest_streak               = GREATEST(longest_streak, 14),
  last_pomodoro_date           = CURDATE(),
  hours_spent_revising_per_d   = 2.1,
  days_revised_in_a_row        = 7,
  total_hours_revised          = 82.0,
  heart_points                 = 2,
  last_heart_refill_date       = CURDATE();


-- ─────────────────────────────────────────────────────────────────
-- 4. POMODORO SESSIONS
--
--   4a. Bulk historical rows (~4 months back → ~3 weeks back)
--       Builds total hours (~74h) and total pomodoro count (~178)
--
--   4b. Last 14 days — individual sessions per day
--       Day 7 and Day 12 are intentional rest days:
--         → current_streak = 7  (days 0–6 all active)
--         → streak calendar: 12 of 14 dots lit
-- ─────────────────────────────────────────────────────────────────

-- 4a. Historical bulk sessions
INSERT INTO pomodoro_sessions
  (user_id, start_time, end_time, duration_minutes, pomodoros_completed, pause_count)
VALUES
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 120 DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 120 DAY) + INTERVAL 9  HOUR + INTERVAL 600 MINUTE, 600, 24, 3),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 100 DAY) + INTERVAL 10 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 100 DAY) + INTERVAL 10 HOUR + INTERVAL 750 MINUTE, 750, 30, 4),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 80  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 80  DAY) + INTERVAL 9  HOUR + INTERVAL 625 MINUTE, 625, 25, 2),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 60  DAY) + INTERVAL 14 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 60  DAY) + INTERVAL 14 HOUR + INTERVAL 875 MINUTE, 875, 35, 5),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 45  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 45  DAY) + INTERVAL 9  HOUR + INTERVAL 500 MINUTE, 500, 20, 2),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 30  DAY) + INTERVAL 10 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 30  DAY) + INTERVAL 10 HOUR + INTERVAL 625 MINUTE, 625, 25, 3),
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 20  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 20  DAY) + INTERVAL 9  HOUR + INTERVAL 475 MINUTE, 475, 19, 2);

-- 4b. Last 14 days — day by day
INSERT INTO pomodoro_sessions
  (user_id, start_time, end_time, duration_minutes, pomodoros_completed, pause_count)
VALUES
  -- Day 0  today              4 pomodoros
  (@uid,
   CURDATE() + INTERVAL 9 HOUR,
   CURDATE() + INTERVAL 9 HOUR + INTERVAL 100 MINUTE, 100, 4, 0),

  -- Day 1  yesterday          3 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 1  DAY) + INTERVAL 10 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 1  DAY) + INTERVAL 10 HOUR + INTERVAL 75  MINUTE, 75,  3, 0),

  -- Day 2                     5 pomodoros  ← best day this week
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 2  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 2  DAY) + INTERVAL 9  HOUR + INTERVAL 125 MINUTE, 125, 5, 1),

  -- Day 3                     2 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 3  DAY) + INTERVAL 14 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 3  DAY) + INTERVAL 14 HOUR + INTERVAL 50  MINUTE, 50,  2, 0),

  -- Day 4                     4 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 4  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 4  DAY) + INTERVAL 9  HOUR + INTERVAL 100 MINUTE, 100, 4, 0),

  -- Day 5                     3 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 5  DAY) + INTERVAL 19 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 5  DAY) + INTERVAL 19 HOUR + INTERVAL 75  MINUTE, 75,  3, 0),

  -- Day 6                     2 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 6  DAY) + INTERVAL 10 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 6  DAY) + INTERVAL 10 HOUR + INTERVAL 50  MINUTE, 50,  2, 0),

  -- Day 7  ← REST DAY (no row — this is where the current streak stops)

  -- Day 8                     3 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 8  DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 8  DAY) + INTERVAL 9  HOUR + INTERVAL 75  MINUTE, 75,  3, 1),

  -- Day 9                     2 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 9  DAY) + INTERVAL 14 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 9  DAY) + INTERVAL 14 HOUR + INTERVAL 50  MINUTE, 50,  2, 0),

  -- Day 10                    4 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 10 DAY) + INTERVAL 9  HOUR,
   DATE_SUB(CURDATE(), INTERVAL 10 DAY) + INTERVAL 9  HOUR + INTERVAL 100 MINUTE, 100, 4, 0),

  -- Day 11                    3 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 11 DAY) + INTERVAL 10 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 11 DAY) + INTERVAL 10 HOUR + INTERVAL 75  MINUTE, 75,  3, 0),

  -- Day 12 ← REST DAY (second gap)

  -- Day 13                    3 pomodoros
  (@uid,
   DATE_SUB(CURDATE(), INTERVAL 13 DAY) + INTERVAL 19 HOUR,
   DATE_SUB(CURDATE(), INTERVAL 13 DAY) + INTERVAL 19 HOUR + INTERVAL 75  MINUTE, 75,  3, 0);


-- ─────────────────────────────────────────────────────────────────
-- 5. GOLD TRANSACTIONS
--    The weekly chart reads gold_transactions WHERE type='EARN'
--    AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
--    grouped by day of week — one row per day is enough.
--    Amount = pomodoros completed × 25 gold.
-- ─────────────────────────────────────────────────────────────────

-- Last 7 days (drives the weekly gold chart bars)
INSERT INTO gold_transactions (user_id, amount, transaction_date, transaction_type, description)
VALUES
  (@uid,  50, DATE_SUB(CURDATE(), INTERVAL 6 DAY) + INTERVAL 10 HOUR + INTERVAL 50  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  75, DATE_SUB(CURDATE(), INTERVAL 5 DAY) + INTERVAL 19 HOUR + INTERVAL 75  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid, 100, DATE_SUB(CURDATE(), INTERVAL 4 DAY) + INTERVAL 9  HOUR + INTERVAL 100 MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  50, DATE_SUB(CURDATE(), INTERVAL 3 DAY) + INTERVAL 14 HOUR + INTERVAL 50  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid, 125, DATE_SUB(CURDATE(), INTERVAL 2 DAY) + INTERVAL 9  HOUR + INTERVAL 125 MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  75, DATE_SUB(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 75  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid, 100, CURDATE()                           + INTERVAL 9  HOUR + INTERVAL 100 MINUTE, 'EARN', 'Pomodoro reward');

-- Days 8–13 (outside chart window, adds history)
INSERT INTO gold_transactions (user_id, amount, transaction_date, transaction_type, description)
VALUES
  (@uid,  75, DATE_SUB(CURDATE(), INTERVAL 8  DAY) + INTERVAL 9  HOUR + INTERVAL 75  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  50, DATE_SUB(CURDATE(), INTERVAL 9  DAY) + INTERVAL 14 HOUR + INTERVAL 50  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid, 100, DATE_SUB(CURDATE(), INTERVAL 10 DAY) + INTERVAL 9  HOUR + INTERVAL 100 MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  75, DATE_SUB(CURDATE(), INTERVAL 11 DAY) + INTERVAL 10 HOUR + INTERVAL 75  MINUTE, 'EARN', 'Pomodoro reward'),
  (@uid,  75, DATE_SUB(CURDATE(), INTERVAL 13 DAY) + INTERVAL 19 HOUR + INTERVAL 75  MINUTE, 'EARN', 'Pomodoro reward');

-- Historical bulk (mirrors the bulk pomodoro sessions)
INSERT INTO gold_transactions (user_id, amount, transaction_date, transaction_type, description)
VALUES
  (@uid, 600, DATE_SUB(CURDATE(), INTERVAL 120 DAY) + INTERVAL 19 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 750, DATE_SUB(CURDATE(), INTERVAL 100 DAY) + INTERVAL 22 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 625, DATE_SUB(CURDATE(), INTERVAL 80  DAY) + INTERVAL 19 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 875, DATE_SUB(CURDATE(), INTERVAL 60  DAY) + INTERVAL 28 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 500, DATE_SUB(CURDATE(), INTERVAL 45  DAY) + INTERVAL 17 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 625, DATE_SUB(CURDATE(), INTERVAL 30  DAY) + INTERVAL 20 HOUR, 'EARN', 'Pomodoro reward'),
  (@uid, 475, DATE_SUB(CURDATE(), INTERVAL 20  DAY) + INTERVAL 17 HOUR, 'EARN', 'Pomodoro reward');


-- ─────────────────────────────────────────────────────────────────
-- 6. ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────────
INSERT INTO achievements (user_id, name, description, achieved_date, achievement_type)
VALUES
  (@uid, 'First Steps',     'Completed your first focus session',        DATE_SUB(CURDATE(), INTERVAL 120 DAY), 'SESSION'),
  (@uid, 'On Fire',         'Maintained a 3-day study streak',           DATE_SUB(CURDATE(), INTERVAL 100 DAY), 'STREAK'),
  (@uid, 'Gold Rush',       'Earned 1,000 gold',                         DATE_SUB(CURDATE(), INTERVAL 80  DAY), 'GOLD'),
  (@uid, 'Week Warrior',    'Maintained a 7-day study streak',           DATE_SUB(CURDATE(), INTERVAL 60  DAY), 'STREAK'),
  (@uid, 'Centurion',       'Completed 100 total focus sessions',        DATE_SUB(CURDATE(), INTERVAL 30  DAY), 'SESSION'),
  (@uid, 'Fortnight Focus', 'Maintained a 14-day study streak',         DATE_SUB(CURDATE(), INTERVAL 14  DAY), 'STREAK'),
  (@uid, 'High Roller',     'Earned 5,000 gold — elite focus achieved', CURDATE(),                              'GOLD');


-- ─────────────────────────────────────────────────────────────────
-- 7. FOCUS PROFILE QUESTIONNAIRE
--
--    These are the exact strings UserProfileService.java switches on.
--    Score breakdown:
--      focusScore(rarely)    = 16
--      focusScore(sometimes) = 12  (×2 fields)
--      sleepScore(7_to_8)    = 20
--      stressScore(moderate) = 10
--      ─────────────────────────
--      TOTAL                 = 70  →  "Sharp"
--
--    Other computed values:
--      bestStudyWindow     = "Morning (9AM – 12PM)"
--      recommendedSession  = "50 min"
--      weeklyGoal          = 18 sessions
--      challengeAdvice     = 2-minute rule tip
--      procrastinationTip  = temptation bundling
--      workflowTips        = 3 personalised tips
-- ─────────────────────────────────────────────────────────────────
INSERT INTO user_profile (
  user_id,
  focus_completion_difficulty,
  sustained_attention_difficulty,
  distraction_frequency,
  sleep_hours,
  stress_level,
  chronotype,
  daily_focus_time,
  primary_focus_challenge,
  work_environment,
  task_breakdown_ease,
  procrastination_tendency,
  primary_motivation,
  status,
  completed_at,
  is_premium_at_completion,
  raw_json
) VALUES (
  @uid,
  'rarely',
  'sometimes',
  'sometimes',
  '7_to_8',
  'moderate',
  'morning',
  '2_to_4h',
  'starting',
  'home_alone',
  'neutral',
  'sometimes',
  'focus_habits',
  'completed',
  NOW(),
  TRUE,
  '{"focusCompletionDifficulty":"rarely","sustainedAttentionDifficulty":"sometimes","distractionFrequency":"sometimes","sleepHours":"7_to_8","stressLevel":"moderate","chronotype":"morning","dailyFocusTime":"2_to_4h","primaryFocusChallenge":"starting","workEnvironment":"home_alone","taskBreakdownEase":"neutral","procrastinationTendency":"sometimes","primaryMotivation":"focus_habits"}'
) ON DUPLICATE KEY UPDATE
  focus_completion_difficulty    = 'rarely',
  sustained_attention_difficulty = 'sometimes',
  distraction_frequency          = 'sometimes',
  sleep_hours                    = '7_to_8',
  stress_level                   = 'moderate',
  chronotype                     = 'morning',
  daily_focus_time               = '2_to_4h',
  primary_focus_challenge        = 'starting',
  work_environment               = 'home_alone',
  task_breakdown_ease            = 'neutral',
  procrastination_tendency       = 'sometimes',
  primary_motivation             = 'focus_habits',
  status                         = 'completed',
  completed_at                   = NOW(),
  is_premium_at_completion       = TRUE,
  raw_json                       = '{"focusCompletionDifficulty":"rarely","sustainedAttentionDifficulty":"sometimes","distractionFrequency":"sometimes","sleepHours":"7_to_8","stressLevel":"moderate","chronotype":"morning","dailyFocusTime":"2_to_4h","primaryFocusChallenge":"starting","workEnvironment":"home_alone","taskBreakdownEase":"neutral","procrastinationTendency":"sometimes","primaryMotivation":"focus_habits"}';


-- ─────────────────────────────────────────────────────────────────
-- 8. SAMPLE REVISION TOPICS  (shows up in the planner)
-- ─────────────────────────────────────────────────────────────────
INSERT INTO revisiontopic (user_id, title, description, pomodoro_number)
VALUES
  (@uid, 'Data Structures',   'Arrays, linked lists, trees, graphs, hash maps',   4),
  (@uid, 'System Design',     'Scalability, load balancers, caching, databases',   6),
  (@uid, 'Algorithms',        'Sorting, dynamic programming, greedy algorithms',   5),
  (@uid, 'Machine Learning',  'Supervised learning, neural nets, backpropagation', 8),
  (@uid, 'Operating Systems', 'Processes, threads, memory management, scheduling', 3);


-- ─────────────────────────────────────────────────────────────────
-- VERIFY  (run this block after — should match expected values)
-- ─────────────────────────────────────────────────────────────────
SELECT 'gold'            AS stat, CAST(gold AS CHAR)                                 AS value FROM `user`           WHERE user_id = @uid
UNION ALL
SELECT 'total_pomodoros',         CAST(SUM(pomodoros_completed) AS CHAR)             FROM pomodoro_sessions        WHERE user_id = @uid
UNION ALL
SELECT 'total_hours',             CAST(ROUND(SUM(duration_minutes) / 60.0, 1) AS CHAR) FROM pomodoro_sessions      WHERE user_id = @uid
UNION ALL
SELECT 'current_streak',          CAST(current_streak AS CHAR)                       FROM userstats                WHERE user_id = @uid
UNION ALL
SELECT 'longest_streak',          CAST(longest_streak AS CHAR)                       FROM userstats                WHERE user_id = @uid
UNION ALL
SELECT 'achievements',            CAST(COUNT(*) AS CHAR)                             FROM achievements             WHERE user_id = @uid
UNION ALL
SELECT 'premium_plan',            plan                                                FROM user_subscriptions       WHERE user_id = @uid
UNION ALL
SELECT 'premium_status',          status                                              FROM user_subscriptions       WHERE user_id = @uid
UNION ALL
SELECT 'profile_status',          status                                              FROM user_profile             WHERE user_id = @uid;

-- Expected results:
--   gold             → 5000
--   total_pomodoros  → 216
--   total_hours      → 90.0
--   current_streak   → 7
--   longest_streak   → 14
--   achievements     → 7
--   premium_plan     → annual
--   premium_status   → active
--   profile_status   → completed
