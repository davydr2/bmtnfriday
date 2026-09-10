# Weekly Report Reward System

## Purpose

A lightweight internal incentive system to encourage employees to complete their required weekly report by the Friday deadline.

The goal is **a small nudge**, not a heavy-handed productivity system. It should make the weekly report more visible and a little more fun without trying to force everyone to submit early.

---

## Core Concept

Every four weeks, employees participate in a small cash-prize drawing.

The system:

1. Tracks who is required to submit a report for the cycle.
2. Tracks the order in which employees submit.
3. Assigns each submission a sequential number:
   - First submission = #1
   - Second submission = #2
   - ...
   - 40th submission = #40
4. A winning number is secretly predetermined for the four-week cycle.
5. The employee whose submission receives that number is the winner.
6. The winning number is **never revealed to employees ahead of time**.
7. The prize pool is based on participation/completion.
8. Additional tokens can be earned through special weekly activities.

The important property is that **submission order determines the number, but employees do not know which number will win**.

---

# Four-Week Cycle

The program runs in four-week cycles rather than calendar months.

This produces approximately **13 winners per year**.

At the beginning of each four-week cycle:

- Establish the eligible employee roster.
- Count the number of eligible employees.
- Secretly determine the winning submission number.
- Lock both the roster and winning number for that cycle.

Example:

> 40 employees are eligible.

The system secretly selects:

> Winning number = 12

Employees do not see that number.

During the cycle:

- Jody submits 12th.
- Jody is assigned submission number 12.
- The remaining employees submit afterward.

At the end of the cycle:

> Jody wins.

The system does not need to perform a random drawing at the end because the winning position was already determined.

---

# Employee Roster / Eligibility

Eligibility is based on the official roster for the four-week cycle.

For example:

> 42 employees are on the roster.

Those 42 people are the eligible population for that cycle.

The system does not need to make HR eligibility decisions. The roster establishes who is participating.

The roster should be locked for the cycle so that the number of eligible employees cannot be changed retroactively.

---

# Submission Numbering

Submission numbers are assigned strictly according to submission order.

Example with 40 employees:

| Submission | Employee | Number |
|---|---|---:|
| 1st | Employee A | 1 |
| 2nd | Employee B | 2 |
| 3rd | Employee C | 3 |
| ... | ... | ... |
| 12th | Jody | 12 |
| ... | ... | ... |
| 40th | Employee Z | 40 |

If the secret winning number is 12, Jody wins.

## Important

There is **no advantage to knowing or predicting the winning number** because it is secret.

There is also no reason to deliberately wait for a particular position because employees do not know which position wins.

This keeps the system simple and avoids creating a race to a particular submission number.

---

# Prize Pool

The base weekly prize contribution is:

> **$25 per week**

A four-week cycle therefore has a maximum base prize pool of:

> **$100**

The weekly amount scales according to participation.

## Participation Formula

If:

- 40 employees are eligible
- 30 employees submit

Then participation is:

> 30 / 40 = 75%

The $25 weekly contribution becomes:

> $25 × 75% = $18.75

That amount goes into the cycle's prize pool.

---

# Minimum Participation Threshold

There is no prize contribution when participation is below 50%.

Therefore:

- Less than 50% participation = **$0**
- 50% or greater = prize contribution begins scaling upward

Conceptually:

> Weekly Prize Contribution = $25 × participation percentage

with a floor of zero below the 50% threshold.

This means poor participation can reduce the eventual prize, while strong participation increases it.

---

# 100% Participation Bonus

The weekly $25 base can increase when everyone submits early.

Proposed bonus levels:

| Completion | Deadline | Weekly Pool |
|---|---|---:|
| Normal | By 9:00 PM Friday | $25 |
| Early | 100% by 8:00 PM Friday | $30 |
| Very Early | 100% by 7:00 PM Friday | $35 |

The purpose is not to force employees to finish early. It simply creates an opportunity for the group to increase the prize.

The system should remain a **small nudge**, not a pressure mechanism.

---

# Friday Portal

The employee-facing portal opens Friday morning, approximately:

> **9:00 AM Friday**

The portal displays useful progress information such as:

- Number of eligible employees
- Number of reports submitted
- Current participation percentage
- Current weekly prize contribution
- Current accumulated prize pool
- Remaining time until the deadline
- Status of the special Friday activity

Example:

> **Friday Report Challenge**
>
> 27 of 40 reports submitted  
> Participation: 67.5%  
> Current weekly pool: $16.88  
> Deadline: 9:00 PM

The portal does **not** reveal the secret winning number.

---

# The Friday "Nag"

There is one special "nag" opportunity each week.

The nag becomes available at a random time between:

> **3:00 PM and 3:30 PM Friday**

Employees do not need to sit on the portal all afternoon. The portal simply makes the nag available when it appears.

The purpose is to create a small, fun interruption and encourage people to interact with the system.

---

# Double-Nag Mechanic

The nag is intentionally a two-step process.

## Step 1 — Nag Goes Live

The portal displays something like:

> **NAG IS LIVE**
>
> Claim the nag.

The employee claims it.

## Step 2 — Portal Gives the Message

After claiming the nag, the portal gives that employee a funny, workplace-appropriate message to post in the designated Slack channel.

For example:

> "Your mom told you to do your report."

The employee posts the exact message to Slack.

The message contains a special verification code.

Example:

> `CCC 444`

The system monitors the designated Slack channel.

When it sees the correct message/code from the employee who claimed the nag, it verifies the action.

That employee receives:

> **5 raffle tokens**

for the cycle/month.

---

# Why the Double-Nag Works

The system creates two moments of interaction:

1. The portal says:
   > **NAG IS LIVE**
