"""Small bounded in-memory store for short-lived synthesized WAV responses."""

from __future__ import annotations

import time
import uuid
from collections import OrderedDict
from threading import RLock
from dataclasses import dataclass


@dataclass(frozen=True)
class AudioItem:
    content: bytes
    expires_at: float


class AudioStore:
    def __init__(self, ttl_seconds: int = 600, max_items: int = 64) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_items = max_items
        self._items: OrderedDict[str, AudioItem] = OrderedDict()
        self._lock = RLock()

    def put(self, content: bytes) -> str:
        with self._lock:
            self._purge()
            audio_id = uuid.uuid4().hex
            self._items[audio_id] = AudioItem(content=content, expires_at=time.monotonic() + self.ttl_seconds)
            while len(self._items) > self.max_items:
                self._items.popitem(last=False)
            return audio_id

    def get(self, audio_id: str) -> bytes | None:
        with self._lock:
            self._purge()
            item = self._items.get(audio_id)
            return item.content if item else None

    def _purge(self) -> None:
        # Called only while holding the re-entrant lock.
        now = time.monotonic()
        for key in list(self._items):
            if self._items[key].expires_at <= now:
                self._items.pop(key, None)


AUDIO_STORE = AudioStore()
