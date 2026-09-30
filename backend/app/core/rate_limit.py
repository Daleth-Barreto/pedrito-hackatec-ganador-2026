import threading
import time
from collections import defaultdict, deque

from app.core.errors import AppError

attempts: dict[str, deque] = defaultdict(deque)
attempt_lock = threading.Lock()


def limit_attempts(key: str) -> None:
    now = time.monotonic()
    with attempt_lock:
        for address in list(attempts):
            while attempts[address] and now - attempts[address][0] > 300:
                attempts[address].popleft()
            if not attempts[address]:
                del attempts[address]
        if len(attempts[key]) >= 10:
            raise AppError(429, "rate_limited", "Demasiados intentos. Espera cinco minutos.")
        attempts[key].append(now)