2. The employee claims it and is then given the message to post in Slack.

The employee becomes the person doing the nagging rather than management.

The verification code prevents someone from simply copying an old nag and claiming the reward.

The nag should be fun, brief, and workplace appropriate.

---

# Raffle Tokens

Employees can accumulate tokens during the four-week cycle.

The nag provides:

> **5 tokens**

The tokens increase an employee's chance of winning when the system determines the winner.

Other token rules can be added later, but the initial system should remain simple.

---

# PTO Bonus

Employees should not feel penalized for taking PTO.

If an employee takes:

> **3 or more PTO days during a week**

they may request:

> **1 additional raffle entry**

for that week's drawing/cycle.

The portal can provide a simple way to request the bonus.

The actual PTO eligibility determination can remain outside the core reporting system.

---

# Winner Handicap

To prevent the same person from winning repeatedly while avoiding harsh penalties:

If an employee wins one cycle, they receive:

> **-2 tokens in the following cycle**

Example:

- Jody wins Cycle 1.
- Jody starts Cycle 2 with -2 tokens.

This is intended as a light balancing mechanism, not a punishment.

---

# Growing Employee Counts

The system should support the employee population growing from 40 people to much larger numbers.

The basic model does not need to change.

Example:

### Cycle A
40 eligible employees

Winning number secretly selected from:

> 1–40

### Cycle B
55 eligible employees

Winning number secretly selected from:

> 1–55

### Cycle C
73 eligible employees

Winning number secretly selected from:

> 1–73

The winning number is selected based on the locked roster for that cycle.

This means the system scales naturally as the company grows.

---

# Important Fairness Rules

The following rules should be locked into the system:

1. The eligible roster is fixed for the cycle.
2. The winning number is selected secretly.
3. The winning number cannot be changed after the cycle begins.
4. Submission numbers are assigned strictly by recorded submission order.
5. Employees cannot manually select their submission number.
6. The winning number is not displayed.
7. The system records the timestamp of each submission.
8. The system records who received each submission number.
9. The system should maintain an audit trail.
10. Administrators should not be able to casually alter submission order after the fact.

The intent is to make the result easy to trust:

> **The system knows the rules, the employees know the rules, and nobody knows the winning position.**

---

# Example Four-Week Cycle

Suppose there are 40 eligible employees.

The system secretly selects:

> **Winning number: 12**

### Week 1

20 of 40 submit.

Participation:

> 50%

Weekly contribution:

> $12.50

### Week 2

32 of 40 submit.

Participation:

> 80%

Weekly contribution:

> $20.00

### Week 3

36 of 40 submit.

Participation:

> 90%

Weekly contribution:

> $22.50

### Week 4

All 40 submit by 7 PM.

Participation:

> 100%

Weekly contribution:

> $35.00

Total prize pool:

> $90.00

The employee who was the 12th submission during the cycle wins the $90 prize.

If that employee also earned tokens through the nag/PTO mechanisms, those tokens can be incorporated into the final winning calculation according to the finalized token rules.

---

# Design Philosophy

The system should remain intentionally lightweight.

It is **not** intended to:

- punish people for being late
- force people to submit hours early
- create a complicated points economy
- become a performance-management system
- replace management communication
- make employees constantly watch the portal

It **is** intended to:

- make the weekly report visible
- create a little fun
- provide a small financial incentive
- encourage participation
- let employees occasionally nag each other
- reward healthy use of PTO
- create anticipation around the four-week prize

The core idea is:

> **Do your report. Help the team get the prize bigger. Maybe you get lucky.**

---

# Potential Portal Components

A simple MVP could contain:

- Employee login
- Current four-week cycle
- Eligible employee count
- Submission count
- Participation percentage
- Current weekly pool
- Current four-week prize pool
- Friday deadline countdown
- Submission confirmation
- Secret winner configuration (admin only)
- Submission-order audit log
- Nag status
- Nag claim button
- Generated Slack message
- Slack verification
- Token balance
- PTO bonus request
- Previous winners
- Cycle history

---

# Potential Admin Components

Administrators could see:

- Current roster
- Submission history
- Submission timestamps
- Current participation
- Prize-pool calculation
- Secret winning number
- Winner
- Token ledger
- Nag activity
- PTO bonus requests
- Completed cycles
- Audit history

The secret winning number should never be exposed through the employee-facing interface or API.

---

# MVP Recommendation

Do not build everything at once.

A first version could be only:

1. Four-week cycles
2. Employee roster
3. Report submission tracking
4. Sequential submission numbers
5. Secret winning number
6. Participation-based $25 weekly pool
7. 50% minimum threshold
8. 7 PM / 8 PM / 9 PM participation bonus
9. Winner calculation
10. Simple leaderboard/progress display

Then add:

11. Friday random nag
12. Slack verification
13. Five-token nag reward
14. PTO bonus
15. -2 winner handicap

This keeps the first version small while preserving the interesting game mechanics.

---

# Open Rules to Finalize

A few details still need a final decision before implementation:

- Exactly how tokens affect winning probability.
- Whether the winner is selected directly from eligible submission positions or through a token-weighted mechanism.
- Whether unused prize money rolls into the next cycle.
- Whether multiple winners are ever possible.
- Exact treatment of employees who leave or join during a cycle.
- Exact handling of PTO and other approved absences.
- Exact Slack verification method.
- How the final prize is funded and paid.

These should be explicitly documented before the system goes live.

---

## One-Sentence Version

**Every four weeks, employees submit their required reports, their submission order secretly determines their raffle number, participation builds the cash prize, special Friday "nags" earn five tokens, and one secretly predetermined submission position wins the resulting prize.**
