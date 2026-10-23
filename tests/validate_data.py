"""
validate_data.py: verifica os dados do modulo de treino diretamente.
Não requer Chrome — valida exercises.js e programs.js via parse simples.
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
ids = re.findall(r"id:\s*'([^']+)'", exercises_src)
ids = [i for i in ids if i and '.' not in i]

if len(ids) == 24:
    ok("exercises › tem 24 exercícios")
else:
    fail("exercises › tem 24 exercícios", f"encontrado {len(ids)}: {ids}")

if len(set(ids)) == len(ids):
    ok("exercises › ids únicos")
else:
    fail("exercises › ids únicos", "ids duplicados encontrados")

required_ids = [
    'agachamento-livre','agachamento-sumo','afundo','avanco','ponte-gluteo',
    'elevacao-pelvica','flexao-braco','flexao-inclinada','prancha','prancha-lateral',
    'abdominal','abdominal-infra','mountain-climber','burpee','polichinelo',
    'corrida-parada','agachamento-salto','triceps-banco','superman','bird-dog',
    'escalador','afundo-bulgaro','panturrilha-pe','alongamento-gato-camelo'
]
missing = [i for i in required_ids if i not in ids]
if not missing:
    ok("exercises › todos os 24 exercícios requeridos presentes")
else:
    fail("exercises › todos os 24 exercícios requeridos presentes", f"faltando: {missing}")

for field in ['steps:', 'errors:', 'variations:', 'muscles:', 'difficulty:', 'pose:']:
    count = exercises_src.count(field)
    if count >= 24:
        ok(f"exercises › campo '{field}' em todos")
    else:
        fail(f"exercises › campo '{field}' em todos", f"encontrado {count}x (esperado ≥24)")

# ---- programs.js ----

programs_src = read('app/data/programs.js')
prog_ids = re.findall(r"id:\s*'([^']+)'", programs_src)
prog_ids = [i for i in prog_ids if i and '.' not in i]

if len(prog_ids) == 5:
    ok("programs › tem 5 programas")
else:
    fail("programs › tem 5 programas", f"encontrado {len(prog_ids)}")

required_prog_ids = ['full-body-iniciante','hiit-15min','mobilidade','core','terceira-idade']
missing_progs = [i for i in required_prog_ids if i not in prog_ids]
if not missing_progs:
    ok("programs › todos os 5 programas requeridos presentes")
else:
    fail("programs › todos os 5 programas requeridos presentes", f"faltando: {missing_progs}")

exercise_refs = re.findall(r"exerciseId:\s*'([^']+)'", programs_src)
bad_refs = [ref for ref in exercise_refs if ref not in ids]
if not bad_refs:
    ok(f"programs › todos exerciseIds existem ({len(exercise_refs)} refs)")
else:
    fail("programs › todos exerciseIds existem", f"inválidos: {bad_refs}")

# ---- router.js ----

router_src = read('app/js/router.js')
for route in ['/treino','/treino/programas','/treino/exercicio/:id','/treino/construtor','/treino/player/:id']:
    if route in router_src:
        ok(f"router › '{route}'")
    else:
        fail(f"router › '{route}'", "não encontrado")

# ---- sw.js PRECACHE ----

sw_src = read('app/sw.js')
for entry in ['./data/exercises.js','./data/programs.js','./js/audio.js','./js/wakelock.js',
              './js/modules/treino.js','./js/modules/player.js']:
    if entry in sw_src:
        ok(f"sw.js › PRECACHE '{entry}'")
    else:
        fail(f"sw.js › PRECACHE '{entry}'", "não encontrado")

# ---- config.js ----

config_src = read('config.js')
match = re.search(r'exercises:\s*(\d+)', config_src)
if match and int(match.group(1)) == 24:
    ok("config.js › exercises == 24")
else:
    fail("config.js › exercises == 24", f"encontrado: {match.group(1) if match else 'N/A'}")

# ---- arquivos existem ----

for fname in ['app/js/audio.js','app/js/wakelock.js','app/js/modules/treino.js','app/js/modules/player.js','app/data/exercises.js','app/data/programs.js']:
    if os.path.exists(os.path.join(BASE, fname)):
        ok(f"arquivo '{fname}' existe")
    else:
        fail(f"arquivo '{fname}' existe", "não encontrado")

# ---- home.js ----

home_src = read('app/js/modules/home.js')
if 'Treino sugerido' in home_src:
    ok("home.js › card 'Treino sugerido' presente")
else:
    fail("home.js › card 'Treino sugerido' presente", "não encontrado")

# ---- Summary ----

total = passed + failed
lines.append(f"ALL TESTS PASSED ({total})" if failed == 0 else f"FAILED: {failed} of {total}")
print('\n'.join(lines))
sys.exit(0 if failed == 0 else 1)
