"""Downloads daily candles for the 10 practice cases and writes data/cases.json
plus preview PNGs in data/preview/ so the decision points can be approved by hand.

Run: python3 scripts/fetch_data.py
Decision dates are approximate and meant to be checked against the previews.
Data comes from Yahoo Finance through yfinance: private testing only, not for distribution.
"""
import json
from pathlib import Path

import pandas as pd
import yfinance as yf

BEFORE, AFTER = 120, 60  # trading days before the decision point (inclusive) and after it

# id, ticker, approximate decision date, description (for the preview only)
CASES = [
    (1, '^GSPC', '2019-04-01', 'S&P 500, recovery after the Dec 2018 drop, successful buy'),
    (2, '^IXIC', '2000-03-10', 'Nasdaq, near the peak, better to wait'),
    (3, '^GSPC', '2008-09-15', 'S&P 500, falling and breaking support, better to wait'),
    (4, '^GSPC', '2020-02-19', 'S&P 500, before the crash, buy fails, stop hit'),
    (5, 'AAPL', '2019-06-03', 'Apple, uptrend and pullback, successful buy'),
    (6, 'META', '2021-11-01', 'Meta, after the peak, buy fails'),
    (7, 'NVDA', '2022-10-14', 'Nvidia, near the bottom, buy with a right stop succeeds'),
    (8, 'NFLX', '2011-07-15', 'Netflix, after the peak, better to wait'),
    (9, 'TSLA', '2021-06-01', 'Tesla, high volatility, tight stop hit then price continues'),
    (10, '^TA125.TA', '2022-09-01', 'TA-125, Israeli case, better to wait'),
]

root = Path(__file__).resolve().parent.parent
out = root / 'data'
(out / 'preview').mkdir(parents=True, exist_ok=True)


def load(ticker, date):
    t = pd.Timestamp(date)
    d = yf.Ticker(ticker).history(start=(t - pd.Timedelta(days=330)).strftime('%Y-%m-%d'),
                                  end=(t + pd.Timedelta(days=150)).strftime('%Y-%m-%d'),
                                  interval='1d', auto_adjust=False)
    d = d.dropna(subset=['Open', 'High', 'Low', 'Close'])
    d.index = d.index.tz_localize(None) if d.index.tz is not None else d.index
    return d


def preview(case, rows, k):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(9, 4.5))
    for i, r in enumerate(rows):
        c = '#1a9' if r['c'] >= r['o'] else '#d44'
        ax.plot([i, i], [r['l'], r['h']], color=c, lw=.8)
        ax.plot([i, i], [r['o'], r['c']], color=c, lw=3)
    ax.axvline(k, color='#c80', ls='--')
    ax.set_title(f"case {case[0]}: {case[1]} decision {rows[k]['d']}  ({case[3]})", fontsize=9)
    fig.tight_layout()
    fig.savefig(out / 'preview' / f'case{case[0]:02d}.png', dpi=110)
    plt.close(fig)


result = []
for case in CASES:
    cid, tk, date, _ = case
    d = load(tk, date)
    if d.empty:
        print(f'case {cid} {tk}: NO DATA')
        continue
    k_all = int(d.index.searchsorted(pd.Timestamp(date)))
    k_all = min(k_all, len(d) - 1)
    lo, hi = max(0, k_all - (BEFORE - 1)), min(len(d), k_all + AFTER + 1)
    rows = [{'d': ix.strftime('%Y-%m-%d'), 'o': round(float(r.Open), 2), 'h': round(float(r.High), 2),
             'l': round(float(r.Low), 2), 'c': round(float(r.Close), 2), 'v': int(r.Volume)}
            for ix, r in d.iloc[lo:hi].iterrows()]
    k = k_all - lo
    print(f'case {cid} {tk}: {len(rows)} candles, decision index {k} ({rows[k]["d"]}), after={len(rows) - 1 - k}')
    result.append({'id': cid, 'ticker': tk, 'decisionIndex': k, 'candles': rows})
    preview(case, rows, k)

(out / 'cases.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
print('wrote', out / 'cases.json')
