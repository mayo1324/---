"""Adds 10 more real practice cases (ids 11 to 20) to data/cases.json.
Decision rules look ONLY at the 60 candles before the decision (no hindsight):
  downtrend (60 candle change below -6%) -> wait, unless the price bounced 3% or more off the 10-candle low -> enter, counter-trend
  price at the 10-candle low (no floor) -> wait; floor more than 8% below -> wait; otherwise -> enter
The future (60 candles after) only decides which examples we keep, so the set has wins, losses and missed rallies.
Data: Yahoo Finance via yfinance, private testing only, not for distribution.
Run: python3 scripts/pick_cases.py"""
import json, random
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
N, M, TREND = 60, 60, 6
NAMES = {'^DJI': 'מדד דאו ג\'ונס', '^RUT': 'מדד ראסל 2000', '^GDAXI': 'מדד DAX הגרמני', '^FTSE': 'מדד FTSE 100 הבריטי', '^N225': 'מדד ניקיי 225',
         'MSFT': 'מניית מיקרוסופט (MSFT)', 'AMZN': 'מניית אמזון (AMZN)', 'GOOGL': 'מניית גוגל (GOOGL)', 'JPM': 'מניית ג\'יי פי מורגן (JPM)',
         'KO': 'מניית קוקה קולה (KO)', 'XOM': 'מניית אקסון מוביל (XOM)', 'AMD': 'מניית AMD', 'INTC': 'מניית אינטל (INTC)', 'BA': 'מניית בואינג (BA)',
         'DIS': 'מניית דיסני (DIS)', 'NKE': 'מניית נייקי (NKE)', 'TEVA': 'מניית טבע (TEVA)', 'WMT': 'מניית וולמארט (WMT)', 'PFE': 'מניית פייזר (PFE)'}


def load(t):
    d = yf.Ticker(t).history(start='2003-01-01', end='2025-06-01', interval='1d', auto_adjust=False).dropna(subset=['Open', 'High', 'Low', 'Close'])
    d.index = d.index.tz_localize(None) if d.index.tz is not None else d.index
    return d


def features(d, k):
    seg = d.iloc[k - N + 1:k + 1]; f = 100 / seg.Close.iloc[-1]
    cl = seg.Close * f; ch60 = (cl.iloc[-1] / cl.iloc[0] - 1) * 100
    sw = 100 - (seg.Low.iloc[-10:] * f).min(); atr = ((seg.High - seg.Low) * f).iloc[-14:].mean()
    v = seg.Volume.values; avg = v.mean()
    vol = None
    if avg > 0:
        for w in (5, 3, 8, 10):
            r = v[-w:].mean() / avg
            if r >= 1.2: vol = (w, 'high', r); break
            if r <= .8: vol = (w, 'low', r); break
            if .93 <= r <= 1.07: vol = (w, 'normal', r); break
    return ch60, sw, atr, vol, f


def decide(ch60, sw):
    if ch60 < -TREND:
        return ('enter', 3) if 3 <= sw <= 8 else ('wait', 1)
    if sw < .5: return 'wait', 1
    if sw > 8: return 'wait', 2
    return 'enter', (1 if ch60 > TREND else 2)


def future(d, k, f, sw, atr):
    last = 100; stop = 100 - sw - .5 * atr; tgt = 100 + 2 * (100 - stop)
    res = 'none'
    for i in range(k + 1, k + M + 1):
        r = d.iloc[i]
        if r.Low * f <= stop: res = 'stop'; break
        if r.High * f >= tgt: res = 'target'; break
    end = (d.Close.iloc[k + M] * f - 100)
    return res, end


rows = []
random.seed(7)
for t in NAMES:
    try: d = load(t)
    except Exception as e: print('skip', t, e); continue
    if len(d) < N + M + 30: continue
    for k in range(N + 5, len(d) - M - 1, 17):
        ch60, sw, atr, vol, f = features(d, k)
        if vol is None or abs(abs(ch60) - TREND) < 1.5: continue  # clear volume answer and a clear trend label
        act, lvl = decide(ch60, sw)
        res, end = future(d, k, f, sw, atr)
        rows.append(dict(t=t, k=k, date=str(d.index[k].date()), ch60=ch60, sw=sw, atr=atr, vol=vol, act=act, lvl=lvl, res=res, end=end, d=d))
