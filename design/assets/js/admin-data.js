/* ============================================================
   InsightXI Admin — seeded demo data (deterministic)
   ============================================================ */
(function () {
  function rng(s) { const x = Math.sin(s) * 10000; return x - Math.floor(x); }
  const pick = (arr, s) => arr[Math.floor(rng(s) * arr.length)];

  const FIRST = ['Liam', 'Olivia', 'Noah', 'Emma', 'Arjun', 'Priya', 'Wei', 'Mei', 'Sofia', 'Mateo', 'Yuki', 'Haruto', 'Aisha', 'Omar', 'Lucas', 'Chloe', 'Ethan', 'Ava', 'Daniel', 'Zara', 'Ravi', 'Ananya', 'Chen', 'Lin', 'Diego', 'Camila', 'Tomas', 'Elena', 'Felix', 'Nora', 'Idris', 'Fatima', 'Kwame', 'Ama', 'Sven', 'Ingrid', 'Marco', 'Giulia', 'Hassan', 'Layla', 'Jack', 'Grace', 'Hiro', 'Sakura', 'Pedro', 'Bianca', 'Sami', 'Leila', 'Andre', 'Maya', 'Tariq', 'Nadia', 'Carlos', 'Freya', 'Kofi', 'Sara'];
  const LAST = ['Patel', 'Smith', 'Nguyen', 'Kim', 'Garcia', 'Rossi', 'Tanaka', 'Khan', 'Mueller', 'Silva', 'Johnson', 'Wang', 'Okafor', 'Andersson', 'Costa', 'Haddad', 'Dubois', 'Ivanov', 'Santos', 'Reyes', 'Park', 'Bauer', 'Mbeki', 'Larsen', 'Romano', 'Yilmaz', 'Novak', 'Walsh', 'Mensah', 'Cohen', 'Fischer', 'Moreau', 'Sato', 'Ali', 'Brown', 'Lopez', 'Petrov', 'Adebayo', 'Jensen', 'Haddad'];
  const COUNTRIES = [['GB', 'United Kingdom'], ['US', 'United States'], ['IN', 'India'], ['NG', 'Nigeria'], ['BR', 'Brazil'], ['DE', 'Germany'], ['JP', 'Japan'], ['ES', 'Spain'], ['FR', 'France'], ['ZA', 'South Africa'], ['AU', 'Australia'], ['CA', 'Canada'], ['NL', 'Netherlands'], ['IT', 'Italy'], ['SE', 'Sweden'], ['AE', 'UAE'], ['EG', 'Egypt'], ['MX', 'Mexico'], ['AR', 'Argentina'], ['KR', 'South Korea']];
  const AV = ['#2e7dff', '#27e08a', '#19d3e3', '#9b7bff', '#e8c270', '#ff5b6b', '#ffb13d', '#5a9bff', '#54f0a6'];

  function initials(name) { const p = name.split(' '); return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function daysAgo(n) { const d = new Date('2026-05-31T12:00:00'); d.setDate(d.getDate() - n); return d; }
  function fmtDate(d) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function relTime(mins) {
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    if (mins < 1440) return Math.floor(mins / 60) + 'h ago';
    const d = Math.floor(mins / 1440); return d === 1 ? 'yesterday' : d + 'd ago';
  }

  // ---- Users ----
  const PLANS = ['Free', 'Free', 'Free', 'Premium', 'Premium', 'Trial'];
  const STATUSES = ['Active', 'Active', 'Active', 'Active', 'Pending', 'Suspended'];
  const ROLES = ['User', 'User', 'User', 'User', 'Analyst', 'Admin'];
  const users = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const s = i * 13 + 7;
    const fn = pick(FIRST, s), ln = pick(LAST, s * 2 + 1);
    const name = fn + ' ' + ln;
    const plan = pick(PLANS, s * 3 + 2);
    let status = pick(STATUSES, s * 5 + 3);
    let role = pick(ROLES, s * 7 + 4);
    if (i === 0) { role = 'Admin'; status = 'Active'; }
    const country = pick(COUNTRIES, s * 11 + 5);
    const signupDays = 2 + Math.floor(rng(s * 17 + 6) * 700);
    const lastMins = status === 'Suspended' ? 1440 * (8 + Math.floor(rng(s) * 40)) : Math.floor(rng(s * 19 + 7) * 1440 * 6);
    const preds = Math.floor(rng(s * 23 + 8) * (plan === 'Free' ? 90 : 540)) + 4;
    const logins = Math.floor(rng(s * 29 + 9) * 220) + 3;
    const spend = plan === 'Premium' ? (rng(s * 31) > 0.6 ? 79 : 9.99 * (1 + Math.floor(rng(s * 3) * 9))) : plan === 'Trial' ? 0 : 0;
    const flagged = rng(s * 37 + 11) > 0.88;
    users.push({
      id: 'usr_' + (1042 + i),
      name, email: (fn + '.' + ln).toLowerCase().replace(/[^a-z.]/g, '') + '@' + pick(['gmail.com', 'outlook.com', 'proton.me', 'icloud.com', 'yahoo.com'], s) ,
      avatar: initials(name), color: AV[i % AV.length],
      plan, status, role,
      cc: country[0], country: country[1],
      signup: daysAgo(signupDays), signupDays,
      lastMins, last: relTime(lastMins),
      predictions: preds, logins,
      devices: 1 + Math.floor(rng(s * 41) * 3),
      spend: +spend.toFixed(2),
      flagged,
      verified: rng(s * 43) > 0.12,
    });
  }

  // ---- KPIs / series ----
  const series = {
    userGrowth: [820, 905, 980, 1120, 1240, 1390, 1510, 1680, 1820, 2010, 2240, 2480].map((y, x) => ({ x, y })),
    revenue: [9.2, 11.0, 12.4, 13.1, 14.8, 16.2, 17.9, 19.4, 21.2, 23.8, 26.1, 28.4],
    accuracy: [69.1, 70.2, 69.8, 71.4, 70.9, 72.1, 71.8, 72.9, 73.0, 72.6, 73.2, 73.4],
    activeHourly: [120, 90, 60, 48, 70, 180, 320, 480, 540, 610, 720, 842, 790, 700, 640],
  };
  const kpis = {
    totalUsers: 12480, premium: 3210, trialing: 412, mrr: 28400, arr: 340800,
    accuracy: 73.4, activeNow: 842, churn: 2.1, arpu: 8.85, dau: 4120, openTickets: 18, picksToday: 24,
  };

  // ---- Transactions ----
  const TXSTAT = ['Paid', 'Paid', 'Paid', 'Paid', 'Failed', 'Refunded'];
  const txns = [];
  let ti = 0;
  users.filter(u => u.plan === 'Premium' || u.plan === 'Trial').slice(0, 22).forEach((u, i) => {
    const s = i * 9 + 3;
    const annual = rng(s) > 0.6;
    txns.push({
      id: 'in_' + (9100 + ti++), user: u, plan: annual ? 'Annual' : 'Monthly',
      amount: annual ? 79 : 9.99, status: pick(TXSTAT, s * 3 + 1),
      date: daysAgo(Math.floor(rng(s * 5) * 60)), method: pick(['Visa ··4291', 'Mastercard ··8830', 'PayPal', 'Apple Pay'], s),
    });
  });
  txns.sort((a, b) => b.date - a.date);

  // ---- Predictions / picks audit ----
  const D = window.IXData;
  const codes = D ? D.list : ['RVS', 'KGT', 'ASH', 'HRT', 'NTH', 'BRK', 'CLF', 'MRD'];
  const MARKETS = ['Match result', 'Over 2.5', 'BTTS', 'Double chance', 'Over 1.5'];
  const RESULTS = ['Hit', 'Hit', 'Hit', 'Miss', 'Pending', 'Pending'];
  const picks = [];
  for (let i = 0; i < 30; i++) {
    const s = i * 11 + 5;
    let h = codes[Math.floor(rng(s) * codes.length)], a = codes[Math.floor(rng(s * 2 + 1) * codes.length)];
    if (h === a) a = codes[(codes.indexOf(h) + 3) % codes.length];
    const conf = 55 + Math.floor(rng(s * 3 + 2) * 32);
    const res = i < 6 ? 'Pending' : pick(RESULTS, s * 5 + 3);
    picks.push({
      id: 'pk_' + (4400 + i), home: h, away: a, market: pick(MARKETS, s * 7 + 4),
      pick: rng(s) > .5 ? (D ? D.CLUBS[h].short : h) : 'Yes', conf, result: res,
      model: 'v4.2', date: daysAgo(Math.floor(rng(s * 13) * 14)),
    });
  }

  // ---- Content / posts ----
  const POSTS = [
    ['The pressing revolution: how counter-press wins titles', 'Tactical', 'Published', 18400],
    ['xG explained: reading the model behind the numbers', 'Analytics', 'Published', 24100],
    ['Five clubs overperforming their underlying data', 'Trends', 'Published', 12800],
    ['Set-piece intelligence: the hidden 41%', 'Tactical', 'Scheduled', 0],
    ['Fatigue modelling and the congested fixture list', 'Analytics', 'Draft', 0],
    ['Matchday 31 preview: every confidence pick', 'Preview', 'Published', 9600],
    ['How we calibrate confidence at InsightXI', 'Product', 'Draft', 0],
    ['Transition defence: the metric nobody tracks', 'Tactical', 'Published', 7300],
  ];
  const AUTHORS = ['Alex Mercer', 'Priya Raman', 'Daniel Cole', 'Sara Lindqvist'];
  const posts = POSTS.map((p, i) => ({
    id: 'post_' + (300 + i), title: p[0], category: p[1], status: p[2], views: p[3],
    author: AUTHORS[i % AUTHORS.length], date: daysAgo(Math.floor(rng(i * 7 + 2) * 40)),
  }));

  // ---- Support tickets ----
  const SUBJECTS = [
    ['Premium not unlocking after payment', 'Billing', 'High'],
    ['Confidence board not loading on iOS', 'Bug', 'High'],
    ['Request: export picks to CSV', 'Feature', 'Low'],
    ['Wrong scoreline shown for live match', 'Data', 'Medium'],
    ['Cancel subscription and refund', 'Billing', 'Medium'],
    ['Login link expired', 'Account', 'Low'],
    ['Push notifications not arriving', 'Bug', 'Medium'],
    ['Annual plan discount not applied', 'Billing', 'High'],
    ['Add La Liga coverage', 'Feature', 'Low'],
    ['Radar chart overlaps on tablet', 'Bug', 'Low'],
    ['Duplicate charge this month', 'Billing', 'High'],
    ['How is model accuracy calculated?', 'Question', 'Low'],
  ];
  const TSTAT = ['Open', 'Open', 'Pending', 'Pending', 'Closed'];
  const tickets = SUBJECTS.map((t, i) => {
    const s = i * 17 + 3; const u = users[(i * 5 + 2) % users.length];
    return {
      id: 'TKT-' + (2100 + i), subject: t[0], category: t[1], priority: t[2],
      status: i < 7 ? pick(['Open', 'Pending', 'Open'], s) : pick(TSTAT, s),
      user: u, assignee: i % 3 === 0 ? 'Unassigned' : AUTHORS[i % AUTHORS.length],
      updatedMins: Math.floor(rng(s * 3) * 1440 * 3), date: daysAgo(Math.floor(rng(s) * 12)),
    };
  });

  // ---- Audit log ----
  const ACTIONS = [
    ['suspended user', 'usr_1058'], ['changed plan to Premium', 'usr_1071'], ['published post', 'post_300'],
    ['refunded invoice', 'in_9104'], ['edited fixture', 'RVS v KGT'], ['featured match of the day', 'RVS v KGT'],
    ['invited team member', 'sara@insightxi.app'], ['updated role to Analyst', 'usr_1063'], ['closed ticket', 'TKT-2103'],
    ['exported users CSV', '64 records'], ['toggled feature flag', 'live_winprob'], ['deleted draft', 'post_307'],
    ['sent broadcast', '12,480 users'], ['impersonated user', 'usr_1049'], ['retrained model', 'v4.2'],
  ];
  const ADMINS = ['Alex Mercer', 'Priya Raman', 'Daniel Cole'];
  const audit = ACTIONS.map((a, i) => ({
    id: 'log_' + i, actor: ADMINS[i % ADMINS.length], action: a[0], target: a[1],
    mins: i * 47 + Math.floor(rng(i * 3) * 40), ip: '102.0.' + (10 + i) + '.' + (i * 7 % 250),
  }));

  // ---- Team / roles ----
  const team = [
    { name: 'Alex Mercer', email: 'alex@insightxi.app', role: 'Owner', last: 'just now', color: '#2e7dff' },
    { name: 'Priya Raman', email: 'priya@insightxi.app', role: 'Admin', last: '2h ago', color: '#27e08a' },
    { name: 'Daniel Cole', email: 'daniel@insightxi.app', role: 'Editor', last: 'yesterday', color: '#9b7bff' },
    { name: 'Sara Lindqvist', email: 'sara@insightxi.app', role: 'Analyst', last: '3d ago', color: '#e8c270' },
    { name: 'Marco Romano', email: 'marco@insightxi.app', role: 'Support', last: '5h ago', color: '#19d3e3' },
  ];
  const flags = [
    { key: 'live_winprob', name: 'Live win-probability tracker', on: true, desc: 'Real-time stacked win-prob on live matches' },
    { key: 'mobile_pwa', name: 'Mobile PWA install prompt', on: true, desc: 'Show add-to-home-screen banner' },
    { key: 'sure_win_v2', name: 'Sure-Win board v2', on: false, desc: 'New confidence ranking algorithm' },
    { key: 'laliga', name: 'La Liga coverage', on: false, desc: 'Enable Spanish top-flight fixtures' },
    { key: 'ai_assistant', name: 'AI match assistant (beta)', on: true, desc: 'Conversational match intel' },
  ];

  window.AdminData = {
    users, kpis, series, txns, picks, posts, tickets, audit, team, flags,
    fmtDate, relTime, daysAgo, COUNTRIES,
  };
})();
