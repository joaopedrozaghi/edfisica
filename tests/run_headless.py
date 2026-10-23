"""
run_headless.py: valida os dados e arquivos do módulo Treino em Casa.
Não requer Chrome — verifica exercises.js, programs.js, router.js, sw.js,
config.js e a existência de todos os arquivos criados neste step.
"""
import re, sys, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(path):
    with open(os.path.join(BASE, path), encoding='utf-8') as f:
        return f.read()

passed = 0
failed = 0
lines = []

def ok(name):
    global passed
    passed += 1
    lines.append(f"ok   {name}")

def fail(name, reason):
    global failed
    failed += 1
    lines.append(f"FAIL {name}\n     {reason}")

# ---- exercises.js ----

exercises_src = read('app/data/exercises.js')
ids = [i for i in re.findall(r"id:\s*'([^']+)'", exercises_src) if i and '.' not in i]

ok("exercises › tem 24 exercícios") if len(ids) == 24 else fail("exercises › tem 24 exercícios", f"encontrado {len(ids)}")
ok("exercises › ids únicos") if len(set(ids)) == len(ids) else fail("exercises › ids únicos", "duplicados")

required_ids = [
    'agachamento-livre','agachamento-sumo','afundo','avanco','ponte-gluteo',
    'elevacao-pelvica','flexao-braco','flexao-inclinada','prancha','prancha-lateral',
    'abdominal','abdominal-infra','mountain-climber','burpee','polichinelo',
    'corrida-parada','agachamento-salto','triceps-banco','superman','bird-dog',
    'escalador','afundo-bulgaro','panturrilha-pe','alongamento-gato-camelo'
]
missing = [i for i in required_ids if i not in ids]
ok("exercises › todos os 24 IDs presentes") if not missing else fail("exercises › todos os 24 IDs presentes", str(missing))

for field in ['steps:', 'errors:', 'variations:', 'muscles:', 'difficulty:', 'pose:']:
    c = exercises_src.count(field)
    ok(f"exercises › '{field}' ≥24×") if c >= 24 else fail(f"exercises › '{field}' ≥24×", f"encontrado {c}×")

# ---- programs.js ----

programs_src = read('app/data/programs.js')
prog_ids = [i for i in re.findall(r"id:\s*'([^']+)'", programs_src) if i and '.' not in i]

ok("programs › tem 5 programas") if len(prog_ids) == 5 else fail("programs › tem 5 programas", f"encontrado {len(prog_ids)}")
required_prog_ids = ['full-body-iniciante','hiit-15min','mobilidade','core','terceira-idade']
mp = [i for i in required_prog_ids if i not in prog_ids]
ok("programs › 5 IDs requeridos") if not mp else fail("programs › 5 IDs requeridos", str(mp))

refs = re.findall(r"exerciseId:\s*'([^']+)'", programs_src)
bad = [r for r in refs if r not in ids]
ok(f"programs › exerciseIds existem ({len(refs)} refs)") if not bad else fail("programs › exerciseIds existem", str(bad))

# ---- router.js ----

router_src = read('app/js/router.js')
for route in ['/treino','/treino/programas','/treino/exercicio/:id','/treino/construtor','/treino/player/:id']:
    ok(f"router › '{route}'") if route in router_src else fail(f"router › '{route}'", "não encontrado")

# ---- sw.js PRECACHE ----

sw_src = read('app/sw.js')
for entry in ['./data/exercises.js','./data/programs.js','./js/audio.js','./js/wakelock.js',
              './js/modules/treino.js','./js/modules/player.js']:
    ok(f"sw › '{entry}'") if entry in sw_src else fail(f"sw › '{entry}'", "não no PRECACHE")

# ---- config.js ----

config_src = read('config.js')
m = re.search(r'exercises:\s*(\d+)', config_src)
ok("config.js › exercises==24") if m and int(m.group(1)) == 24 else fail("config.js › exercises==24", m.group(1) if m else "não encontrado")

# ---- arquivos existem ----

for fname in ['app/js/audio.js','app/js/wakelock.js','app/js/modules/treino.js',
              'app/js/modules/player.js','app/data/exercises.js','app/data/programs.js']:
    ok(f"'{fname}' existe") if os.path.exists(os.path.join(BASE, fname)) else fail(f"'{fname}' existe", "não encontrado")

# ---- home.js ----

home_src = read('app/js/modules/home.js')
ok("home.js › 'Treino sugerido'") if 'Treino sugerido' in home_src else fail("home.js › 'Treino sugerido'", "não encontrado")

# ---- Summary ----

total = passed + failed
lines.append(f"ALL TESTS PASSED ({total})" if failed == 0 else f"FAILED: {failed} of {total}")
print('\n'.join(lines))
sys.exit(0 if failed == 0 else 1)