print(len(rows), 'candidates')
old = json.loads((ROOT / 'data' / 'cases.json').read_text(encoding='utf-8'))
taken = [(c['ticker'], c['candles'][c['decisionIndex']]['d'][:4]) for c in old]

WANT = [  # name, predicate
    ('enter L1 target', lambda r: r['act'] == 'enter' and r['lvl'] == 1 and r['res'] == 'target'),
    ('enter L1 stop', lambda r: r['act'] == 'enter' and r['lvl'] == 1 and r['res'] == 'stop'),
    ('wait downtrend then fell', lambda r: r['act'] == 'wait' and r['lvl'] == 1 and r['ch60'] < -TREND and r['end'] < -5),
    ('wait then rallied', lambda r: r['act'] == 'wait' and r['end'] > 6),
    ('wait stop too far', lambda r: r['act'] == 'wait' and r['lvl'] == 2 and r['sw'] > 8),
    ('enter L2 target', lambda r: r['act'] == 'enter' and r['lvl'] == 2 and r['res'] == 'target'),
    ('wait L2', lambda r: r['act'] == 'wait' and r['lvl'] == 2 and abs(r['ch60']) <= TREND + 4),
    ('counter-trend enter target', lambda r: r['act'] == 'enter' and r['lvl'] == 3 and r['res'] == 'target'),
    ('counter-trend enter stop', lambda r: r['act'] == 'enter' and r['lvl'] == 3 and r['res'] == 'stop'),
    ('volatile enter', lambda r: r['act'] == 'enter' and r['atr'] > 3.2 and r['res'] != 'none'),
]
chosen, used_t, used_y = [], set(), set()
for name, pred in WANT:
    pool = [r for r in rows if pred(r) and r['t'] not in used_t and (r['t'], r['date'][:4]) not in taken and r['date'][:4] not in used_y]
    if name == 'wait L2' and any(r['t'] == 'TEVA' for r in pool): pool = [r for r in pool if r['t'] == 'TEVA']  # one Israeli stock in the set
    if not pool: pool = [r for r in rows if pred(r) and (r['t'], r['date'][:4]) not in taken and (r['t'], r['date'][:4]) not in [(c['t'], c['date'][:4]) for c in chosen]]
    if not pool: print('NO CANDIDATE for', name); continue
    r = random.choice(pool); r['why'] = name; chosen.append(r); used_t.add(r['t']); used_y.add(r['date'][:4])

out = []
for i, r in enumerate(chosen):
    d, k = r['d'], r['k']; lo, hi = k - (120 - 1), k + 60 + 1
    sub = d.iloc[max(0, lo):hi]
    kk = k - max(0, lo)
    candles = [{'d': ix.strftime('%Y-%m-%d'), 'o': round(float(x.Open), 2), 'h': round(float(x.High), 2), 'l': round(float(x.Low), 2), 'c': round(float(x.Close), 2), 'v': int(x.Volume)} for ix, x in sub.iterrows()]
    w, ans, ratio = r['vol']
    out.append({'id': 11 + i, 'ticker': r['t'], 'decisionIndex': kk, 'candles': candles,
                'meta': {'asset': NAMES[r['t']], 'action': r['act'], 'level': r['lvl'], 'volW': w, 'volAns': ans, 'why': r['why']}})
    print(11 + i, r['t'], r['date'], r['why'], '| act', r['act'], 'L', r['lvl'], '| ch60 %.1f sw %.1f atr %.1f' % (r['ch60'], r['sw'], r['atr']), '| plan', r['res'], 'end %.1f' % r['end'], '| vol', w, ans, round(ratio, 2), '| candles', len(candles), 'idx', kk)
(ROOT / 'data' / 'cases_new.json').write_text(json.dumps(out, ensure_ascii=False), encoding='utf-8')
print('wrote data/cases_new.json')
