import csv

def show(path, cols):
    with open(path) as f:
        rows = list(csv.DictReader(f))
    print(path.split('/')[-1])
    print('-' * 70)
    header = '  '.join(c.ljust(14) for c in cols)
    print(header)
    for r in rows:
        vals = []
        for c in cols:
            v = r.get(c, '')
            try:
                vals.append(str(round(float(v), 4)).ljust(14))
            except:
                vals.append(str(v).ljust(14))
        print('  '.join(vals))
    print()

base = '/Users/nitesh/edullm/experiments/results/'

show(base + 'task1_main_comparison.csv',
     ['method','p_at_1','p_at_5','mrr','ndcg_at_10','n_chunks'])

show(base + 'task2_ablations.csv',
     ['method','p_at_1','p_at_5','mrr','ndcg_at_10'])

show(base + 'task5_latency.csv',
     ['method','n_chunks','index_time_ms','query_p50_ms','query_p95_ms'])
